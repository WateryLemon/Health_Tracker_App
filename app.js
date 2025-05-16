const express = require("express");
const bodyParser = require("body-parser");
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} = require("firebase/firestore");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { Resend } = require("resend");

// Setup logging with timestamps
const logger = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

logger("Initializing Health Tracker application...");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

const firebaseConfig = {
  apiKey: "AIzaSyCQiV6-wvqLWa9NHatHsu9AE3zcb4FqmOI",
  authDomain: "health-tracker-fa572.firebaseapp.com",
  projectId: "health-tracker-fa572",
  storageBucket: "health-tracker-fa572.firebasestorage.app",
  messagingSenderId: "277390438554",
  appId: "1:277390438554:web:8ce3ec3a1ef13b20aaef23",
  measurementId: "G-SRHMFGLNN2",
};

// Initialise firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const resend = new Resend("re_iYoehaUZ_6nktERHCK8EGketG2xAfSeJy");

// Verify Resend configuration
// (async function testResendConnection() {
//   try {
//     await resend.emails.send({
//       from: "Health Tracker <onboarding@resend.dev>",
//       to: "healthtracker103@gmail.com",
//       subject: "Resend Test",
//       html: "<p>Testing Resend integration</p>",
//     });
//     console.log("Email server is ready to send messages");
//   } catch (error) {
//     console.error("Email configuration error:", error);
//   }
// })();

// Route to check if a username is already in use
app.get("/check-username", async (req, res) => {
  const username = req.query.username;
  logger(`Checking username availability: ${username}`);

  try {
    // Query firestore to check if username exists
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      logger(`Username "${username}" is already taken`);
      res.json({ available: false }); // Username already in use
    } else {
      logger(`Username "${username}" is available`);
      res.json({ available: true }); // Username available
    }
  } catch (error) {
    logger(`Error checking username "${username}": ${error.message}`);
    console.error("Error checking username:", error);
    res
      .status(500)
      .json({ available: false, message: "Internal server error" });
  }
});

