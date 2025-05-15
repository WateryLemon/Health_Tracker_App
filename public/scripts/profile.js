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

// Load user data when page loads
document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in
  const auth = window.auth;
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      await loadUserData();

      // Additional check for target date on page load
      const targetDateInput = document.getElementById("target_date");
      if (targetDateInput && targetDateInput.value) {
        // Force check by removing any session storage flags
        sessionStorage.removeItem("target_date_popup_shown");
        checkTargetDateReached(new Date(targetDateInput.value));
      }
    } else {
      // Redirect to sign in if not logged in
      window.location.href = "/sign-in.html";
    }
  });

  // Add sign out button handler
  document
    .getElementById("signOutButton")
    ?.addEventListener("click", handleSignOut);

  // Add fitness goal tab change listener
  document
    .getElementById("fitness_goal_tab")
    ?.addEventListener("change", function () {
      resetInitialWeightForGoal();

      // Update the target weight options and visibility
      handleGoalChangeTab();

      // Clear any goal achievement flags for the previous goal type
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("goal_reached_")) {
          sessionStorage.removeItem(key);
        }
      });
    });

  // Add target date change listener
  document
    .getElementById("target_date")
    ?.addEventListener("change", function () {
      if (this.value) {
        // Remove any existing popup flags to allow the popup to show if date is current or past
        sessionStorage.removeItem("target_date_popup_shown");
        // Check if selected date has already passed
        checkTargetDateReached(new Date(this.value));
      }
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
    currentWeightInput.addEventListener("input", updateProgressFromInputs);
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

      // Show corresponding tab
      const tabId = button.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
    });
  });
}

