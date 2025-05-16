import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

const db = getFirestore();
let userWeight = null;

// Load user's current weight when the page loads
window.auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "/sign-in.html";
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      userWeight = userDoc.data().weight;
    }
  } catch (error) {
    console.error("Error loading user data:", error);
  }
});

// Handle fitness goal selection
document.getElementById("fitness_goal").addEventListener("change", function () {
  const targetWeightGroup = document.getElementById("target_weight_group");
  const targetWeightInput = document.getElementById("target_weight");

  if (this.value === "maintain_weight") {
    targetWeightGroup.style.display = "none";
    targetWeightInput.value = userWeight;
    targetWeightInput.required = true;
  } else if (this.value === "lose_weight" || this.value === "build_muscle") {
    targetWeightGroup.style.display = "block";
    targetWeightGroup.classList.add("visible");
    targetWeightInput.required = true;
    targetWeightInput.value = "";
  } else {
    targetWeightGroup.classList.remove("visible");
    targetWeightInput.required = false;
    targetWeightInput.value = "";

    setTimeout(() => {
      if (!targetWeightGroup.classList.contains("visible")) {
        targetWeightGroup.style.display = "none";
      }
    }, 300);
  }
});

//Handle form submission
document
  .getElementById("goalsForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = window.auth.currentUser;
    if (!user) {
      alert("Please sign in to set your goals");
      return;
    }

    // Get form values
    const fitnessGoal = document.getElementById("fitness_goal").value;
    let targetWeight = document.getElementById("target_weight").value;

    // Validate target weight if provided
    if (targetWeight && parseFloat(targetWeight) <= 0) {
      alert("Target weight must be greater than 0");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const goalData = {
        fitness_goal: fitnessGoal,
        goal_data: {
          start_date: serverTimestamp(),
          goal_type: fitnessGoal,
          target_weight: targetWeight || null,
        },
      };

      await updateDoc(userRef, goalData);
      alert("Goals saved successfully!");
      window.location.href = "/index.html"; // Redirect to index page after successful save
    } catch (error) {
      console.error("Error saving goals:", error);
      alert("Error saving your goals: " + error.message);
    }
  });
