import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

import { signOut } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

const db = getFirestore();
let currentUser = null;

// Load user data when the page loads
document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in
  const auth = window.auth;
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      await loadUserData();
    } else {
      // Redirect to sign in if not logged in
      window.location.href = "/sign-in.html";
    }
  });

  // Add sign out button handler
  document
    .getElementById("signOutButton")
    ?.addEventListener("click", handleSignOut);
});

// Load user data from Firestore
async function loadUserData() {
  try {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();

      // Populate form fields
      document.getElementById("username").value = data.username || "";
      document.getElementById("height").value = data.current_height || "";
      document.getElementById("sex").value = data.sex || "";
      document.getElementById("dob").value = data.date_of_birth || "";
      document.getElementById("location").value = data.location || "";
      document.getElementById("email").value = data.email || "";

      // Set units radio button
      const unitValue = data.units || "Metric";
      document.querySelector(`input[value="${unitValue}"]`).checked = true;
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    showMessage("Error loading profile data", true);
  }
}

// Save profile changes
document.getElementById("saveButton").addEventListener("click", async () => {
  try {
    const userData = {
      username: document.getElementById("username").value,
      current_height: document.getElementById("height").value,
      sex: document.getElementById("sex").value,
      date_of_birth: document.getElementById("dob").value,
      location: document.getElementById("location").value,
      email: document.getElementById("email").value,
      units:
        document.querySelector('input[name="units"]:checked')?.value ||
        "Metric",
      updated_at: new Date(),
    };

    // Validate required fields
    if (!userData.username || !userData.email) {
      showMessage("Username and email are required", true);
      return;
    }

    // Update user document in Firestore
    await updateDoc(doc(db, "users", currentUser.uid), userData);
    showMessage("Profile updated successfully");
  } catch (error) {
    console.error("Error saving profile:", error);
    showMessage("Error saving profile", true);
  }
});

// Fix radio button IDs and add name attribute
document.addEventListener("DOMContentLoaded", () => {
  const metricRadio = document.querySelector('input[value="Metric"]');
  const imperialRadio = document.querySelector('input[value="Imperial"]');

  metricRadio.id = "metricUnits";
  imperialRadio.id = "imperialUnits";
  metricRadio.name = "units";
  imperialRadio.name = "units";
});

// Add sign out functionality
async function handleSignOut() {
  try {
    await signOut(window.auth);
    window.location.href = "/sign-in.html";
  } catch (error) {
    console.error("Error signing out:", error);
    showMessage("Error signing out", true);
  }
}

// Helper function to show messages
function showMessage(message, isError = false) {
  // Create message element if it doesn't exist
  let messageEl = document.getElementById("message");
  if (!messageEl) {
    messageEl = document.createElement("div");
    messageEl.id = "message";
    document
      .getElementById("profileBody")
      .insertBefore(messageEl, document.getElementById("saveButton"));
  }

  messageEl.textContent = message;
  messageEl.style.color = isError ? "#ff0000" : "#4CAF50";
  messageEl.style.marginBottom = "10px";
  messageEl.style.textAlign = "center";

  // Clear message after 3 seconds
  setTimeout(() => {
    messageEl.textContent = "";
  }, 3000);
}

//For password resets
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const handleResetPassword = () => {
  const auth = getAuth();
  const email = "user@example.com"; // Get this from user input

  sendPasswordResetEmail(auth, email)
    .then(() => {
      alert("Password reset email sent!");
    })
    .catch((error) => {
      console.error("Error sending reset email:", error.message);
    });
};
