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

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// Initialize Resend with API key
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
    // Query Firestore to check if the username exists
    const usersRef = collection(db, "users"); // Correctly reference the "users" collection
    const q = query(usersRef, where("username", "==", username)); // Create a query
    const querySnapshot = await getDocs(q); // Execute the query

    if (!querySnapshot.empty) {
      logger(`Username "${username}" is already taken`);
      res.json({ available: false }); // Username is already in use
    } else {
      logger(`Username "${username}" is available`);
      res.json({ available: true }); // Username is available
    }
  } catch (error) {
    logger(`Error checking username "${username}": ${error.message}`);
    console.error("Error checking username:", error);
    res
      .status(500)
      .json({ available: false, message: "Internal server error" });
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
    // Send email using Resend
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

    // Store invitation in Firebase
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

// Create a function to start the server and handle port conflicts
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
          resolve(startServer(port + 1)); // Try the next port
        } else {
          reject(err);
        }
      });
  });
}

// Start the server with port 3000 initially
startServer(3000).catch((err) => {
  logger("Failed to start server:", err);
});
