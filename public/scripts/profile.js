import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

import { signOut } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

const db = getFirestore();
let currentUser = null;
let userWeight = null;

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

  // Add goal selection change handler
  document
    .getElementById("fitness_goal")
    ?.addEventListener("change", handleGoalChange);

  // Add tab switching functionality
  setupTabNavigation();
});

// Setup tab navigation
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll(".tab-button");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all tabs and buttons
      document.querySelectorAll(".tab-content").forEach((tab) => {
        tab.classList.remove("active");
      });

      tabButtons.forEach((btn) => {
        btn.classList.remove("active");
      });

      // Add active class to clicked button
      button.classList.add("active");

      // Show the corresponding tab
      const tabId = button.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
    });
  });
}

// Handle fitness goal selection change
function handleGoalChange() {
  const fitnessGoal = document.getElementById("fitness_goal").value;
  const targetWeightInput = document.getElementById("target_weight");
  // Get the parent form-group of target weight for showing/hiding
  const targetWeightGroup = targetWeightInput?.closest(".form-group");

  if (fitnessGoal === "maintain_weight") {
    if (targetWeightInput) {
      targetWeightInput.value = userWeight;
    }
    if (targetWeightGroup) {
      targetWeightGroup.style.display = "none";
    }
  } else if (fitnessGoal === "lose_weight" || fitnessGoal === "build_muscle") {
    if (targetWeightGroup) {
      targetWeightGroup.style.display = "flex";
    }
  } else {
    if (targetWeightGroup) {
      targetWeightGroup.style.display = "none";
    }
  }
}

// Load user data from Firestore
async function loadUserData() {
  try {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();

      // Populate form fields
      document.getElementById("username").value = data.username || "";
      document.getElementById("forename").value = data.forename || "";
      document.getElementById("surname").value = data.surname || "";
      // Use the correct field names from signup form (current_height and current_weight)
      document.getElementById("height").value =
        data.current_height || data.height || "";
      document.getElementById("sex").value = data.sex || "";
      document.getElementById("dob").value = data.date_of_birth || "";
      document.getElementById("email").value = data.email || "";

      // Set weight value and store it for reference
      userWeight = data.current_weight || data.weight || "";
      document.getElementById("currentWeight").value = userWeight;

      // Calculate and populate BMI
      const height = parseFloat(data.current_height || data.height || "0");
      const weight = parseFloat(userWeight || "0");
      if (height > 0 && weight > 0) {
        const bmi = calculateBMI(height, weight);
        document.getElementById("bmi").value = bmi;
      } else {
        document.getElementById("bmi").value = ""; // Clear BMI field if data is invalid
      }

      // Set fitness goal and target weight
      const fitnessGoal = data.fitness_goal || "";
      document.getElementById("fitness_goal").value = fitnessGoal;

      // Handle target weight
      const goalData = data.goal_data || {};
      const targetWeight = goalData.target_weight || "";
      document.getElementById("target_weight").value = targetWeight;

      // Show/hide target weight field based on goal
      handleGoalChange();
    } else {
      console.log("No user document found in Firestore.");
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    showMessage("Error loading profile data", true);
  }
}

// Save profile changes
document.getElementById("saveButton").addEventListener("click", async () => {
  try {
    // Get fitness goal and target weight
    const fitnessGoal = document.getElementById("fitness_goal").value;
    let targetWeight = document.getElementById("target_weight").value;
    const currentWeight = document.getElementById("currentWeight").value;
    const height = document.getElementById("height").value;

    // Calculate BMI for display
    const bmi = calculateBMI(parseFloat(height), parseFloat(currentWeight));
    document.getElementById("bmi").value = bmi !== "NaN" ? bmi : "";

    // If maintaining weight, use current weight as target
    if (fitnessGoal === "maintain_weight") {
      targetWeight = currentWeight;
    }

    // Validate target weight if provided
    if (targetWeight && parseFloat(targetWeight) <= 0) {
      showMessage("Target weight must be greater than 0", true);
      return;
    }

    const userData = {
      username: document.getElementById("username").value,
      forename: document.getElementById("forename").value,
      surname: document.getElementById("surname").value,
      height: document.getElementById("height").value,
      current_height: document.getElementById("height").value, // Add current_height field
      sex: document.getElementById("sex").value,
      date_of_birth: document.getElementById("dob").value,
      // location property removed as requested
      email: document.getElementById("email").value,
      weight: currentWeight,
      current_weight: currentWeight, // Add current_weight field
      fitness_goal: fitnessGoal,
      goal_data: {
        start_date: serverTimestamp(),
        goal_type: fitnessGoal,
        target_weight: targetWeight || null,
      },
      units: "Metric", // Default to Metric since units selection was removed
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

// Add change password functionality
document.getElementById("change-password")?.addEventListener("click", () => {
  window.location.href = "/Password-Reset.html";
});

// Fix radio button IDs and add name attribute
document.addEventListener("DOMContentLoaded", () => {
  const metricRadio = document.querySelector('input[value="Metric"]');
  const imperialRadio = document.querySelector('input[value="Imperial"]');

  if (metricRadio && imperialRadio) {
    metricRadio.id = "metricUnits";
    imperialRadio.id = "imperialUnits";
    metricRadio.name = "units";
    imperialRadio.name = "units";
  }
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
    const saveContainer = document.querySelector(".save-container");
    saveContainer.insertBefore(
      messageEl,
      document.getElementById("saveButton")
    );
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

// Helper function to calculate BMI
function calculateBMI(height, weight) {
  // Convert height from cm to meters for metric calculations
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(2);
}

// Update BMI when height or weight changes
document.addEventListener("DOMContentLoaded", () => {
  const heightInput = document.getElementById("height");
  const weightInput = document.getElementById("currentWeight");
  const bmiInput = document.getElementById("bmi");

  // Make BMI field read-only
  bmiInput.readOnly = true;

  // Add event listeners to recalculate BMI when values change
  heightInput?.addEventListener("input", updateBMI);
  weightInput?.addEventListener("input", updateBMI);

  function updateBMI() {
    const height = parseFloat(heightInput.value || "0");
    const weight = parseFloat(weightInput.value || "0");

    if (height > 0 && weight > 0) {
      bmiInput.value = calculateBMI(height, weight);
    } else {
      bmiInput.value = "";
    }
  }
});
