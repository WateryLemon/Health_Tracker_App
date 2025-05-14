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
let initialWeight = null;

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
  });  // Add sign out button handler
  document
    .getElementById("signOutButton")
    ?.addEventListener("click", handleSignOut);

  // Add fitness goal tab change listener
  document
    .getElementById("fitness_goal_tab")
    ?.addEventListener("change", function() {
      const selectedGoal = this.value;
      console.log("Goal changed to:", selectedGoal);
      
      // Reset the initial weight when goal type changes
      resetInitialWeightForGoal();
        // Update the target weight options and visibility
      handleGoalChangeTab();
    });
  // Add tab switching functionality
  setupTabNavigation();
    // Add event listeners for updating progress bar
  const targetWeightTabInput = document.getElementById("target_weight_tab");
  const currentWeightInput = document.getElementById("currentWeight");
  
  if (targetWeightTabInput) {
    targetWeightTabInput.addEventListener("input", updateProgressFromInputs);
  }
    if (currentWeightInput) {
    currentWeightInput.addEventListener("input", function() {
      // Don't automatically update target weight for maintain weight goal when current weight changes
      updateProgressFromInputs();
    });
  }
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

// Handle fitness goal selection change (simplified as fitness_goal has been removed)
function handleGoalChange() {
  // This function is kept as a placeholder for any future goal-related changes
  // but currently doesn't need to do anything since fitness_goal was removed
}