// Handle fitness goal selection change in goals tab
function handleGoalChangeTab() {
  const fitnessGoal = document.getElementById("fitness_goal_tab").value;
  const targetWeightInput = document.getElementById("target_weight_tab");
  // Get parent form-group of target weight for showing/hiding
  const targetWeightGroup = document.getElementById("target_weight_group_tab");
  if (
    fitnessGoal === "lose_weight" ||
    fitnessGoal === "build_muscle" ||
    fitnessGoal === "gain_weight"
  ) {
    if (targetWeightGroup) {
      targetWeightGroup.style.display = "block";
    }
    // Set default target weight if none is set
    if (
      targetWeightInput &&
      (!targetWeightInput.value || targetWeightInput.value === "0")
    ) {
      if (fitnessGoal === "lose_weight") {
        // Default to 5kg less
        targetWeightInput.value = Math.max(
          45,
          parseFloat(userWeight) - 5
        ).toFixed(2);
      } else if (
        fitnessGoal === "gain_weight" ||
        fitnessGoal === "build_muscle"
      ) {
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
  // Update all progress info displays
  updateProgressFromInputs();
}

// Load user data from firestore
async function loadUserData() {
  try {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();

      // Populate form fields
      document.getElementById("username").value = data.username || "";
      document.getElementById("forename").value = data.forename || "";
      document.getElementById("surname").value = data.surname || "";
      // Use correct field names from signup form
      document.getElementById("height").value =
        data.current_height || data.height || "";
      document.getElementById("sex").value = data.sex || "";
      document.getElementById("dob").value = data.date_of_birth || "";
      document.getElementById("email").value = data.email || "";

      // Set weight value and store it for reference
      userWeight = data.current_weight || data.weight || "";
      document.getElementById("currentWeight").value = userWeight;

      // Store initial weight from goal data if it exists or use current weight
      initialWeight = data.goal_data?.initial_weight || userWeight;

      // Calculate and populate bmi
      const height = parseFloat(data.current_height || data.height || "0");
      const weight = parseFloat(userWeight || "0");
      if (height > 0 && weight > 0) {
        const bmi = calculateBMI(height, weight);
        document.getElementById("bmi").value = bmi;
      } else {
        document.getElementById("bmi").value = ""; // Clear bmi field if data is invalid
      }

      // Set fitness goal
      const fitnessGoal = data.fitness_goal || "";
      document.getElementById("fitness_goal_tab").value = fitnessGoal;
      // Handle target weight
      const goalData = data.goal_data || {};
      const targetWeight = goalData.target_weight || "";
      document.getElementById("target_weight_tab").value = targetWeight;

      // Populate goals tab data
      if (goalData.target_date) {
        document.getElementById("target_date").value = formatDateForInput(
          goalData.target_date
        );

        // Check if target date has been reached
        checkTargetDateReached(goalData.target_date);
      }

      // Update progress bar and info displays
      updateProgressFromInputs();

      // Show/hide target weight field based on goal
      handleGoalChangeTab();
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
    const fitnessGoal = document.getElementById("fitness_goal_tab").value;
    let targetWeight = document.getElementById("target_weight_tab").value;
    const currentWeight = document.getElementById("currentWeight").value;
    const height = document.getElementById("height").value;
    const targetDate = document.getElementById("target_date").value;

    // Calculate bmi for display
    const bmi = calculateBMI(parseFloat(height), parseFloat(currentWeight));
    document.getElementById("bmi").value = bmi !== "NaN" ? bmi : "";

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
      current_height: document.getElementById("height").value,
      sex: document.getElementById("sex").value,
      date_of_birth: document.getElementById("dob").value,
      email: document.getElementById("email").value,
      weight: currentWeight,
      current_weight: currentWeight,
      fitness_goal: fitnessGoal,
      goal_data: {
        start_date: serverTimestamp(),
        goal_type: fitnessGoal,
        initial_weight: initialWeight || currentWeight,
        target_weight: targetWeight || null,
        target_date: targetDate || null,
        progress: calculateGoalProgress(currentWeight, targetWeight),
      },
      units: "Metric",
      updated_at: new Date(),
    }; // Validate required fields
    if (!userData.username || !userData.email) {
      showMessage("Username and email are required", true);
      return;
    }

    // Update user document in firestore
    await updateDoc(doc(db, "users", currentUser.uid), userData);
    showMessage("Profile updated successfully"); // Check if target date has been reached
    if (targetDate) {
      // Remove any existing popup flags to allow popup to show if date is current or past
      sessionStorage.removeItem("target_date_popup_shown");
      checkTargetDateReached(new Date(targetDate));
    }

    // Check if goal has been achieved after saving
    const progress = calculateGoalProgress(currentWeight, targetWeight);
    if (progress === 100) {
      // If goal is achieved check if it should show popup
      if (
        checkGoalAchieved(
          parseFloat(currentWeight),
          parseFloat(targetWeight),
          fitnessGoal
        )
      ) {
        setTimeout(() => {
          showGoalAchievementPopup();
        }, 1000); // Show after a delay so user sees the success message first
      }
    }
  } catch (error) {
    console.error("Error saving profile:", error);
    showMessage("Error saving profile", true);
  }
});

// Add change password functionality
document.getElementById("change-password")?.addEventListener("click", () => {
  window.location.href = "/Password-Reset.html";
});

// Fix radio button ids and add name attribute
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

// Add event listener to close popup when clicking outside
document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("goal-popup");
  const popupContent = document.querySelector(".goal-popup-content");

  // Close popup when clicking outside of it
  if (popup && popupContent) {
    popup.addEventListener("click", (event) => {
      if (event.target === popup) {
        popup.style.display = "none";
        resetGoalAfterAchievement();
      }
    });
  }
});

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

// Helper function to calculate bmi
function calculateBMI(height, weight) {
  // Convert height from cm to meters for metric calculations
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(2);
}

// Helper function to format date for html date input
function formatDateForInput(dateValue) {
  // If it's a Firebase timestamp
  if (dateValue && typeof dateValue.toDate === "function") {
    dateValue = dateValue.toDate();
  }

  // If it's a date object or can be converted to one
  if (dateValue) {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  }
  return "";
}

// Calculate progress percentage towards goal
function calculateGoalProgress(currentWeight, targetWeight) {
  // If any required values are missing return 0 progress
  if (!currentWeight || !targetWeight || !initialWeight) {
    return 0;
  }
  currentWeight = parseFloat(currentWeight);
  targetWeight = parseFloat(targetWeight);
  const startWeight = parseFloat(initialWeight);

  // If current weight equals target weight goal is achieved
  if (currentWeight === targetWeight) {
    return 100;
  }

  // If current weight equals initial weight we're at the starting point
  if (currentWeight === startWeight) {
    return 0;
  }

  // Calculate the total weight change needed to reach the goal
  const totalChangeNeeded = Math.abs(targetWeight - startWeight);

  // If no change is needed return 100% (goal already achieved)
  if (totalChangeNeeded === 0) {
    return 100;
  }

  // Calculate progress based on whether goal is to lose or gain weight
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

  // Return progress as an integer percentage
  return Math.round(progressPercentage);
}