// Route to check if group name is already in use
app.get("/check-group-name", async (req, res) => {
  const groupName = req.query.name;
  logger(`Checking group name availability: ${groupName}`);

  if (!groupName || groupName.trim().length === 0) {
    return res.status(400).json({
      available: false,
      message: "Group name is required",
    });
  }

  try {
    const normalizedName = groupName.toLowerCase().trim();

    const groupsRef = collection(db, "groups");
    const q = query(groupsRef, where("normalizedName", "==", normalizedName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      logger(`Group name "${groupName}" is available`);
      res.json({
        available: true,
      });
    } else {
      const existingGroup = querySnapshot.docs[0].data();
      logger(
        `Group name "${groupName}" conflicts with existing group "${existingGroup.name}"`
      );
      res.json({
        available: false,
        existingName: existingGroup.name,
      });
    }
  } catch (error) {
    logger(`Error checking group name "${groupName}": ${error.message}`);
    console.error("Error checking group name:", error);
    res.status(500).json({
      available: false,
      message: "Internal server error",
    });
  }
});

// POST route to handle sign up
app.post("/submit", async (req, res) => {
  const {
    username,
    email,
    forename,
    surname,
    current_height,
    current_weight,
    sex,
    date_of_birth,
    uid,
  } = req.body;

  logger(`Processing sign-up request for user: ${username} (${email})`);

  try {
    if (!uid) {
      logger("Sign-up error: No user ID provided");
      throw new Error("No user ID provided");
    }

    await setDoc(doc(db, "users", uid), {
      username,
      email,
      forename,
      surname,
      current_height,
      current_weight,
      height: current_height,
      weight: current_weight,
      sex,
      date_of_birth,
      created_at: serverTimestamp(),
      units: "Metric",
    });

    res.json({ success: true, message: "User successfully created" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST route to handle sign in
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    res.json({
      success: true,
      message: "Successfully signed in",
      uid: user.uid,
    });
  } catch (error) {
    console.error("Error signing in:", error);
    res.status(401).json({ success: false, message: error.message });
  }
});

// POST route to send group invitations via email
app.post("/api/invite", async (req, res) => {
  const { recipientEmail, groupName, groupCode, senderName } = req.body;

  logger(
    `Processing invitation email to ${recipientEmail} for group "${groupName}" (code: ${groupCode})`
  );

  try {
    //send email using resend
    logger(`Attempting to send invitation email to ${recipientEmail}`);
    const emailResponse = await resend.emails.send({
      from: "Health Tracker <onboarding@healthtracker103.tech>",
      to: recipientEmail,
      subject: `${senderName} invited you to join ${groupName} on Health Tracker`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to join a health group!</h2>
          <p>${senderName} has invited you to join <strong>${groupName}</strong> on Health Tracker App.</p>
          <p>Use this code to join the group: <strong>${groupCode}</strong></p>
          <p>To join:</p>
          <ol>
            <li>Sign in to your Health Tracker account (or sign up if you don't have one)</li>
            <li>Go to the Groups page</li>
            <li>Click "Join a Group" and enter the code above</li>
          </ol>
          <p>Start tracking your health goals together!</p>
          <p>- The Health Tracker Team</p>
        </div>
      `,
    });

    console.log("Email response:", emailResponse);

    logger(
      `Email sent successfully to ${recipientEmail}, ID: ${emailResponse.id || "unknown"}`
    );

    //Store invitation in firebase
    logger(
      `Storing invitation record in Firestore for email: ${recipientEmail}`
    );
    const invitationRef = await addDoc(collection(db, "group_invitations"), {
      groupCode,
      recipientEmail,
      senderUserId: req.body.senderUserId,
      sentAt: serverTimestamp(),
      status: "sent",
    });

    logger(`Invitation record created with ID: ${invitationRef.id}`);
    res.json({ success: true, message: "Invitation email sent successfully" });
  } catch (error) {
    logger(
      `ERROR sending invitation email to ${recipientEmail}: ${error.message}`
    );
    console.error("Error sending invitation email:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST route to send goal invitations via email
app.post("/api/send-goal-invite", async (req, res) => {
  const {
    recipientEmail,
    groupName,
    goalTitle,
    goalJoinCode,
    senderName,
    isExistingGoal,
  } = req.body;

  const isForExistingGoal = isExistingGoal === true;

  logger(
    `Processing goal invitation email to ${recipientEmail} for "${goalTitle}" in group "${groupName}" (code: ${goalJoinCode})`
  );

  try {
    //send email using resend
    logger(`Attempting to send goal invitation email to ${recipientEmail}`);

    const subject = isForExistingGoal
      ? `Join existing goal "${goalTitle}" in ${groupName} group`
      : `${senderName} created a new goal "${goalTitle}" in ${groupName}`;

    const headingText = isForExistingGoal
      ? "Join Existing Group Goal"
      : "New Group Goal Created!";

    const introText = isForExistingGoal
      ? `You've joined the <strong>${groupName}</strong> group which has an existing goal: <strong>"${goalTitle}"</strong>.`
      : `${senderName} has created a new goal <strong>"${goalTitle}"</strong> in the <strong>${groupName}</strong> group.`;

    const emailResponse = await resend.emails.send({
      from: "Health Tracker <onboarding@healthtracker103.tech>",
      to: recipientEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${headingText}</h2>
          <p>${introText}</p>
          <div style="background-color: #f0f7ff; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
            <p style="font-weight: bold; margin-top: 0;">Important: You must use this code to track the goal</p>
            <p style="font-size: 20px; background-color: #fff; padding: 10px; border: 1px dashed #3498db; text-align: center;"><strong>${goalJoinCode}</strong></p>
          </div>
          <p>To join this goal:</p>
          <ol>
            <li>Sign in to your Health Tracker account</li>
            <li>Go to the Groups page</li>
            <li>Open the ${groupName} group</li>
            <li>Go to the "Group Goals" tab</li>
            <li>Enter the goal join code above in the "Join a Goal" section</li>
          </ol>
          <p>Track your fitness journey together!</p>
          <p>- The Health Tracker Team</p>
        </div>
      `,
    });

    logger(`Goal invitation email sent successfully to ${recipientEmail}`);
    res.json({ success: true, id: emailResponse.id });
  } catch (error) {
    logger(`Error sending goal invitation email: ${error.message}`);
    console.error("Full error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to send invitation email" });
  }
});

// POST route to create new group with atomic transaction
app.post("/api/groups", async (req, res) => {
  const { name, description, code, userId, fitnessGoal, targetWeight } =
    req.body;

  logger(`Attempting to create group: "${name}" by user: ${userId}`);

  if (!name || !userId) {
    return res.status(400).json({
      success: false,
      message: "Group name and user ID are required",
    });
  }

  try {
    const normalizedName = name.toLowerCase().trim();

    // Check if group with this name already exists
    const groupsRef = collection(db, "groups");
    // Query by normalized name for exact matching
    const q = query(groupsRef, where("normalizedName", "==", normalizedName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const existingGroup = querySnapshot.docs[0].data();
      logger(
        `Group creation failed: Name "${name}" already exists as "${existingGroup.name}"`
      );
      return res.status(409).json({
        success: false,
        message: `A group named "${existingGroup.name}" already exists. Please choose a different name.`,
      });
    }

    // Create new document reference
    const groupRef = doc(collection(db, "groups"));
    const groupId = groupRef.id;

    // Create group with normalized name field
    await setDoc(groupRef, {
      name,
      normalizedName,
      description,
      code,
      createdBy: userId,
      createdAt: serverTimestamp(),
      memberCount: 1,
      fitnessGoal: fitnessGoal || null,
      targetWeight: targetWeight || null,
    });

    //add creator as a member
    await setDoc(doc(db, "group_memberships", `${groupId}_${userId}`), {
      userId,
      groupId,
      joinedAt: serverTimestamp(),
      role: "admin",
    });
    logger(`Group "${name}" created successfully with ID: ${groupId}`);
    res.json({
      success: true,
      message: "Group created successfully",
      groupId,
    });
  } catch (error) {
    logger(`Error creating group "${name}": ${error.message}`);
    console.error("Error creating group:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create function to start server and handle port conflicts
function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = app
      .listen(port, () => {
        logger(`Express running → PORT ${server.address().port}`);
        resolve(server);
      })
      .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          logger(`Port ${port} is busy, trying port ${port + 1}`);
          resolve(startServer(port + 1)); // Try next port
        } else {
          reject(err);
        }
      });
  });
}

// Start server with port 3000 initially
startServer(3000).catch((err) => {
  logger("Failed to start server:", err);
});