// Handle fitness goal selection change in Goals tab
function handleGoalChangeTab() {
  const fitnessGoal = document.getElementById("fitness_goal_tab").value;
  const targetWeightInput = document.getElementById("target_weight_tab");
  // Get the parent form-group of target weight for showing/hiding
  const targetWeightGroup = document.getElementById("target_weight_group_tab");  if (fitnessGoal === "maintain_weight") {
    if (targetWeightInput) {
      // Only set target weight to initial weight if it hasn't been set yet
      if (!targetWeightInput.value || targetWeightInput.value === "") {
        targetWeightInput.value = initialWeight;
      }
      
      // Update the target weight display based on the current input value
      const targetWeightDisplay = document.getElementById("target-weight-display");
      if (targetWeightDisplay && targetWeightInput.value) {
        targetWeightDisplay.textContent = `Target: ${targetWeightInput.value} kg`;
      }
    }
    if (targetWeightGroup) {
      // Still hide the input field since it's not editable for maintain weight
      targetWeightGroup.style.display = "none";
    }
  } else if (fitnessGoal === "lose_weight" || fitnessGoal === "build_muscle" || fitnessGoal === "gain_weight") {
    if (targetWeightGroup) {
      targetWeightGroup.style.display = "block";
    }
    
    // Set a default target weight if none is set
    if (targetWeightInput && (!targetWeightInput.value || targetWeightInput.value === "0")) {
      if (fitnessGoal === "lose_weight") {
        // Default to 5kg less
        targetWeightInput.value = Math.max(45, parseFloat(userWeight) - 5).toFixed(2);
      } else if (fitnessGoal === "gain_weight" || fitnessGoal === "build_muscle") {
        // Default to 5kg more
        targetWeightInput.value = (parseFloat(userWeight) + 5).toFixed(2);
      }
    }
  } else {
    if (targetWeightGroup) {
      targetWeightGroup.style.display = "none";
    }
  }
  // Update progress bar whenever goal changes
  const progress = calculateGoalProgress(
    document.getElementById("currentWeight").value,
    targetWeightInput.value
  );
  updateProgressBar(progress);
  
  // Make sure to update all the progress info displays
  updateProgressFromInputs();
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
      document.getElementById("email").value = data.email || "";      // Set weight value and store it for reference
      userWeight = data.current_weight || data.weight || "";
      document.getElementById("currentWeight").value = userWeight;
      
      // Store initial weight from goal data if it exists, or use current weight
      initialWeight = data.goal_data?.initial_weight || userWeight;

      // Calculate and populate BMI
      const height = parseFloat(data.current_height || data.height || "0");
      const weight = parseFloat(userWeight || "0");
      if (height > 0 && weight > 0) {
        const bmi = calculateBMI(height, weight);
        document.getElementById("bmi").value = bmi;
      } else {
        document.getElementById("bmi").value = ""; // Clear BMI field if data is invalid
      }      // Set fitness goal
      const fitnessGoal = data.fitness_goal || "";
      document.getElementById("fitness_goal_tab").value = fitnessGoal;// Handle target weight
      const goalData = data.goal_data || {};
      const targetWeight = goalData.target_weight || "";
      document.getElementById("target_weight_tab").value = targetWeight;// Populate Goals tab data
      if (goalData.target_date) {
        document.getElementById("target_date").value = formatDateForInput(goalData.target_date);
      }
        // Activity level has been removed// Update progress bar and info displays
      updateProgressFromInputs();

      // Show/hide target weight field based on goal
      handleGoalChangeTab();
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
  try {    // Get fitness goal and target weight
    const fitnessGoal = document.getElementById("fitness_goal_tab").value;
    let targetWeight = document.getElementById("target_weight_tab").value;
    const currentWeight = document.getElementById("currentWeight").value;
    const height = document.getElementById("height").value;

    // Calculate BMI for display
    const bmi = calculateBMI(parseFloat(height), parseFloat(currentWeight));
    document.getElementById("bmi").value = bmi !== "NaN" ? bmi : "";  // If maintaining weight, only set target weight to initial weight if it hasn't been manually changed
    if (fitnessGoal === "maintain_weight") {
      // Only update the value if the field is empty or hasn't been manually changed
      const currentTargetValue = document.getElementById("target_weight_tab").value;
      if (!currentTargetValue || currentTargetValue === "") {
        targetWeight = initialWeight;
        document.getElementById("target_weight_tab").value = initialWeight;
        
        // Update the target weight display
        const targetWeightDisplay = document.getElementById("target-weight-display");
        if (targetWeightDisplay && initialWeight) {
          targetWeightDisplay.textContent = `Target: ${initialWeight} kg`;
        }
      } else {
        // Use the current value if it's already been set (manually or otherwise)
        targetWeight = currentTargetValue;
      }
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
      fitness_goal: fitnessGoal,      goal_data: {
        start_date: serverTimestamp(),
        goal_type: fitnessGoal,
        initial_weight: initialWeight || currentWeight, // Store initial weight for progress tracking
        target_weight: targetWeight || null,
        target_date: document.getElementById("target_date").value || null,
        progress: calculateGoalProgress(
          currentWeight, 
          targetWeight
        )
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

// Helper function to format date for HTML date input
function formatDateForInput(dateValue) {
  // If it's a Firebase timestamp
  if (dateValue && typeof dateValue.toDate === 'function') {
    dateValue = dateValue.toDate();
  }
  
  // If it's a Date object or can be converted to one
  if (dateValue) {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  return '';
}

// Calculate progress percentage towards goal
function calculateGoalProgress(currentWeight, targetWeight) {
  // If any required values are missing, return 0 progress
  if (!currentWeight || !targetWeight || !initialWeight) {
    return 0;
  }
  
  currentWeight = parseFloat(currentWeight);
  targetWeight = parseFloat(targetWeight);
  const startWeight = parseFloat(initialWeight);
    // For maintain weight goals, target weight equals initial weight
  // so we measure how close current weight is to initial/target weight
  const fitnessGoal = document.getElementById("fitness_goal_tab").value;
    if (fitnessGoal === "maintain_weight") {
    // If current weight is not equal to target weight, show progress as 0
    if (currentWeight !== targetWeight) {
      return 0;
    } else {
      // If they match exactly, show 100% progress
      return 100;
    }
  }
  
  // For other goals (lose/gain weight):
  // If current weight equals target weight, goal is achieved
  if (currentWeight === targetWeight) {
    return 100;
  }
  
  // If current weight equals initial weight, we're at the starting point
  if (currentWeight === startWeight) {
    return 0;
  }
  
  // Calculate the total weight change needed to reach the goal
  const totalChangeNeeded = Math.abs(targetWeight - startWeight);
  
  // If no change is needed, return 100% (goal already achieved)
  if (totalChangeNeeded === 0) {
    return 100;
  }
  
  // Calculate progress based on whether the goal is to lose or gain weight
  let progressPercentage;
  
  if (targetWeight < startWeight) {
    // Goal is to lose weight
    const weightLost = startWeight - currentWeight;
    progressPercentage = (weightLost / totalChangeNeeded) * 100;
  } else {
    // Goal is to gain weight
    const weightGained = currentWeight - startWeight;
    progressPercentage = (weightGained / totalChangeNeeded) * 100;
  }
  
  // Ensure progress is between 0 and 100
  progressPercentage = Math.min(100, Math.max(0, progressPercentage));
  
  // Return the progress as an integer percentage
  return Math.round(progressPercentage);
}

// Update the progress bar display
function updateProgressBar(progress) {
  const progressBar = document.getElementById('goal-progress-bar');
  const progressText = document.getElementById('goal-progress-text');
  
  if (progressBar && progressText) {
    // Ensure progress is between 0 and 100
    progress = Math.min(100, Math.max(0, progress));
    
    // Update the progress bar width and text
    progressBar.style.width = progress + '%';
    
    if (progress === 0) {
      progressText.textContent = 'Initial Weight';
    } else if (progress === 100) {
      progressText.textContent = 'Goal Achieved!';
    } else {
      progressText.textContent = progress + '%';
    }
    
    // Change color based on progress
    if (progress < 25) {
      progressBar.style.backgroundColor = '#ff9800'; // Orange for just started
    } else if (progress < 75) {
      progressBar.style.backgroundColor = '#4CAF50'; // Green for in progress
    } else {
      progressBar.style.backgroundColor = '#7030a1'; // Purple for near completion
    }
    
    // Make sure the progress bar container is visible
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
      progressContainer.style.display = 'block';
    }
  }
}

// Function to update progress bar based on form inputs
function updateProgressFromInputs() {
  const currentWeight = document.getElementById("currentWeight").value;
  const targetWeight = document.getElementById("target_weight_tab").value;
  
  // Update progress bar
  const progress = calculateGoalProgress(currentWeight, targetWeight);
  updateProgressBar(progress);
  
  // Update the progress info text displays
  const initialWeightDisplay = document.getElementById("initial-weight-display");
  const currentProgressDisplay = document.getElementById("current-progress-display");
  const targetWeightDisplay = document.getElementById("target-weight-display");
  
  if (initialWeightDisplay && initialWeight) {
    initialWeightDisplay.textContent = `Initial: ${initialWeight} kg`;
  }
  
  if (currentProgressDisplay && currentWeight) {
    currentProgressDisplay.textContent = `Current: ${currentWeight} kg`;
  }
  
  if (targetWeightDisplay && targetWeight) {
    targetWeightDisplay.textContent = `Target: ${targetWeight} kg`;
  }
}

// Update BMI when height or weight changes
document.addEventListener("DOMContentLoaded", () => {  const heightInput = document.getElementById("height");
  const weightInput = document.getElementById("currentWeight");
  const bmiInput = document.getElementById("bmi");
  const targetWeightTabInput = document.getElementById("target_weight_tab");

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

// Function to reset initial weight when goal type changes
function resetInitialWeightForGoal() {
  initialWeight = document.getElementById("currentWeight").value;
  console.log("Initial weight reset to current weight:", initialWeight);
  
  // Update the initial weight display
  const initialWeightDisplay = document.getElementById("initial-weight-display");
  if (initialWeightDisplay && initialWeight) {
    initialWeightDisplay.textContent = `Initial: ${initialWeight} kg`;
  }
  
  // For maintain weight goal, preserve any manually set target weight
  const fitnessGoal = document.getElementById("fitness_goal_tab").value;
  if (fitnessGoal === "maintain_weight") {
    // Let the handleGoalChangeTab function handle any target weight updates
  } else {
    // For other goals, update the target weight based on the goal type
  }
  
  // Update progress calculation and display
  updateProgressFromInputs();
}