// Update progress bar display
function updateProgressBar(progress) {
  const progressBar = document.getElementById("goal-progress-bar");
  const progressText = document.getElementById("goal-progress-text");

  if (progressBar && progressText) {
    // Ensure progress is between 0 and 100
    progress = Math.min(100, Math.max(0, progress));

    // Update progress bar width and text
    progressBar.style.width = progress + "%";

    if (progress === 0) {
      progressText.textContent = "Initial Weight";
    } else if (progress === 100) {
      progressText.textContent = "Goal Achieved!";
    } else {
      progressText.textContent = progress + "%";
    }

    // Change color based on progress
    if (progress < 25) {
      progressBar.style.backgroundColor = "#ff9800"; // Orange for just started
    } else if (progress < 75) {
      progressBar.style.backgroundColor = "#4CAF50"; // Green for in progress
    } else {
      progressBar.style.backgroundColor = "#7030a1"; // Purple for near completion
    }

    // Make sure progress bar container is visible
    const progressContainer = document.querySelector(".progress-container");
    if (progressContainer) {
      progressContainer.style.display = "block";
    }
  }
}

// Function to update progress bar based on form inputs
function updateProgressFromInputs() {
  const currentWeight = document.getElementById("currentWeight").value;
  const targetWeight = document.getElementById("target_weight_tab").value;
  const fitnessGoal = document.getElementById("fitness_goal_tab").value;

  // Update progress bar
  const progress = calculateGoalProgress(currentWeight, targetWeight);
  updateProgressBar(progress);

  // Update progress info text displays
  const initialWeightDisplay = document.getElementById(
    "initial-weight-display"
  );
  const currentProgressDisplay = document.getElementById(
    "current-progress-display"
  );
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

// Update bmi when height or weight changes
document.addEventListener("DOMContentLoaded", () => {
  const heightInput = document.getElementById("height");
  const weightInput = document.getElementById("currentWeight");
  const bmiInput = document.getElementById("bmi");
  const targetWeightTabInput = document.getElementById("target_weight_tab");

  // Make bmi field read only
  bmiInput.readOnly = true;
  // Add event listeners to recalculate bmi when values change
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

  // Update initial weight display
  const initialWeightDisplay = document.getElementById(
    "initial-weight-display"
  );
  if (initialWeightDisplay && initialWeight) {
    initialWeightDisplay.textContent = `Initial: ${initialWeight} kg`;
  }

  // Update progress calculation and display
  updateProgressFromInputs();
}

// Function to check if goal has been achieved
function checkGoalAchieved(currentWeight, targetWeight, fitnessGoal) {
  if (!currentWeight || !targetWeight) {
    return false;
  }

  // Check if goal has been achieved based on goal type
  if (fitnessGoal === "lose_weight") {
    return currentWeight <= targetWeight;
  } else if (fitnessGoal === "gain_weight" || fitnessGoal === "build_muscle") {
    return currentWeight >= targetWeight;
  }

  return false;
}

// Function to show goal achievement popup
function showGoalAchievementPopup() {
  // Get popup elements
  const popup = document.getElementById("goal-popup");
  const popupButton = document.getElementById("goal-popup-button");
  const popupMessage = document.querySelector(".goal-popup-message");

  // Customize message based on goal type
  const fitnessGoal = document.getElementById("fitness_goal_tab").value;
  const currentWeight = document.getElementById("currentWeight").value;
  const targetWeight = document.getElementById("target_weight_tab").value;

  let goalMessage = "You've met your weight goal!";

  if (fitnessGoal === "lose_weight") {
    goalMessage = `Amazing! You've reached your target weight of ${targetWeight}kg!`;
  } else if (fitnessGoal === "gain_weight") {
    goalMessage = `Congratulations! You've successfully gained weight and reached your target of ${targetWeight}kg!`;
  } else if (fitnessGoal === "build_muscle") {
    goalMessage = `Great work! You've reached your muscle building target weight of ${targetWeight}kg!`;
  }

  // Set customised message
  if (popupMessage) {
    popupMessage.textContent = goalMessage;
  }
  // Show popup
  popup.style.display = "flex";

  // Remove any previous click listeners to prevent duplicates
  const newPopupButton = popupButton.cloneNode(true);
  popupButton.parentNode.replaceChild(newPopupButton, popupButton);

  // Add event listener to popup button
  newPopupButton.addEventListener("click", () => {
    // Hide popup
    popup.style.display = "none";

    // Reset goal values
    resetGoalAfterAchievement();
  });
}

// Function to reset goal after achievement
async function resetGoalAfterAchievement() {
  // Get current weight as new initial weight
  const currentWeight = document.getElementById("currentWeight").value;
  initialWeight = currentWeight;

  // Clear target weight
  document.getElementById("target_weight_tab").value = "";

  // Reset target date
  document.getElementById("target_date").value = "";

  // Update displays
  const initialWeightDisplay = document.getElementById(
    "initial-weight-display"
  );
  const targetWeightDisplay = document.getElementById("target-weight-display");

  if (initialWeightDisplay) {
    initialWeightDisplay.textContent = `Initial: ${initialWeight} kg`;
  }

  if (targetWeightDisplay) {
    targetWeightDisplay.textContent = `Target: --`;
  }
  // Reset progress bar
  updateProgressBar(0);

  // Clear session storage flag to allow showing popup again for future goals
  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith("goal_reached_")) {
      sessionStorage.removeItem(key);
    }
  });

  // Update database with reset goal data
  try {
    if (currentUser) {
      // Update firestore with reset goal values
      await updateDoc(doc(db, "users", currentUser.uid), {
        goal_data: {
          start_date: serverTimestamp(),
          goal_type: document.getElementById("fitness_goal_tab").value,
          initial_weight: initialWeight,
          target_weight: null,
          target_date: null,
          progress: 0,
        },
        updated_at: new Date(),
      });

      // Show message to the user
      showMessage(
        "Goal reset successfully. You can now set a new goal!",
        false
      );
    }
  } catch (error) {
    console.error("Error resetting goal in database:", error);
    showMessage("Error resetting goal. Please try again.", true);
  }
}

