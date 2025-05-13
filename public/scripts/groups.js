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
      });

      // Add active class to clicked modal tab
      button.classList.add("active");
      const tabId = button.getAttribute("data-modal-tab") + "-tab";
      document.getElementById(tabId).classList.add("active");
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

  const shareEmailForm = document.getElementById("share-email-form");
  shareEmailForm.addEventListener("submit", handleShareViaEmail);

  // Copy group code to clipboard
  document.getElementById("copy-code-btn").addEventListener("click", () => {
    const code = document.getElementById("group-share-code").textContent;
    navigator.clipboard
      .writeText(code)
      .then(() => {
        alert("Group code copied to clipboard!");
      })
      .catch((err) => {
        console.error("Could not copy code: ", err);
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
                          <span>${group.type}</span>
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

    document.getElementById("modal-group-name").textContent = group.name;
    document.getElementById("modal-group-description").textContent =
      group.description;
    document.getElementById("group-share-code").textContent = group.code;

    loadGroupMembers(group.id);
    loadGroupGoals(group.id);

    document.getElementById("group-modal").style.display = "block";
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
  }

  // Load group goals
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

      goals.forEach((goal) => {
        const goalItem = document.createElement("div");
        goalItem.className = "goal-item";

        const progressPercentage = calculateGoalProgress(goal);

        goalItem.innerHTML = `
                    <div class="goal-header">
                        <div class="goal-title">${goal.title}</div>
                        <div class="goal-target">${goal.target} ${goal.unit}</div>
                    </div>
                    <div class="goal-progress">
                        <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="goal-details">${goal.description}</div>
                `;

        goalsList.appendChild(goalItem);
      });
    } catch (error) {
      console.error("Error loading group goals:", error);
    }
  }

  // Calculate goal progress (placeholder - in a real app this would be based on user data)
  function calculateGoalProgress(goal) {
    // This is a placeholder - in a real app, you would calculate based on actual data
    return Math.floor(Math.random() * 100);
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
    const groupType = formData.get("group-type");

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
          type: groupType,
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
  }

  // Create a new goal for the current group
  async function handleCreateGoal(event) {
    event.preventDefault();

    if (!currentUser || !currentGroup) {
      alert("Error: Missing user or group information.");
      return;
    }

    const goalTitle = document.getElementById("goal-title").value;
    const goalDescription = document.getElementById("goal-description").value;
    const goalTarget = document.getElementById("goal-target").value;
    const goalUnit = document.getElementById("goal-unit").value;

    try {
      const db = window.db;

      // Add goal to the group
      const goalRef = window.doc(
        window.collection(db, "groups", currentGroup.id, "goals")
      );

      await window.setDoc(goalRef, {
        title: goalTitle,
        description: goalDescription,
        target: goalTarget,
        unit: goalUnit,
        createdBy: currentUser.uid,
        createdAt: window.serverTimestamp(),
        participants: [],
      });

      // Send email notifications to all group members
      await notifyGroupMembers(currentGroup.id, {
        type: "new_goal",
        goalTitle,
        groupName: currentGroup.name,
      });

      showMessage("Goal created successfully!");
      event.target.reset();

      // Refresh goals list
      loadGroupGoals(currentGroup.id);
    } catch (error) {
      console.error("Error creating goal:", error);
      showMessage("Error creating goal: " + error.message, true);
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

  // Generate a random code for group sharing
  function generateGroupCode() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
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
