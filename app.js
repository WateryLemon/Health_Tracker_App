const express = require("express");
const bodyParser = require("body-parser");
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} = require("firebase/firestore");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");

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

// POST route to handle sign up
app.post("/submit", async (req, res) => {
  const {
    username,
    email,
    current_height,
    current_weight,
    sex,
    date_of_birth,
  } = req.body;

  try {
    // Create the user document in Firestore using the uid from the request
    const uid = req.body.uid;
    if (!uid) {
      throw new Error("No user ID provided");
    }

    await setDoc(doc(db, "users", uid), {
      username,
      email,
      current_height,
      current_weight,
      sex,
      date_of_birth,
      created_at: serverTimestamp(),
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

const server = app.listen(3000, () => {
  console.log(`Express running → PORT ${server.address().port}`);
});
