// This file helps debug issues with loading Firebase and other components

document.addEventListener("DOMContentLoaded", () => {
  console.log("Debug script loaded");

  try {
    // Check if Firebase components are properly loaded
    const firebaseLoaded = {
      auth: !!window.auth,
      db: !!window.db,
    };
    console.log("Firebase components loaded:", firebaseLoaded);

    // Check if the DOM elements needed for goals are present
    const elementsExist = {
      goalContainer: !!document.getElementById("additional_goals_container"),
      addGoalButton: !!document.getElementById("add_goal_button"),
      weightliftingExercise: !!document.getElementById(
        "weightlifting_exercise"
      ),
      currentLiftWeight: !!document.getElementById("current_lift_weight"),
      currentReps: !!document.getElementById("current_reps"),
      targetLiftWeight: !!document.getElementById("target_lift_weight"),
      targetReps: !!document.getElementById("target_reps"),
      closeGoalPanel: !!document.getElementById("close_goal_panel"),
      goalCreationPanel: !!document.getElementById("goal_creation_panel"),
      saveAdditionalGoal: !!document.getElementById("save_additional_goal"),
    };
    console.log("Required DOM elements:", elementsExist);
  } catch (error) {
    console.error("Debug error:", error);
  }

  // Show a debug indicator on the page
  const debugIndicator = document.createElement("div");
  debugIndicator.textContent = "Debug Mode Active";
  debugIndicator.style.position = "fixed";
  debugIndicator.style.bottom = "5px";
  debugIndicator.style.right = "5px";
  debugIndicator.style.backgroundColor = "rgba(255, 255, 0, 0.7)";
  debugIndicator.style.padding = "5px 10px";
  debugIndicator.style.borderRadius = "3px";
  debugIndicator.style.fontSize = "12px";
  debugIndicator.style.zIndex = "9999";
  document.body.appendChild(debugIndicator);
});
