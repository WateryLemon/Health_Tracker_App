// filepath: c:\Users\theoj\Health_Tracker_App\public\scripts\groups.js
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const auth = window.auth;
  let currentUser = null;
  let currentGroup = null;

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      loadUserData();
      loadUserGroups();
      // Setup real-time validation for group name
      setupGroupNameValidation();
      // Setup group fitness goal selection behavior
      setupGroupGoalSelection();
    } else {
      // Redirect to sign in if not logged in
      window.location.href = "/sign-in.html";
    }
  });

  // Setup real-time validation for group name field
  function setupGroupNameValidation() {
    const groupNameInput = document.getElementById("group-name");
    const validationMessage = document.getElementById("group-name-validation");
    let typingTimer;
    const doneTypingInterval = 500; // time in ms (0.5 seconds)

    groupNameInput.addEventListener("input", function () {
      clearTimeout(typingTimer);

      validationMessage.textContent = "";
      validationMessage.className = "validation-message";

      if (!this.value.trim()) {
        return;
      }

      typingTimer = setTimeout(
        () => validateGroupName(this.value),
        doneTypingInterval
      );
    });

    async function validateGroupName(name) {
      if (name.length < 3) {
        validationMessage.textContent =
          "Group name must be at least 3 characters long";
        validationMessage.className = "validation-message error";
        return;
      }

      try {
        const response = await fetch(
          `/check-group-name?name=${encodeURIComponent(name)}`
        );
        const data = await response.json();

        if (data.available) {
          validationMessage.textContent = "This group name is available";
          validationMessage.className = "validation-message success";
        } else {
          validationMessage.textContent = `The name "${data.existingName}" is already taken`;
          validationMessage.className = "validation-message error";
        }
      } catch (error) {
        console.error("Error checking group name:", error);
        validationMessage.textContent = "Couldn't verify name availability";
        validationMessage.className = "validation-message error";
      }
    }
  } // Setup group fitness goal selection behavior
  function setupGroupGoalSelection() {
    const fitnessGoalSelect = document.getElementById("group_fitness_goal");
    const targetWeightGroup = document.getElementById(
      "group_target_weight_group"
    );
    const targetWeightInput = document.getElementById("group_target_weight");
    const targetWeightLabel = document.querySelector(
      'label[for="group_target_weight"]'
    );

    if (fitnessGoalSelect) {
      fitnessGoalSelect.addEventListener("change", function () {
        // First, cancel any pending transitions
        if (window.weightTransitionTimer) {
          clearTimeout(window.weightTransitionTimer);
        }

        if (this.value === "lose_weight") {
          // Immediately show for lose weight
          targetWeightGroup.style.display = "block";
          // Wait a tiny bit before adding the visible class for transition
          setTimeout(() => targetWeightGroup.classList.add("visible"), 10);
          targetWeightInput.required = true;
          targetWeightInput.value = "";
          // Update label for weight loss
          if (targetWeightLabel) {
            targetWeightLabel.textContent = "Target Weight Loss (kg)";
          }
        } else if (this.value === "gain_weight") {
          // Immediately show for gain weight
          targetWeightGroup.style.display = "block";
          // Wait a tiny bit before adding the visible class for transition
          setTimeout(() => targetWeightGroup.classList.add("visible"), 10);
          targetWeightInput.required = true;
          targetWeightInput.value = "";
          // Update label for weight gain
          if (targetWeightLabel) {
            targetWeightLabel.textContent = "Target Weight Gain (kg)";
          }
        } else {
          // For other options, hide gradually
          targetWeightGroup.classList.remove("visible");
          targetWeightInput.required = false;
          targetWeightInput.value = "";
          // Wait for transition to complete before hiding
          window.weightTransitionTimer = setTimeout(() => {
            if (!targetWeightGroup.classList.contains("visible")) {
              targetWeightGroup.style.display = "none";
            }
          }, 300);
        }
      });
    }
  }

  // Tab switching functionality
  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all tabs
      document.querySelectorAll(".tab-button").forEach((btn) => {
        btn.classList.remove("active");
      });
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });

      // Add active class to clicked tab
      button.classList.add("active");
      const tabId = button.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
    });
  });

  // Modal tab switching functionality
  const modalTabButtons = document.querySelectorAll(".modal-tab-button");
  modalTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all modal tabs
      document.querySelectorAll(".modal-tab-button").forEach((btn) => {
        btn.classList.remove("active");
      });
      document.querySelectorAll(".modal-tab-content").forEach((content) => {
        content.classList.remove("active");
      }); // Add active class to clicked modal tab
      button.classList.add("active");
      const tabId = button.getAttribute("data-modal-tab") + "-tab";
      const tabElement = document.getElementById(tabId);

      if (tabElement) {
        tabElement.classList.add("active"); // Special handling for share tab
        if (tabId === "share-tab" && currentGroup) {
          console.log("Share tab activated, ensuring code is displayed");
          const codeElement = document.getElementById("group-share-code");

          if (!currentGroup.code) {
            // If the group doesn't have a code yet, show loading indicator
            codeElement.textContent = "Loading...";
            updateGroupWithCode(currentGroup);
          } else {
            // Set the code in the UI
            codeElement.textContent = currentGroup.code;
          }
        }
      } else {
        console.error(`Tab element not found: ${tabId}`);
      }
    });
  });

  // Close modal when clicking the X
  document.querySelector(".close-modal").addEventListener("click", () => {
    document.getElementById("group-modal").style.display = "none";
  });

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("group-modal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
  // Form submission handlers
  const createGroupForm = document.getElementById("create-group-form");
  createGroupForm.addEventListener("submit", handleCreateGroup);

  const joinGroupForm = document.getElementById("join-group-form");
  joinGroupForm.addEventListener("submit", handleJoinGroup);
  const createGoalForm = document.getElementById("create-goal-form");
  createGoalForm.addEventListener("submit", handleCreateGoal);

  const joinGoalForm = document.getElementById("join-goal-form");
  joinGoalForm.addEventListener("submit", handleJoinGoal);

  const shareEmailForm = document.getElementById("share-email-form");
  shareEmailForm.addEventListener("submit", handleShareViaEmail);
  // Copy group code to clipboard
  document.getElementById("copy-code-btn").addEventListener("click", () => {
    const code = document.getElementById("group-share-code").textContent;

    if (!code || code === "Loading...") {
      showMessage("No group code available to copy", true);
      return;
    }

    navigator.clipboard
      .writeText(code)
      .then(() => {
        showMessage("Group code copied to clipboard!");
      })
      .catch((err) => {
        console.error("Could not copy code: ", err);
        showMessage("Failed to copy code to clipboard", true);
      });
  });

  // Leave group handler
  document
    .getElementById("leave-group-btn")
    .addEventListener("click", handleLeaveGroup);

  // Load user data
  async function loadUserData() {
    try {
      const db = window.db;
      const userDoc = await window.getDoc(
        window.doc(db, "users", currentUser.uid)
      );

      if (userDoc.exists()) {
        // User data loaded successfully
        const userData = userDoc.data();
        // Any additional user data you need can be accessed here
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      showMessage("Error loading profile data", true);
    }
  }

  // Load groups the user is a member of
  let isLoadingGroups = false; // Flag to prevent multiple simultaneous loads

  // Create a persistent styled no-groups message element
  function createNoGroupsMessage() {
    const noGroupsMessage = document.createElement("div");
    noGroupsMessage.className = "no-groups-message";
    noGroupsMessage.textContent = "You are not a member of any groups yet.";

    // Add some inline styles to make it more visible
    noGroupsMessage.style.padding = "20px";
    noGroupsMessage.style.textAlign = "center";
    noGroupsMessage.style.fontSize = "16px";
    noGroupsMessage.style.color = "#666";
    noGroupsMessage.style.border = "1px dashed #ccc";
    noGroupsMessage.style.borderRadius = "8px";
    noGroupsMessage.style.margin = "20px 0";

    return noGroupsMessage;
  }

  async function loadUserGroups() {
    if (isLoadingGroups) return;
    isLoadingGroups = true;

    try {
      const db = window.db;
      const groupMembershipsRef = window.collection(db, "group_memberships");
      const q = window.query(
        groupMembershipsRef,
        window.where("userId", "==", currentUser.uid)
      );
      const querySnapshot = await window.getDocs(q);
      const groupsList = document.getElementById("user-groups-list");

      // Clear the list completely
      groupsList.innerHTML = "";

      // If no groups found, show the message
      if (querySnapshot.empty) {
        groupsList.appendChild(createNoGroupsMessage());
        isLoadingGroups = false;
        return;
      }

      const groups = [];
      for (const doc of querySnapshot.docs) {
        const membership = doc.data();
        const groupId = membership.groupId;

        // Fetch the group details
        const groupDoc = await window.getDoc(window.doc(db, "groups", groupId));
        if (groupDoc.exists()) {
          const groupData = groupDoc.data();

          // Ensure the group has a code
          if (!groupData.code) {
            const newCode = generateGroupCode();
            console.log(`Generated new code for group ${groupId}: ${newCode}`);

            // Update the group with the new code
            await window.updateDoc(window.doc(db, "groups", groupId), {
              code: newCode,
            });

            // Add the code to the group data
            groupData.code = newCode;
          }

          groups.push({
            id: groupId,
            ...groupData,
          });
        }
      }

      // Render the groups
      if (groups.length === 0) {
        groupsList.appendChild(createNoGroupsMessage());
      } else {
        groups.forEach((group) => {
          const groupCard = document.createElement("div");
          groupCard.className = "group-card";
          groupCard.dataset.groupId = group.id;
          groupCard.innerHTML = `
                      <h3>${group.name}</h3>
                      <p>${group.description}</p>
                      <div class="group-meta">
                          <span>${group.memberCount || 1} members</span>
                      </div>
                  `;

          groupCard.addEventListener("click", () => openGroupModal(group));
          groupsList.appendChild(groupCard);
        });
      }
    } catch (error) {
      console.error("Error loading groups:", error);
      showMessage("Error loading your groups", true);

      // On error, ensure we show the no groups message
      const groupsList = document.getElementById("user-groups-list");
      groupsList.innerHTML = "";
      groupsList.appendChild(createNoGroupsMessage());
    } finally {
      isLoadingGroups = false;
    }
  } // Open group details modal
  function openGroupModal(group) {
    currentGroup = group;
    console.log("Opening group modal with data:", group);

    document.getElementById("modal-group-name").textContent = group.name;
    document.getElementById("modal-group-description").textContent =
      group.description;

    // Fix for share tab - ensure the group code is available
    if (group.code) {
      document.getElementById("group-share-code").textContent = group.code;
    } else {
      // If code is missing, generate one and update the group
      updateGroupWithCode(group);
    }

    loadGroupMembers(group.id);
    loadGroupGoals(group.id);

    document.getElementById("group-modal").style.display = "block";
  }

  // Update a group with a new code if it's missing
  async function updateGroupWithCode(group) {
    try {
      console.log("Generating code for group:", group.id);
      const newCode = generateGroupCode();

      // Update in Firebase first
      const db = window.db;
      await window.updateDoc(window.doc(db, "groups", group.id), {
        code: newCode,
      });

      // Then update the UI and local object after successful database update
      document.getElementById("group-share-code").textContent = newCode;

      // Update the current group object
      currentGroup.code = newCode;

      console.log("Group code updated successfully:", newCode);

      // Show a success message to the user
      showMessage("Group sharing code generated successfully");

      return newCode;
    } catch (error) {
      console.error("Error updating group code:", error);
      document.getElementById("group-share-code").textContent =
        "Error generating code";
      showMessage("Error generating sharing code", true);
      return null;
    }
  }

  // Load group members
  async function loadGroupMembers(groupId) {
    try {
      const db = window.db;
      const groupMembershipsRef = window.collection(db, "group_memberships");
      const q = window.query(
        groupMembershipsRef,
        window.where("groupId", "==", groupId)
      );
      const querySnapshot = await window.getDocs(q);

      const membersList = document.getElementById("group-members-list");
      membersList.innerHTML = "";

      if (querySnapshot.empty) {
        membersList.innerHTML = "<p>No members found.</p>";
        return;
      }

      for (const doc of querySnapshot.docs) {
        const membership = doc.data();
        const userId = membership.userId;

        // Fetch the user details
        const userDoc = await window.getDoc(window.doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();

          const memberItem = document.createElement("div");
          memberItem.className = "member-item";

          memberItem.innerHTML = `
                        <div class="member-info">
                            <div class="member-name">${
                              userData.username ||
                              userData.forename + " " + userData.surname
                            }</div>
                            <div class="member-email">${userData.email}</div>
                        </div>
                    `;

          membersList.appendChild(memberItem);
        }
      }
    } catch (error) {
      console.error("Error loading group members:", error);
    }
  } // Load group goals
  async function loadGroupGoals(groupId) {
    try {
      const db = window.db;
      const goalsRef = window.collection(db, "groups", groupId, "goals");
      const querySnapshot = await window.getDocs(goalsRef);

      const goalsList = document.getElementById("group-goals-list");
      goalsList.innerHTML = "";

      if (querySnapshot.empty) {
        goalsList.innerHTML = "<p>No goals set for this group yet.</p>";
        return;
      }
      const goals = [];
      querySnapshot.forEach((doc) => {
        goals.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Process goals one by one with proper async handling
      for (const goal of goals) {
        const goalItem = document.createElement("div");
        goalItem.className = "goal-item";

        // Calculate the progress
        const progressPercentage = await calculateFitnessGoalProgress(goal);

        // Format the goal information based on the goal type
        let goalTitle = "";
        let goalDetails = "";
        let progressDetails = "";
        let currentWeight = parseFloat(goal.initial_weight); // Default to initial weight

        // Fetch current weight from user profile
        try {
          const userDoc = await window.getDoc(
            window.doc(window.db, "users", currentUser.uid)
          );
          if (userDoc.exists()) {
            const userData = userDoc.data();
            currentWeight = parseFloat(
              userData.current_weight || userData.weight || goal.initial_weight
            );
          }
        } catch (error) {
          console.error("Error fetching user weight:", error);
        }

        switch (goal.fitness_goal) {
          case "lose_weight":
            goalTitle = "Lose Weight";
            if (goal.target_weight && goal.initial_weight) {
              const targetWeightKg = parseFloat(goal.target_weight);
              const initialWeightKg = parseFloat(goal.initial_weight);
              const weightLossTarget = (
                initialWeightKg - targetWeightKg
              ).toFixed(1);
              goalDetails = `Target Weight Loss: ${weightLossTarget} kg (from ${initialWeightKg} kg to ${targetWeightKg} kg)`;

              // Get current weight from user's profile for progress display
              const weightLostSoFar = (initialWeightKg - currentWeight).toFixed(
                1
              );
              progressDetails = `Current Progress: ${weightLostSoFar} kg lost, ${((weightLostSoFar / weightLossTarget) * 100).toFixed(0)}% of goal`;
            } else {
              goalDetails = goal.target_weight
                ? `Target: ${goal.target_weight} kg`
                : "";
            }
            break;
          case "maintain_weight":
            goalTitle = "Maintain Weight";
            if (goal.initial_weight) {
              const initialWeightKg = parseFloat(goal.initial_weight);
              goalDetails = `Maintain weight at: ${initialWeightKg} kg`;

              // Show current weight status
              const weightDifference = (
                currentWeight - initialWeightKg
              ).toFixed(1);
              const direction =
                weightDifference > 0
                  ? "above"
                  : weightDifference < 0
                    ? "below"
                    : "at";
              progressDetails = `Current weight: ${currentWeight} kg (${Math.abs(weightDifference)} kg ${direction} target)`;
            }
            break;
          case "build_muscle":
            goalTitle = "Build Muscle";
            if (goal.target_weight && goal.initial_weight) {
              const targetWeightKg = parseFloat(goal.target_weight);
              const initialWeightKg = parseFloat(goal.initial_weight);
              const weightGainTarget = (
                targetWeightKg - initialWeightKg
              ).toFixed(1);
              goalDetails = `Target Weight Gain: ${weightGainTarget} kg (from ${initialWeightKg} kg to ${targetWeightKg} kg)`;

              // Show progress based on current weight
              const weightGainedSoFar = (
                currentWeight - initialWeightKg
              ).toFixed(1);
              progressDetails = `Current Progress: ${weightGainedSoFar} kg gained, ${((weightGainedSoFar / weightGainTarget) * 100).toFixed(0)}% of goal`;
            } else {
              goalDetails = goal.target_weight
                ? `Target: ${goal.target_weight} kg`
                : "";
            }
            break;
          default:
            goalTitle = goal.fitness_goal || "Custom Goal";
        } // Add description if available
        if (goal.description) {
          goalDetails += goalDetails
            ? `<br>${goal.description}`
            : goal.description;
        } // Convert the timestamp to a readable date
        const startDate = goal.start_date
          ? new Date(goal.start_date.seconds * 1000).toLocaleDateString()
          : "N/A";

        // Check if the current user is participating in this goal
        const isParticipating =
          goal.participants && goal.participants.includes(currentUser.uid);

        // Show a join button or participation status based on whether the user is already in the goal
        const participationHTML = isParticipating
          ? `<div class="goal-joined-indicator">✓ You're participating</div>`
          : "";

        goalItem.innerHTML = `
                    <div class="goal-header">
                        <div class="goal-title">${goalTitle}</div>
                        <div class="goal-date">Started: ${startDate}</div>
                    </div>
                    <div class="goal-progress">
                        <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                        <div class="progress-percentage">${progressPercentage}%</div>
                    </div>
                    <div class="goal-details">${goalDetails}</div>
                    ${progressDetails ? `<div class="progress-details">${progressDetails}</div>` : ""}
                    ${participationHTML}
                `;

        goalsList.appendChild(goalItem);
      }
    } catch (error) {
      console.error("Error loading group goals:", error);
    }
  } // Calculate goal progress for fitness goals
  async function calculateFitnessGoalProgress(goal) {
    // Default to 0 progress if we don't have necessary data
    if (!goal || !goal.fitness_goal) {
      return 0;
    }

    // Check if user is participating in this goal
    const isParticipating =
      goal.participants && goal.participants.includes(currentUser.uid);

    // If user is not participating, show 0 progress
    if (!isParticipating) {
      return 0;
    }

    // For goals that don't involve weight tracking
    if (
      goal.fitness_goal !== "lose_weight" &&
      goal.fitness_goal !== "maintain_weight" &&
      goal.fitness_goal !== "build_muscle"
    ) {
      // Return a placeholder progress (this should be replaced with actual calculation in a real app)
      return Math.floor(Math.random() * 100);
    }

    try {
      // Get user's current weight from their profile
      const userDoc = await window.getDoc(
        window.doc(window.db, "users", currentUser.uid)
      );
      if (!userDoc.exists()) {
        return 0;
      }
      const userData = userDoc.data();
      const currentWeight = parseFloat(
        userData.current_weight || userData.weight || goal.initial_weight || 0
      );
      const initialWeight = parseFloat(goal.initial_weight || 0);
      const targetWeight = parseFloat(goal.target_weight || 0);

      // If we're missing any required data, return 0 progress
      if (
        isNaN(currentWeight) ||
        isNaN(targetWeight) ||
        isNaN(initialWeight) ||
        initialWeight === 0
      ) {
        return 0;
      }

      // Calculate progress based on goal type
      let progressPercentage = 0;

      switch (goal.fitness_goal) {
        case "maintain_weight":
          // For maintain weight, progress is 100% if current matches target
          progressPercentage = currentWeight === targetWeight ? 100 : 0;
          break;

        case "lose_weight":
          // Goal is to lose weight
          if (initialWeight <= targetWeight) {
            // Invalid goal (target > initial for weight loss), return 0
            return 0;
          }

          const weightLossNeeded = initialWeight - targetWeight;
          const weightLostSoFar = initialWeight - currentWeight;
          progressPercentage = (weightLostSoFar / weightLossNeeded) * 100;
          break;

        case "build_muscle":
          // Goal is to gain weight/muscle
          if (initialWeight >= targetWeight) {
            // Invalid goal (target < initial for muscle gain), return 0
            return 0;
          }

          const weightGainNeeded = targetWeight - initialWeight;
          const weightGainedSoFar = currentWeight - initialWeight;
          progressPercentage = (weightGainedSoFar / weightGainNeeded) * 100;
          break;
      }

      // Ensure progress is between 0 and 100
      return Math.min(100, Math.max(0, Math.round(progressPercentage)));
    } catch (error) {
      console.error("Error calculating fitness goal progress:", error);
      return 0;
    }
  }

  // Create a new group
  async function handleCreateGroup(event) {
    event.preventDefault();

    if (!currentUser) {
      alert("You must be logged in to create a group.");
      return;
    }
    const formData = new FormData(event.target);
    const groupName = formData.get("group-name").trim();
    const groupDescription = formData.get("group-description");

    if (!groupName) {
      showMessage("Group name cannot be empty", true);
      return;
    }

    if (groupName.length < 3) {
      showMessage("Group name must be at least 3 characters long", true);
      return;
    }

    try {
      const groupCode = generateGroupCode();

      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          code: groupCode,
          userId: currentUser.uid,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create group");
      }

      showMessage("Group created successfully!");
      event.target.reset();

      const validationMessage = document.getElementById(
        "group-name-validation"
      );
      if (validationMessage) {
        validationMessage.textContent = "";
        validationMessage.className = "validation-message";
      }

      document.querySelector('[data-tab="my-groups"]').click();
      loadUserGroups();
    } catch (error) {
      console.error("Error creating group:", error);
      showMessage(error.message || "Error creating group", true);
    }
  }

  // Join a group using a code
  async function handleJoinGroup(event) {
    event.preventDefault();

    if (!currentUser) {
      alert("You must be logged in to join a group.");
      return;
    }

    const formData = new FormData(event.target);
    const groupCode = formData.get("group-code");

    try {
      const db = window.db;

      // Find the group with this code
      const groupsRef = window.collection(db, "groups");
      const q = window.query(groupsRef, window.where("code", "==", groupCode));
      const querySnapshot = await window.getDocs(q);

      if (querySnapshot.empty) {
        showMessage(
          "No group found with this code. Please check and try again.",
          true
        );
        return;
      }

      const groupDoc = querySnapshot.docs[0];
      const groupId = groupDoc.id;
      const groupData = groupDoc.data();

      // Check if user is already a member
      const membershipRef = window.doc(
        db,
        "group_memberships",
        `${groupId}_${currentUser.uid}`
      );
      const membershipDoc = await window.getDoc(membershipRef);

      if (membershipDoc.exists()) {
        showMessage("You are already a member of this group.", true);
        return;
      }

      // Add user as a member
      await window.setDoc(membershipRef, {
        userId: currentUser.uid,
        groupId: groupId,
        joinedAt: window.serverTimestamp(),
        role: "member",
      });

      // Update the member count
      await window.setDoc(groupDoc.ref, {
        ...groupData,
        memberCount: (groupData.memberCount || 0) + 1,
      });

      showMessage("You've successfully joined the group!");
      event.target.reset();

      // Switch to My Groups tab and refresh
      document.querySelector('[data-tab="my-groups"]').click();
      loadUserGroups();
    } catch (error) {
      console.error("Error joining group:", error);
      showMessage("Error joining group: " + error.message, true);
    }
  } // Create a new goal for the current group
  async function handleCreateGoal(event) {
    event.preventDefault();

    if (!currentUser || !currentGroup) {
      alert("Error: Missing user or group information.");
      return;
    }

    const fitnessGoal = document.getElementById("group_fitness_goal").value;
    const targetWeight = document.getElementById("group_target_weight").value;
    const goalDescription = document.getElementById("goal-description").value;

    try {
      const db = window.db;

      // Get the user's current weight to use as initial weight for the goal
      let initialWeight = null;
      try {
        const userDoc = await window.getDoc(
          window.doc(db, "users", currentUser.uid)
        );
        if (userDoc.exists()) {
          const userData = userDoc.data();
          initialWeight = userData.current_weight || userData.weight;
        }
      } catch (userError) {
        console.error("Error fetching user weight:", userError);
      }

      // Generate a unique join code for this goal
      const goalJoinCode = generateGoalJoinCode();

      // Add goal to the group
      const goalRef = window.doc(
        window.collection(db, "groups", currentGroup.id, "goals")
      );
      await window.setDoc(goalRef, {
        fitness_goal: fitnessGoal,
        goal_type: fitnessGoal,
        target_weight:
          fitnessGoal === "maintain_weight" ? initialWeight : targetWeight,
        initial_weight: initialWeight,
        description: goalDescription,
        start_date: window.serverTimestamp(),
        createdBy: currentUser.uid,
        createdAt: window.serverTimestamp(),
        participants: [currentUser.uid], // Creator is automatically a participant
        joinCode: goalJoinCode,
      });

      // Send email notifications to all group members with goal join code
      await notifyGroupMembersAboutGoal(currentGroup.id, {
        type: "new_goal",
        goalTitle: getFitnessGoalName(fitnessGoal),
        groupName: currentGroup.name,
        goalJoinCode: goalJoinCode,
        goalId: goalRef.id,
      });

      showMessage(
        "Goal created successfully! Other members will receive a join code."
      );
      event.target.reset();

      // Refresh goals list
      loadGroupGoals(currentGroup.id);
    } catch (error) {
      console.error("Error creating goal:", error);
      showMessage("Error creating goal: " + error.message, true);
    }
  }

  // Helper function to get readable name for fitness goal
  function getFitnessGoalName(goalType) {
    switch (goalType) {
      case "lose_weight":
        return "Lose Weight";
      case "maintain_weight":
        return "Maintain Weight";
      case "build_muscle":
        return "Build Muscle";
      default:
        return goalType;
    }
  }

  // Share group via email
  async function handleShareViaEmail(event) {
    event.preventDefault();

    if (!currentUser || !currentGroup) {
      alert("Error: Missing user or group information.");
      return;
    }

    const recipientEmail = document.getElementById("recipient-email").value;

    // Show loading indicator
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) {
      const originalText = submitButton.innerHTML;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Sending...';
    }

    try {
      // Get sender's name from Firebase
      const db = window.db;
      const userDoc = await window.getDoc(
        window.doc(db, "users", currentUser.uid)
      );
      const userData = userDoc.exists() ? userDoc.data() : {};
      const senderName =
        userData.username ||
        (userData.forename && userData.surname
          ? `${userData.forename} ${userData.surname}`
          : "A Health Tracker user");

      // Call our server endpoint to send the email
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientEmail,
          groupName: currentGroup.name,
          groupCode: currentGroup.code,
          senderName,
          senderUserId: currentUser.uid,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showMessage("Invitation email sent successfully to " + recipientEmail);
        event.target.reset();
      } else {
        throw new Error(result.message || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      showMessage("Error sending invitation: " + error.message, true);
    } finally {
      // Reset button state
      if (submitButton) {
        submitButton.innerHTML = '<i class="fas fa-envelope"></i> Send Invite';
      }
    }
  }

  // Leave a group
  async function handleLeaveGroup() {
    if (!currentUser || !currentGroup) {
      alert("Error: Missing user or group information.");
      return;
    }

    if (!confirm("Are you sure you want to leave this group?")) {
      return;
    }

    try {
      const db = window.db;

      // Remove membership
      await window.deleteDoc(
        window.doc(
          db,
          "group_memberships",
          `${currentGroup.id}_${currentUser.uid}`
        )
      );

      // Update member count
      const groupRef = window.doc(db, "groups", currentGroup.id);
      const groupDoc = await window.getDoc(groupRef);

      if (groupDoc.exists()) {
        const groupData = groupDoc.data();
        await window.setDoc(groupRef, {
          ...groupData,
          memberCount: Math.max((groupData.memberCount || 1) - 1, 0),
        });
      }

      showMessage("You have left the group.");
      document.getElementById("group-modal").style.display = "none";

      // Refresh groups list
      loadUserGroups();
    } catch (error) {
      console.error("Error leaving group:", error);
      showMessage("Error leaving group: " + error.message, true);
    }
  }

  // Notify group members about events (e.g., new goals, achievements)
  async function notifyGroupMembers(groupId, notification) {
    try {
      const db = window.db;

      // Get all group members
      const membershipsRef = window.collection(db, "group_memberships");
      const q = window.query(
        membershipsRef,
        window.where("groupId", "==", groupId)
      );
      const querySnapshot = await window.getDocs(q);

      // For each member, create a notification
      for (const doc of querySnapshot.docs) {
        const membership = doc.data();
        const userId = membership.userId;

        // Skip notification for the user who created the event
        if (userId === currentUser.uid) continue;

        // In a real app, you'd implement proper push notifications
        // For now, we'll just add to a notifications collection
        await window.addDoc(window.collection(db, "notifications"), {
          userId,
          groupId,
          ...notification,
          read: false,
          createdAt: window.serverTimestamp(),
        });

        // You could also trigger email notifications here
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
    }
  }

  // Special notification function for goals that includes join code
  async function notifyGroupMembersAboutGoal(groupId, goalInfo) {
    try {
      const db = window.db;

      // Get all group members
      const membershipsRef = window.collection(db, "group_memberships");
      const q = window.query(
        membershipsRef,
        window.where("groupId", "==", groupId)
      );
      const querySnapshot = await window.getDocs(q);

      // For each member, create a notification
      for (const doc of querySnapshot.docs) {
        const membership = doc.data();
        const userId = membership.userId;

        // Skip notification for the user who created the event
        if (userId === currentUser.uid) continue;

        // Add to notifications collection
        await window.addDoc(window.collection(db, "notifications"), {
          userId,
          groupId,
          ...goalInfo,
          read: false,
          createdAt: window.serverTimestamp(),
        });

        // Get user email for email notification
        try {
          const userDoc = await window.getDoc(window.doc(db, "users", userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userEmail = userData.email;

            if (userEmail) {
              console.log(
                `Sending goal join invitation to ${userEmail} with code ${goalInfo.goalJoinCode}`
              );

              // Send email with goal join code
              const response = await fetch("/api/send-goal-invite", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  recipientEmail: userEmail,
                  groupName: goalInfo.groupName,
                  goalTitle: goalInfo.goalTitle,
                  goalJoinCode: goalInfo.goalJoinCode,
                  senderName: currentUser.displayName || "A group member",
                }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Email notification failed:", errorData);
              } else {
                console.log(
                  `Successfully sent goal invitation to ${userEmail}`
                );
              }
            } else {
              console.warn(
                `User ${userId} does not have an email address configured`
              );
            }
          } else {
            console.warn(`User document not found for user ${userId}`);
          }
        } catch (emailError) {
          console.error("Error sending goal join email:", emailError);
        }
      }
    } catch (error) {
      console.error("Error sending goal notifications:", error);
    }
  }

  // Generate a random code for group sharing
  function generateGroupCode() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  // Generate a random code for goal joining
  function generateGoalJoinCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing characters like 0, O, 1, I
    let code = "GOAL-";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  // Handle joining a goal with a code
  async function handleJoinGoal(event) {
    event.preventDefault();

    if (!currentUser || !currentGroup) {
      alert("Error: Missing user or group information.");
      return;
    }

    const joinCode = document.getElementById("goal-join-code").value.trim();

    if (!joinCode) {
      showMessage("Please enter a valid goal join code", true);
      return;
    }

    try {
      const db = window.db;

      // Search for the goal with this join code in this group
      const goalsRef = window.collection(
        db,
        "groups",
        currentGroup.id,
        "goals"
      );
      const q = window.query(
        goalsRef,
        window.where("joinCode", "==", joinCode)
      );
      const querySnapshot = await window.getDocs(q);

      if (querySnapshot.empty) {
        showMessage(
          "No goal found with this code in this group. Please check and try again.",
          true
        );
        return;
      }

      const goalDoc = querySnapshot.docs[0];
      const goalData = goalDoc.data();

      // Check if user is already a participant
      if (
        goalData.participants &&
        goalData.participants.includes(currentUser.uid)
      ) {
        showMessage("You are already participating in this goal.", true);
        return;
      }

      // Add user to participants
      const updatedParticipants = [
        ...(goalData.participants || []),
        currentUser.uid,
      ];

      // Update the goal document
      await window.updateDoc(goalDoc.ref, {
        participants: updatedParticipants,
      });

      showMessage("You have successfully joined the goal!");
      event.target.reset();

      // Refresh goals list
      loadGroupGoals(currentGroup.id);
    } catch (error) {
      console.error("Error joining goal:", error);
      showMessage("Error joining goal: " + error.message, true);
    }
  }

  // Display a message to the user
  function showMessage(message, isError = false) {
    // Check if message element exists already
    let messageEl = document.querySelector(".message-alert");

    // Create if it doesn't exist
    if (!messageEl) {
      messageEl = document.createElement("div");
      messageEl.className = "message-alert";
      document.body.appendChild(messageEl);

      // Style the message
      messageEl.style.position = "fixed";
      messageEl.style.bottom = "70px";
      messageEl.style.left = "50%";
      messageEl.style.transform = "translateX(-50%)";
      messageEl.style.padding = "10px 20px";
      messageEl.style.borderRadius = "5px";
      messageEl.style.fontWeight = "bold";
      messageEl.style.zIndex = "1000";
      messageEl.style.textAlign = "center";
    }

    // Set message content and styling
    messageEl.textContent = message;
    messageEl.style.backgroundColor = isError ? "#ff3b30" : "#34c759";
    messageEl.style.color = "white";

    // Show the message
    messageEl.style.display = "block";

    // Hide after 3 seconds
    setTimeout(() => {
      messageEl.style.display = "none";
    }, 3000);
  }
});