// Function to check if target date has been reached
function checkTargetDateReached(targetDate) {
  // Skip if no target date or already shown popup today
  if (!targetDate || sessionStorage.getItem("target_date_popup_shown")) {
    return;
  }
  // Convert target date to date object if it's a firebase timestamp
  let targetDateObj;
  if (typeof targetDate.toDate === "function") {
    targetDateObj = targetDate.toDate();
  } else {
    targetDateObj = new Date(targetDate);
  }

  // Set hours to 0 to compare just dates
  targetDateObj.setHours(0, 0, 0, 0);

  // Get current date with time set to 0
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if target date has passed or is today
  if (today.getTime() >= targetDateObj.getTime()) {
    // Get current progress
    const currentWeight = document.getElementById("currentWeight").value;
    const targetWeight = document.getElementById("target_weight_tab").value;
    const progress = calculateGoalProgress(currentWeight, targetWeight);

    // Customize message based on progress
    const popup = document.getElementById("target-date-popup");
    const popupMessage = popup.querySelector(".goal-popup-message");
    const popupDetails = popup.querySelector(".goal-popup-details span");

    if (progress === 100) {
      // Goal achieved
      popupMessage.textContent =
        "Congratulations! You've reached your target date and achieved your goal!";
      popupDetails.textContent =
        "You've successfully completed your fitness journey";
    } else if (progress > 75) {
      // Almost there
      popupMessage.textContent =
        "Your target date has arrived! You're almost at your goal!";
      popupDetails.textContent = `You're ${progress}% of the way to your goal`;
    } else if (progress > 0) {
      // Some progress
      popupMessage.textContent = "Your target date has arrived!";
      popupDetails.textContent = `You've made ${progress}% progress toward your goal`;
    } else {
      // No progress
      popupMessage.textContent = "Your target date has arrived!";
      popupDetails.textContent = "It's time to check your progress";
    } // Show popup
    showTargetDatePopup();

    // Mark as shown in session storage
    sessionStorage.setItem("target_date_popup_shown", "true");
  }
}

// Function to show target date reached popup
function showTargetDatePopup() {
  // Get popup elements
  const popup = document.getElementById("target-date-popup");
  const popupButton = document.getElementById("target-date-popup-button");

  // Show popup
  popup.style.display = "flex";

  // Remove any previous click listeners to prevent duplicates
  const newPopupButton = popupButton.cloneNode(true);
  popupButton.parentNode.replaceChild(newPopupButton, popupButton);

  // Add event listener to popup button
  newPopupButton.addEventListener("click", () => {
    // Hide popup
    popup.style.display = "none";
  });

  // Add event listener to close popup when clicking outside
  popup.addEventListener("click", (event) => {
    if (event.target === popup) {
      popup.style.display = "none";
    }
  });
}
