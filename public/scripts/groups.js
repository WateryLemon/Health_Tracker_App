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
      // Initialize all event listeners
      initializeEventListeners();
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
    const fitnessGoalSelect = document.getElementById("goal_fitness_goal");
    const targetWeightGroup = document.getElementById(
      "goal_target_weight_group"
    );
    const targetWeightInput = document.getElementById("goal_target_weight");
    const targetWeightLabel = document.querySelector(
      'label[for="goal_target_weight"]'
    );
    if (fitnessGoalSelect) {
      fitnessGoalSelect.addEventListener("change", function () {
        // First, cancel any pending transitions
        if (window.weightTransitionTimer) {
          clearTimeout(window.weightTransitionTimer);
        }

        // Hide the helper text by default
        document.getElementById("goal-maintain-weight-help").style.display =
          "none";

        if (this.value === "lose_weight") {
          // Immediately show for lose weight
          targetWeightGroup.style.display = "block";
          // Wait before adding the visible class for transition
          setTimeout(() => targetWeightGroup.classList.add("visible"), 10);
          targetWeightInput.required = true;
          targetWeightInput.value = "";

          if (targetWeightLabel) {
            targetWeightLabel.textContent = "Target Weight Loss (kg)";
          }
        } else if (this.value === "gain_weight") {
          targetWeightGroup.style.display = "block";

          setTimeout(() => targetWeightGroup.classList.add("visible"), 10);
          targetWeightInput.required = true;
          targetWeightInput.value = "";
          // Update label for weight gain
          if (targetWeightLabel) {
            targetWeightLabel.textContent = "Target Weight Gain (kg)";
          }
        } else if (this.value === "maintain_weight") {
          targetWeightGroup.style.display = "block";

          setTimeout(() => targetWeightGroup.classList.add("visible"), 10);
          targetWeightInput.required = true;
          targetWeightInput.value = "";

          if (targetWeightLabel) {
            targetWeightLabel.textContent = "Weight Fluctuation Range (kg)";
          }

          document.getElementById("goal-maintain-weight-help").style.display =
            "block";
        } else if (this.value === "build_muscle") {
          // For build muscle
          targetWeightGroup.style.display = "block";

          setTimeout(() => targetWeightGroup.classList.add("visible"), 10);
          targetWeightInput.required = true;
          targetWeightInput.value = "";

          if (targetWeightLabel) {
            targetWeightLabel.textContent = "Target Muscle Mass Gain (kg)";
          }
        } else {
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
  } // Setup fitness goal selection for main create group form
  function setupCreateGroupGoalSelection() {
    const createGroupFitnessGoalSelect = document.getElementById(
      "create_group_fitness_goal"
    );
    const createGroupTargetWeightGroup = document.getElementById(
      "create_group_target_weight_group"
    );
    const createGroupTargetWeightInput = document.getElementById(
      "create_group_target_weight"
    );
    const createGroupTargetWeightLabel = document.querySelector(
      'label[for="create_group_target_weight"]'
    );

    if (createGroupFitnessGoalSelect) {
      createGroupFitnessGoalSelect.addEventListener("change", function () {
        // cancel any pending transitions
        if (window.createGroupWeightTransitionTimer) {
          clearTimeout(window.createGroupWeightTransitionTimer);
        }

        // Hide the helper text by default
        document.getElementById(
          "create-group-maintain-weight-help"
        ).style.display = "none";

        const value = this.value;
        if (
          value === "lose_weight" ||
          value === "gain_weight" ||
          value === "maintain_weight" ||
          value === "build_muscle"
        ) {
          // Show for all weight-related goals
          createGroupTargetWeightGroup.style.display = "block";
          // Wait before adding the visible class for transition
          setTimeout(
            () => createGroupTargetWeightGroup.classList.add("visible"),
            10
          );
          createGroupTargetWeightInput.required = true;
          createGroupTargetWeightInput.value = "";

          // Update label based on goal type
          if (createGroupTargetWeightLabel) {
            if (value === "lose_weight") {
              createGroupTargetWeightLabel.textContent =
                "Target Weight Loss (kg)";
            } else if (value === "gain_weight") {
              createGroupTargetWeightLabel.textContent =
                "Target Weight Gain (kg)";
            } else if (value === "maintain_weight") {
              createGroupTargetWeightLabel.textContent =
                "Weight Fluctuation Range (kg)";

              document.getElementById(
                "create-group-maintain-weight-help"
              ).style.display = "block";
            } else if (value === "build_muscle") {
              createGroupTargetWeightLabel.textContent =
                "Target Muscle Mass Gain (kg)";
            }
          }
        } else {
          // other options or no selection, hide slowly
          createGroupTargetWeightGroup.classList.remove("visible");
          createGroupTargetWeightInput.required = false;
          createGroupTargetWeightInput.value = "";
          // Wait for transition to complete before hiding
          window.createGroupWeightTransitionTimer = setTimeout(() => {
            if (!createGroupTargetWeightGroup.classList.contains("visible")) {
              createGroupTargetWeightGroup.style.display = "none";
            }
          }, 300);
        }
      });
    }
  }

  // Tab switching functionality
  function initializeTabSwitching() {
    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
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
  }

  // Modal tab switching functionality
  function initializeModalTabSwitching() {
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
          tabElement.classList.add("active"); // handling for share tab
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
  }

  // Close modal functionality
  function initializeModalClose() {
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
  }

  // Handle Copy Code button click
  function handleCopyCode() {
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
  }

  // Initialize all event listeners
  function initializeEventListeners() {
    // Tab switching functionality
    initializeTabSwitching();

    // Modal tab switching functionality
    initializeModalTabSwitching();

    // Close modal functionality
    initializeModalClose();

    // Initialize form submissions
    document
      .getElementById("create-group-form")
      .addEventListener("submit", handleCreateGroup);
    document
      .getElementById("join-group-form")
      .addEventListener("submit", handleJoinGroup);
    document
      .getElementById("create-goal-form")
      .addEventListener("submit", handleCreateGoal);
    document
      .getElementById("join-goal-form")
      .addEventListener("submit", handleJoinGoal);
    document
      .getElementById("share-email-form")
      .addEventListener("submit", handleShareViaEmail);

    // Misc button handlers
    document
      .getElementById("copy-code-btn")
      .addEventListener("click", handleCopyCode);
    document
      .getElementById("leave-group-btn")
      .addEventListener("click", handleLeaveGroup);
  }

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
  }

  // Open group details modal
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

      // Process goals one by one withasync handling
      for (const goal of goals) {
        const goalItem = document.createElement("div");
        goalItem.className = "goal-item"; // Calculate the progress
        let progressPercentage = await calculateFitnessGoalProgress(goal);
        console.log(
          `Goal ${goal.id} progress from calculation: ${progressPercentage}%`
        );

        // Format the goal information based on the goal type
        let goalTitle = "";
        let goalDetails = "";
        let progressDetails = "";

        // Determine initial weight use users weight if available
        let initialWeight;
        if (
          goal.participant_weights &&
          goal.participant_weights[currentUser.uid]
        ) {
          // Use individual starting weight if available
          initialWeight = parseFloat(goal.participant_weights[currentUser.uid]);
        } else {
          // Fall back to goal's initial weight if individual weight is not available
          initialWeight = parseFloat(goal.initial_weight || 0);
        }

        // Fetch current weight from user profile
        let currentWeight = initialWeight; // Default to initial weight
        try {
          const userDoc = await window.getDoc(
            window.doc(window.db, "users", currentUser.uid)
          );
          if (userDoc.exists()) {
            const userData = userDoc.data();
            currentWeight = parseFloat(
              userData.current_weight || userData.weight || initialWeight
            );
          }
        } catch (error) {
          console.error("Error fetching user weight:", error);
        }

        // Get the weight change amount - either directly stored or calculated from target/initial
        const weightChangeAmount =
          goal.weight_change_amount ||
          (goal.target_weight && initialWeight
            ? Math.abs(parseFloat(goal.target_weight) - initialWeight)
            : 0);

        switch (goal.fitness_goal) {
          case "lose_weight":
            goalTitle = "Lose Weight";
            if (initialWeight) {
              if (goal.weight_change_amount) {
                // Check if this user is the goal creator or joined later
                const isGoalCreator = goal.createdBy === currentUser.uid;

                if (isGoalCreator) {
                  goalDetails = `Target: Lose ${goal.weight_change_amount} kg (starting from ${initialWeight} kg)`;
                } else {
                  // For users who joined the goal later, show their individual starting weight
                  goalDetails = `Target: Lose ${goal.weight_change_amount} kg (your starting weight: ${initialWeight} kg)`;
                }

                // Get current weight from user's profile for progress display
                const weightLostSoFar = (initialWeight - currentWeight).toFixed(
                  1
                );
                const targetLoss = parseFloat(goal.weight_change_amount);
                progressDetails = `Current Progress: ${weightLostSoFar} kg lost, ${((weightLostSoFar / targetLoss) * 100).toFixed(0)}% of goal`;
              } else if (goal.target_weight) {
                const targetWeightKg = parseFloat(goal.target_weight);
                const weightLossTarget = (
                  initialWeight - targetWeightKg
                ).toFixed(1);

                // Check if this user is the goal creator or joined later
                const isGoalCreator = goal.createdBy === currentUser.uid;

                if (isGoalCreator) {
                  goalDetails = `Target: Lose ${weightLossTarget} kg (starting from ${initialWeight} kg)`;
                } else {
                  // For users who joined the goal later, show their individual starting weight
                  goalDetails = `Target: Lose ${weightLossTarget} kg (your starting weight: ${initialWeight} kg)`;
                }

                const weightLostSoFar = (initialWeight - currentWeight).toFixed(
                  1
                );
                progressDetails = `Current Progress: ${weightLostSoFar} kg lost, ${((weightLostSoFar / weightLossTarget) * 100).toFixed(0)}% of goal`;
              }
            }
            break;
          case "gain_weight":
            goalTitle = "Gain Weight";
            if (initialWeight) {
              if (goal.weight_change_amount) {
                // New format: storing the change amount directly
                // Check if this user is the goal creator or joined later
                const isGoalCreator = goal.createdBy === currentUser.uid;

                if (isGoalCreator) {
                  goalDetails = `Target: Gain ${goal.weight_change_amount} kg (starting from ${initialWeight} kg)`;
                } else {
                  // For users who joined the goal later, show their individual starting weight
                  goalDetails = `Target: Gain ${goal.weight_change_amount} kg (your starting weight: ${initialWeight} kg)`;
                }

                // Show progress based on current weight
                const weightGainedSoFar = (
                  currentWeight - initialWeight
                ).toFixed(1);
                const targetGain = parseFloat(goal.weight_change_amount);
                progressDetails = `Current Progress: ${weightGainedSoFar} kg gained, ${((weightGainedSoFar / targetGain) * 100).toFixed(0)}% of goal`;
              } else if (goal.target_weight) {
                const targetWeightKg = parseFloat(goal.target_weight);
                const weightGainTarget = (
                  targetWeightKg - initialWeight
                ).toFixed(1);

                // Check if this user is the goal creator or joined later
                const isGoalCreator = goal.createdBy === currentUser.uid;

                if (isGoalCreator) {
                  goalDetails = `Target: Gain ${weightGainTarget} kg (starting from ${initialWeight} kg)`;
                } else {
                  // For users who joined the goal later, show their individual starting weight
                  goalDetails = `Target: Gain ${weightGainTarget} kg (your starting weight: ${initialWeight} kg)`;
                }

                const weightGainedSoFar = (
                  currentWeight - initialWeight
                ).toFixed(1);
                progressDetails = `Current Progress: ${weightGainedSoFar} kg gained, ${((weightGainedSoFar / weightGainTarget) * 100).toFixed(0)}% of goal`;
              }
            }
            break;
          case "maintain_weight":
            goalTitle = "Maintain Weight";
            if (initialWeight) {
              const fluctuationRange = goal.weight_change_amount || 2; // Default to 2kg if not specified

              // Check if this user is the goal creator or joined later
              const isGoalCreator = goal.createdBy === currentUser.uid;

              if (isGoalCreator) {
                goalDetails = `Target: Maintain ${initialWeight} kg within ±${fluctuationRange} kg range`;
              } else {
                // For users who joined the goal later, show their individual starting weight
                goalDetails = `Target: Maintain your weight (${initialWeight} kg) within ±${fluctuationRange} kg range`;
              }

              // Show current weight status
              const weightDifference = (currentWeight - initialWeight).toFixed(
                1
              );
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
            if (initialWeight) {
              if (goal.weight_change_amount) {
                // Check if this user is the goal creator or joined later
                const isGoalCreator = goal.createdBy === currentUser.uid;

                if (isGoalCreator) {
                  goalDetails = `Target: Gain ${goal.weight_change_amount} kg of muscle (starting from ${initialWeight} kg)`;
                } else {
                  // For users who joined the goal later, show their individual starting weight
                  goalDetails = `Target: Gain ${goal.weight_change_amount} kg of muscle (your starting weight: ${initialWeight} kg)`;
                }

                // Show progress based on current weight
                const weightGainedSoFar = (
                  currentWeight - initialWeight
                ).toFixed(1);
                const targetGain = parseFloat(goal.weight_change_amount);
                progressDetails = `Current Progress: ${weightGainedSoFar} kg gained, ${((weightGainedSoFar / targetGain) * 100).toFixed(0)}% of goal`;
              } else if (goal.target_weight) {
                const targetWeightKg = parseFloat(goal.target_weight);
                const weightGainTarget = (
                  targetWeightKg - initialWeight
                ).toFixed(1);

                // Check if this user is the goal creator or joined later
                const isGoalCreator = goal.createdBy === currentUser.uid;

                if (isGoalCreator) {
                  goalDetails = `Target: Gain ${weightGainTarget} kg of muscle (starting from ${initialWeight} kg)`;
                } else {
                  // For users who joined the goal later, show their individual starting weight
                  goalDetails = `Target: Gain ${weightGainTarget} kg of muscle (your starting weight: ${initialWeight} kg)`;
                }

                const weightGainedSoFar = (
                  currentWeight - initialWeight
                ).toFixed(1);
                progressDetails = `Current Progress: ${weightGainedSoFar} kg gained, ${((weightGainedSoFar / weightGainTarget) * 100).toFixed(0)}% of goal`;
              }
            }
            break;

          default:
            goalTitle = goal.fitness_goal || "Custom Goal";
        }

        // Add description if available
        if (goal.description) {
          goalDetails += goalDetails
            ? `<br>${goal.description}`
            : goal.description;
        }

        // Convert the timestamp to a readable date
        const startDate = goal.start_date
          ? new Date(goal.start_date.seconds * 1000).toLocaleDateString()
          : "N/A"; // Check if the current user is participating in this goal
        const isParticipating =
          goal.participants && goal.participants.includes(currentUser.uid);
        // Check if the goal is completed by this user
        const hasCompletedByArray = Boolean(goal.completed_by);
        const completedByContainsUser = hasCompletedByArray
          ? goal.completed_by.includes(currentUser.uid)
          : false;
        const isGoalCompleted = hasCompletedByArray && completedByContainsUser;

        console.log(`Goal ${goal.id} completion check:`, {
          hasCompletedByArray,
          completedByContainsUser,
          isGoalCompleted,
          userId: currentUser.uid,
          completedByArray: goal.completed_by || [],
        });

        // Always ensure progress is 100% when the goal is completed
        if (isGoalCompleted) {
          console.log(
            `Goal ${goal.id} is completed - forcing progress to 100% (was ${progressPercentage}%)`
          );
          // Force the progress to exactly 100%, no matter what was calculated
          progressPercentage = 100;
        } // Show appropriate status message
        let participationHTML = "";
        if (!isParticipating) {
          participationHTML = `<div class="goal-not-joined">You are not tracking this goal yet. Enter the join code above to participate.</div>`;
        } else if (isGoalCompleted) {
          participationHTML = `<div class="goal-completed-indicator">🎉 Congratulations! You've completed this goal!</div>`;
          // Force progress to 100% for completed goals
          progressPercentage = 100;
          console.log(
            `Goal ${goal.id} - reconfirming completion status with progress = ${progressPercentage}%`
          );
        } else {
          participationHTML = `<div class="goal-joined-indicator">
            <span>✓ You're participating</span>
            <button class="remove-goal-btn small-btn" data-goal-id="${goal.id}">Remove</button>
          </div>`;
        }
        // Add special class for completed goals' progress bar
        const progressBarClass = isGoalCompleted
          ? "progress-bar completed"
          : "progress-bar";
        // Modify progress details to show celebration message when goal is completed
        let displayedProgressDetails = progressDetails;
        if (isGoalCompleted) {
          let completedDate = "recently";
          if (goal.completed_at) {
            completedDate = new Date(
              goal.completed_at.seconds * 1000
            ).toLocaleDateString();
          }
          displayedProgressDetails = `Goal completed on ${completedDate}! 🎉`;
        } // Render goal item
        if (isGoalCompleted) {
          console.log(`Rendering completed goal UI for goal ${goal.id}`);
          // Enhanced completed goal UI
          let completedDate = "recently";
          if (goal.completed_at) {
            completedDate = new Date(
              goal.completed_at.seconds * 1000
            ).toLocaleDateString();
          }

          goalItem.className = "goal-item completed-goal"; // Add a specific class for completed goals
          goalItem.innerHTML = `
            <div class="goal-header">
                <div class="goal-title">${goalTitle}</div>
                <div class="goal-date">Started: ${startDate}</div>
            </div>
            <div class="goal-completed-message">
                <span class="completion-icon">✓</span>
                Goal Completed! 🎉
                <div class="completion-date">Completed on ${completedDate}</div>
            </div>
            <button class="remove-goal-btn" data-goal-id="${goal.id}">Remove Goal</button>
            <div class="goal-details">${goalDetails}</div>
            ${participationHTML}
          `;
        } else {
          goalItem.innerHTML = `
            <div class="goal-header">
                <div class="goal-title">${goalTitle}</div>
                <div class="goal-date">Started: ${startDate}</div>
            </div>
            <div class="goal-progress">
                <div class="${progressBarClass}" style="width: ${progressPercentage}%"></div>
                <div class="progress-percentage">${progressPercentage}%</div>
            </div>
            <div class="goal-details">${goalDetails}</div>
            ${displayedProgressDetails ? `<div class="progress-details">${displayedProgressDetails}</div>` : ""}
            ${participationHTML}
          `;
        } // Add event listener for remove button if present
        const removeBtns = goalItem.querySelectorAll(".remove-goal-btn");
        removeBtns.forEach((btn) => {
          btn.addEventListener("click", function (e) {
            e.stopPropagation(); // Prevent the event from bubbling up
            removeGoal(goal.id);
          });
        });

        goalsList.appendChild(goalItem);
      }
    } catch (error) {
      console.error("Error loading group goals:", error);
    }
  }
  // Calculate goal progress for fitness goals
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
    } // If the goal is already completed by this user, always return 100%
    if (goal.completed_by && goal.completed_by.includes(currentUser.uid)) {
      console.log(
        `Goal ${goal.id} is already marked as completed, returning 100%`
      );
      return 100;
    }

    // For goals that don't involve weight tracking
    if (
      goal.fitness_goal !== "lose_weight" &&
      goal.fitness_goal !== "maintain_weight" &&
      goal.fitness_goal !== "gain_weight" &&
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
        userData.current_weight || userData.weight || 0
      );

      // Determine the initial weight based on individual participant weight if available
      let initialWeight;
      if (
        goal.participant_weights &&
        goal.participant_weights[currentUser.uid]
      ) {
        // Use individual starting weight if available
        initialWeight = parseFloat(goal.participant_weights[currentUser.uid]);
      } else {
        // Fall back to goal's initial weight if individual weight is not available
        initialWeight = parseFloat(goal.initial_weight || 0);
      }

      // Get the weight change amount - either directly stored or calculated from target/initial
      const weightChangeAmount = goal.weight_change_amount
        ? parseFloat(goal.weight_change_amount)
        : goal.target_weight
          ? Math.abs(parseFloat(goal.target_weight) - initialWeight)
          : 0;

      // If we're missing any required data, return 0 progress
      if (
        isNaN(currentWeight) ||
        isNaN(initialWeight) ||
        initialWeight === 0 ||
        weightChangeAmount === 0
      ) {
        // If the goal is completed, still return 100%
        if (goal.completed_by && goal.completed_by.includes(currentUser.uid)) {
          return 100;
        }
        return 0;
      } // Calculate progress based on goal type
      let progressPercentage = 0;
      let achievementValue = 0;
      let isGoalCompleted = false;

      switch (goal.fitness_goal) {
        case "maintain_weight":
          // For maintain weight, calculate how close current weight is to initial
          // We consider being within the fluctuation range as success
          const maintainDifference = Math.abs(currentWeight - initialWeight);
          const fluctuationRange = weightChangeAmount; // Use stored weight_change_amount as the acceptable range

          if (maintainDifference <= fluctuationRange) {
            progressPercentage = 100;
            achievementValue = fluctuationRange;
            isGoalCompleted = true;
          } else {
            // Calculate a score based on how close to the threshold the user is
            // The further away, the lower the score (down to 0%)
            const maxDifference = fluctuationRange * 2; // Double the acceptable range = 0% score
            progressPercentage =
              100 -
              (Math.min(maintainDifference, maxDifference) / maxDifference) *
                100;

            // Ensure we don't return 0 for maintain weight goals
            if (progressPercentage < 20) progressPercentage = 20;
          }
          break;

        case "lose_weight":
          // Goal is to lose weight
          const weightLostSoFar = initialWeight - currentWeight;
          progressPercentage = (weightLostSoFar / weightChangeAmount) * 100;

          // Check if goal is completed (100% or more progress)
          if (progressPercentage >= 100) {
            isGoalCompleted = true;
            achievementValue = weightLostSoFar.toFixed(1);
            progressPercentage = 100; // Cap at 100%
          }
          break;

        case "gain_weight":
        case "build_muscle":
          // Goal is to gain weight/muscle
          const weightGainedSoFar = currentWeight - initialWeight;
          progressPercentage = (weightGainedSoFar / weightChangeAmount) * 100;

          // Check if goal is completed (100% or more progress)
          if (progressPercentage >= 100) {
            isGoalCompleted = true;
            achievementValue = weightGainedSoFar.toFixed(1);
            progressPercentage = 100; // Cap at 100%
          }
          break;
      } // Handle goal completion if needed
      if (isGoalCompleted) {
        // Force the progress to exactly 100%
        progressPercentage = 100;

        // Check if we need to notify about goal completion
        const shouldNotify = !(
          goal.completed_by && goal.completed_by.includes(currentUser.uid)
        );

        console.log(
          `Goal ${goal.id} should be completed? ${isGoalCompleted}, Should notify? ${shouldNotify}`
        );

        if (shouldNotify) {
          // Verify that currentGroup is available
          if (!currentGroup) {
            console.error(
              `Cannot mark goal ${goal.id} as completed: currentGroup is undefined`
            );
            return 100; // Still return 100% even if we couldn't update the database
          }

          // Mark goal as completed for this user
          const goalRef = window.doc(
            window.db,
            "groups",
            currentGroup.id,
            "goals",
            goal.id
          ); // Update the completed_by array to include this user
          // First get the current completed_by array
          const goalDoc = await window.getDoc(goalRef);
          const goalData = goalDoc.exists() ? goalDoc.data() : {};
          const completedBy = goalData.completed_by || [];

          // Only add the user if not already in the array
          if (!completedBy.includes(currentUser.uid)) {
            completedBy.push(currentUser.uid);
          }

          // Update with the new array
          await window.updateDoc(goalRef, {
            completed_by: completedBy,
            completed_at: window.serverTimestamp(),
          });

          // Notify all group members about the goal completion
          await notifyGroupMembersOfGoalCompletion(
            currentGroup.id,
            goal.id,
            getFitnessGoalName(goal.fitness_goal),
            goal.fitness_goal,
            achievementValue
          ); // Show success message to current user and trigger confetti animation
          showMessage("Congratulations! You've completed this goal! 🎉");

          // Show a celebration animation when goal is completed
          showCompletionCelebration();
        }
      } // If the goal was just completed in this calculation, force isGoalCompleted flag
      if (progressPercentage >= 100) {
        isGoalCompleted = true;
      }

      // If goal is completed (either previously marked or just completed), ensure 100% is returned
      if (
        (goal.completed_by && goal.completed_by.includes(currentUser.uid)) ||
        isGoalCompleted
      ) {
        // Always force 100% for completed goals
        return 100;
      } else {
        // Otherwise, ensure progress is between 0 and 100
        return Math.min(100, Math.max(0, Math.round(progressPercentage)));
      }
    } catch (error) {
      console.error("Error calculating fitness goal progress:", error);
      return 0;
    }
  }
  // Create a new group
  async function handleCreateGroup(event) {
    event.preventDefault();
    console.log("Create group form submitted");

    if (!currentUser) {
      console.log("User not logged in");
      alert("You must be logged in to create a group.");
      return;
    }
    const formData = new FormData(event.target);
    const groupName = formData.get("group-name").trim();
    const groupDescription = formData.get("group-description");

    console.log("Form data:", {
      groupName,
      groupDescription,
    });

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
      console.log("API response:", response.status, result);

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

      // Send goal join codes to the new member
      await sendGoalJoinCodesToNewMember(
        groupId,
        groupData.name,
        currentUser.uid
      );

      showMessage("You've successfully joined the group!");
      event.target.reset();

      // Switch to My Groups tab and refresh
      document.querySelector('[data-tab="my-groups"]').click();
      loadUserGroups();
    } catch (error) {
      console.error("Error joining group:", error);
      showMessage("Error joining group: " + error.message, true);
    }
  }
  // Create a new goal for the current group
  async function handleCreateGoal(event) {
    event.preventDefault();

    if (!currentUser || !currentGroup) {
      alert("Error: Missing user or group information.");
      return;
    }
    const fitnessGoal = document.getElementById("goal_fitness_goal").value;
    const targetWeightChange =
      document.getElementById("goal_target_weight").value;
    const goalDescription = document.getElementById("goal-description").value;

    if (!fitnessGoal) {
      showMessage("Please select a fitness goal", true);
      return;
    }

    // Validate target weight is required for all goal types
    if (!targetWeightChange || parseFloat(targetWeightChange) <= 0) {
      showMessage(
        "Please enter a valid weight change amount greater than 0",
        true
      );
      return;
    }

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

          // If no initial weight found in user profile, show error
          if (!initialWeight) {
            showMessage(
              "Cannot set a goal without a current weight in your profile. Please update your profile first.",
              true
            );
            return;
          }
        } else {
          showMessage(
            "Cannot find your user profile. Please update your profile with your current weight first.",
            true
          );
          return;
        }
      } catch (userError) {
        console.error("Error fetching user weight:", userError);
        showMessage(
          "Error accessing your current weight. Please try again or update your profile.",
          true
        );
        return;
      } // Generate a unique join code for this goal
      const goalJoinCode = generateGoalJoinCode();

      // Store the weight change amount directly
      const weightChangeAmount = parseFloat(targetWeightChange);

      // Create initial participant_weights object with creator's weight
      const participantWeights = {};
      participantWeights[currentUser.uid] = parseFloat(initialWeight);

      // Add goal to the group
      const goalRef = window.doc(
        window.collection(db, "groups", currentGroup.id, "goals")
      );
      await window.setDoc(goalRef, {
        fitness_goal: fitnessGoal,
        goal_type: fitnessGoal,
        weight_change_amount: weightChangeAmount,
        target_weight: calculateTargetWeight(
          initialWeight,
          fitnessGoal,
          weightChangeAmount
        ),
        initial_weight: initialWeight, // Keep for backward compatibility
        participant_weights: participantWeights, // Add participant weights mapping
        description: goalDescription,
        start_date: window.serverTimestamp(),
        createdBy: currentUser.uid,
        createdAt: window.serverTimestamp(),
        participants: [currentUser.uid], // Creator automatically participates
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
        `Goal created successfully! Your join code is: ${goalJoinCode}. You must use this code to join the goal.`
      );
      event.target.reset();

      // Refresh goals list
      loadGroupGoals(currentGroup.id);
    } catch (error) {
      console.error("Error creating goal:", error);
      showMessage("Error creating goal: " + error.message, true);
    }
  }

  // Calculate the target weight based on initial weight, goal type, and change amount
  function calculateTargetWeight(initialWeight, goalType, changeAmount) {
    initialWeight = parseFloat(initialWeight);
    changeAmount = parseFloat(changeAmount);

    switch (goalType) {
      case "lose_weight":
        return (initialWeight - changeAmount).toFixed(2);
      case "gain_weight":
      case "build_muscle":
        return (initialWeight + changeAmount).toFixed(2);
      case "maintain_weight":
        return initialWeight.toFixed(2); // For maintain weight, target is the same as initial
      default:
        return initialWeight.toFixed(2);
    }
  }

  // Helper function to get readable name for fitness goal
  function getFitnessGoalName(goalType) {
    switch (goalType) {
      case "lose_weight":
        return "Lose Weight";
      case "gain_weight":
        return "Gain Weight";
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
      const querySnapshot = await window.getDocs(q); // For each member, create a notification
      for (const doc of querySnapshot.docs) {
        const membership = doc.data();
        const userId = membership.userId;

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
  // Send goal join codes to a new group member
  async function sendGoalJoinCodesToNewMember(groupId, groupName, userId) {
    try {
      const db = window.db;

      // Fetch user's email
      const userDoc = await window.getDoc(window.doc(db, "users", userId));
      if (!userDoc.exists()) {
        console.error("User document not found");
        return;
      }

      const userData = userDoc.data();
      const userEmail = userData.email;

      if (!userEmail) {
        console.error("User has no email address configured");
        return;
      }

      // Fetch existing goals for this group
      const goalsRef = window.collection(db, "groups", groupId, "goals");
      const goalsSnapshot = await window.getDocs(goalsRef);

      if (goalsSnapshot.empty) {
        console.log("No goals found for this group");
        return;
      }

      // Send goal join codes for each goal
      for (const goalDoc of goalsSnapshot.docs) {
        const goalData = goalDoc.data();
        const goalJoinCode = goalData.joinCode;
        const goalTitle = getFitnessGoalName(goalData.fitness_goal);

        if (goalJoinCode) {
          // Send notification about this goal
          await window.addDoc(window.collection(db, "notifications"), {
            userId,
            groupId,
            type: "existing_goal",
            goalTitle,
            groupName,
            goalJoinCode,
            goalId: goalDoc.id,
            read: false,
            createdAt: window.serverTimestamp(),
          });

          // Send email with the goal join code
          console.log(
            `Sending existing goal join code to new member ${userEmail}: ${goalJoinCode}`
          );

          try {
            const response = await fetch("/api/send-goal-invite", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                recipientEmail: userEmail,
                groupName,
                goalTitle,
                goalJoinCode,
                senderName: "Health Tracker",
                isExistingGoal: true,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error("Email notification failed:", errorData);
            } else {
              console.log(`Successfully sent goal invitation to ${userEmail}`);
            }
          } catch (emailError) {
            console.error("Error sending goal join email:", emailError);
          }
        }
      }
    } catch (error) {
      console.error("Error sending goal join codes to new member:", error);
    }
  }

  // Send goal completion notification to all group members
  async function notifyGroupMembersOfGoalCompletion(
    groupId,
    goalId,
    goalTitle,
    goalType,
    achievementValue
  ) {
    try {
      console.log(
        `Sending goal completion notifications for goal ${goalId} in group ${groupId}`
      );

      const db = window.db;

      // Get current user's name
      const userDoc = await window.getDoc(
        window.doc(db, "users", currentUser.uid)
      );
      if (!userDoc.exists()) {
        console.error("User document not found");
        return;
      }

      const userData = userDoc.data();
      const userName =
        userData.username ||
        (userData.forename && userData.surname
          ? `${userData.forename} ${userData.surname}`
          : "A group member");

      // Get group name
      const groupDoc = await window.getDoc(window.doc(db, "groups", groupId));
      if (!groupDoc.exists()) {
        console.error("Group document not found");
        return;
      }

      const groupData = groupDoc.data();
      const groupName = groupData.name;

      // Get all group members
      const membershipsRef = window.collection(db, "group_memberships");
      const q = window.query(
        membershipsRef,
        window.where("groupId", "==", groupId)
      );
      const querySnapshot = await window.getDocs(q);

      // For each member, send a notification and email
      for (const doc of querySnapshot.docs) {
        const membership = doc.data();
        const userId = membership.userId;

        // Skip notification for the user who completed the goal
        if (userId === currentUser.uid) continue;

        // Add notification to database
        await window.addDoc(window.collection(db, "notifications"), {
          userId,
          groupId,
          goalId,
          type: "goal_completed",
          goalTitle,
          groupName,
          completedBy: currentUser.uid,
          completedByName: userName,
          read: false,
          createdAt: window.serverTimestamp(),
        });

        // Get user email for email notification
        try {
          const memberDoc = await window.getDoc(
            window.doc(db, "users", userId)
          );
          if (memberDoc.exists()) {
            const memberData = memberDoc.data();
            const memberEmail = memberData.email;

            if (memberEmail) {
              console.log(
                `Sending goal completion notification to ${memberEmail}`
              );

              // Send email with goal completion details
              const response = await fetch("/api/send-goal-completion", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  recipientEmail: memberEmail,
                  groupName,
                  goalTitle,
                  userName,
                  goalType,
                  achievement: achievementValue,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Goal completion email failed:", errorData);
              } else {
                console.log(
                  `Successfully sent goal completion notification to ${memberEmail}`
                );
              }
            }
          }
        } catch (emailError) {
          console.error("Error sending goal completion email:", emailError);
        }
      }
    } catch (error) {
      console.error("Error notifying members about goal completion:", error);
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

      // Get the user's current weight to use as their individual starting weight
      let userCurrentWeight = null;
      try {
        const userDoc = await window.getDoc(
          window.doc(db, "users", currentUser.uid)
        );
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userCurrentWeight = userData.current_weight || userData.weight;

          // If no weight found, show an error
          if (!userCurrentWeight) {
            showMessage(
              "Cannot join this goal without a current weight in your profile. Please update your profile first.",
              true
            );
            return;
          }
        } else {
          showMessage(
            "Cannot find your user profile. Please update your profile with your current weight first.",
            true
          );
          return;
        }
      } catch (userError) {
        console.error("Error fetching user weight:", userError);
        showMessage(
          "Error accessing your current weight. Please try again or update your profile.",
          true
        );
        return;
      }

      // Add user to participants
      const updatedParticipants = [
        ...(goalData.participants || []),
        currentUser.uid,
      ];

      // Create or update the participant_weights object to store individual starting weights
      const participantWeights = goalData.participant_weights || {};
      participantWeights[currentUser.uid] = parseFloat(userCurrentWeight);

      // Update the goal document with both participants and their weights
      await window.updateDoc(goalDoc.ref, {
        participants: updatedParticipants,
        participant_weights: participantWeights,
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

  // Remove a goal
  async function removeGoal(goalId) {
    if (!currentGroup || !goalId) {
      showMessage("Error: Missing group or goal information.", true);
      return;
    }
    if (
      !confirm(
        "Are you sure you want to remove this goal? This cannot be undone."
      )
    ) {
      return;
    }
    try {
      const db = window.db;
      const goalRef = window.doc(
        db,
        "groups",
        currentGroup.id,
        "goals",
        goalId
      );
      await window.deleteDoc(goalRef);
      showMessage("Goal removed successfully!");
      loadGroupGoals(currentGroup.id);
    } catch (error) {
      console.error("Error removing goal:", error);
      showMessage("Error removing goal: " + error.message, true);
    }
  }

  // Display a celebration animation when a goal is completed
  function showCompletionCelebration() {
    // Create confetti container
    const confettiContainer = document.createElement("div");
    confettiContainer.className = "confetti-container";
    document.body.appendChild(confettiContainer);

    // Generate confetti pieces
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.left = Math.random() * 100 + "vw";
      confetti.style.animationDelay = Math.random() * 3 + "s";
      confetti.style.backgroundColor = getRandomConfettiColor();
      confettiContainer.appendChild(confetti);
    }

    // Remove the confetti after animation completes
    setTimeout(() => {
      if (confettiContainer && confettiContainer.parentNode) {
        confettiContainer.parentNode.removeChild(confettiContainer);
      }
    }, 6000);
  }

  // Get a random color for confetti
  function getRandomConfettiColor() {
    const colors = [
      "#34c759", // Green
      "#007aff", // Blue
      "#ff9500", // Orange
      "#ff2d55", // Pink
      "#5856d6", // Purple
      "#ffcc00", // Yellow
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
});
