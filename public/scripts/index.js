// ===========================
// Firebase Configuration & Initialisation
// ===========================
const firebaseConfig = {
  apiKey: "AIzaSyCQiV6-wvqLWa9NHatHsu9AE3zcb4FqmOI",
  authDomain: "health-tracker-fa572.firebaseapp.com",
  projectId: "health-tracker-fa572",
  storageBucket: "health-tracker-fa572.firebasestorage.app",
  messagingSenderId: "277390438554",
  appId: "1:277390438554:web:8ce3ec3a1ef13b20aaef23",
  measurementId: "G-SRHMFGLNN2",
};

// Initialise Firebase
firebase.initializeApp(firebaseConfig);

// Make Firebase Authentication and Firestore globally accessible
const auth = firebase.auth();
const db = firebase.firestore();
window.auth = auth;
window.db = db;

// ===========================
// User Data Loading & Display
// ===========================

// Loads user profile and weight data from Firestore
async function loadUserData(user) {
  try {
    const userDoc = await db.collection("users").doc(user.uid).get();
    // Get the most recent weight from the user's weight collection
    const weightSnapshot = await db.collection("users").doc(user.uid).collection("weight").orderBy("timestamp", "desc").limit(1).get();
    
    let latestWeight = null;
    if (!weightSnapshot.empty) {
      const weightData = weightSnapshot.docs[0].data();
      latestWeight = weightData.weight;
    }

    if (userDoc.exists) {
      const data = userDoc.data();
      const name = data?.forename || data?.username || "there";
      const startWeight = data?.current_weight;
      const unitPreference = data?.units;
      displayWeight(startWeight, latestWeight, unitPreference);
      updateGreeting(name);
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    alert("Error loading profile data");
  }
}

// Returns the weight change with the appropriate sign
function formatSignedChange(startWeight, currentWeight) {
  if (currentWeight == null || startWeight == null) {
    return "N/A";
  }
  const weightChange = startWeight - currentWeight;
  if (weightChange === 0) return "0";
  const sign = weightChange > 0 ? "-" : "+";
  return `${sign}${Math.abs(weightChange)}`;
}

// Displays weight and changes in appropriate unit (kg or stones/lbs) depending on the user selection
function displayWeight(startWeight, currentWeight, unitPreference) {
  const weightChangeKg = Number(startWeight) - Number(currentWeight);

  const getChangeSign = (change) => {
    if (change === 0) return "";
    return change > 0 ? "-" : "+";
  };

  const formatStones = (kg) => {
    if (isNaN(kg)) return "N/A";
    const pounds = kg * 2.20462;
    const stones = Math.floor(pounds / 14);
    const remainingPounds = Math.round(pounds % 14);
    return `${stones}st ${remainingPounds}lb`;
  };

  if (unitPreference === "Imperial") {
    const sign = getChangeSign(weightChangeKg);
    const absChange = Math.abs(weightChangeKg);

    document.getElementById("currentWeight").innerText = formatStones(currentWeight);
    document.getElementById("startingWeight").innerText = formatStones(startWeight);
    document.getElementById("weightChange").innerText =
      absChange === 0 ? "0" : `${sign}${formatStones(absChange)}`;
  } else {
    const sign = getChangeSign(weightChangeKg);
    const absChange = Math.abs(weightChangeKg);

    document.getElementById("currentWeight").innerText = `${currentWeight}kg`;
    document.getElementById("startingWeight").innerText = `${startWeight}kg`;
    document.getElementById("weightChange").innerText =
      absChange === 0 ? "0kg" : `${sign}${absChange}kg`;
  }
}

// Updates the greeting message based on time of day and user's name
function updateGreeting(name = "there") {
  const greetingElement = document.getElementById("greeting");
  const currentHour = new Date().getHours();
  let greeting;

  if (currentHour < 12) {
    greeting = "Good Morning";
  } else if (currentHour < 18) {
    greeting = "Good Afternoon";
  } else {
    greeting = "Good Evening";
  }

  greetingElement.textContent = `${greeting}, ${name}!`;
}

// ===========================
// Calendar Widget Logic
// ===========================

function calendearLogic() {
  const calendarWidget = document.getElementById("calenderWidget");
  const todayEl = document.getElementById("today");

  const weekdays = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday",
  ];
  const currentDate = new Date();

  // Helper to format date as yyyy-mm-dd for comparison
  function formatDateKey(date) {
    return date.toISOString().split("T")[0];
  }

  // Fetch calories for a specific day
  async function fetchDayCalories(userId, date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    // Calories Consumed
    const foodSnapshot = await db.collection("users").doc(userId).collection("food")
      .where("timestamp", ">=", start.toISOString())
      .where("timestamp", "<", end.toISOString())
      .get();
    let consumed = 0;
    foodSnapshot.forEach(doc => {
      const data = doc.data();
      const cals = parseFloat(data.caloriesConsumed);
      const servings = parseFloat(data.servings);
      if (!isNaN(cals) && !isNaN(servings)) {
        consumed += cals * servings;
      }
    });

    // Calories Burnt
    const exerciseSnapshot = await db.collection("users").doc(userId).collection("exercise")
      .where("timestamp", ">=", start.toISOString())
      .where("timestamp", "<", end.toISOString())
      .get();
    let burnt = 0;
    exerciseSnapshot.forEach(doc => {
      const data = doc.data();
      const cals = parseFloat(data.caloriesBurned);
      if (!isNaN(cals)) {
        burnt += cals;
      }
    });

    return { consumed, burnt };
  }

  // Generate calendar UI elements for previous/next days around current day
  async function createDayElement(offset) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() + offset);

    const li = document.createElement("li");
    li.classList.add("day");

    li.innerHTML = `
      <span class="day-number">${date.getDate()}</span>
      <span class="calorie-row">
        <i class="fas fa-hotdog"></i>
        <span>: </span>
        <span class="calories-eaten"></span>
      </span>
      <span class="calorie-row">
        <i class='fas fa-burn'></i>
        <span>: </span>
        <span class="calories-burnt"></span>
      </span>
      <span class="weekday">${weekdays[date.getDay()]}</span>
    `;
  
    if (offset <= 0) {
      const user = firebase.auth().currentUser;
      if (user) {
        const { consumed, burnt } = await fetchDayCalories(user.uid, date);
        li.querySelector(".calories-eaten").textContent = consumed;
        li.querySelector(".calories-burnt").textContent = burnt;
      } else {
        // For next 2 days, show 0
        li.querySelector(".calories-eaten").textContent = 0;
        li.querySelector(".calories-burnt").textContent = 0;
      }
    }
    return li;
  }

  const user = firebase.auth().currentUser;
  if (user) {
    (async () => {
      for (let i = -2; i < 0; i++) {
        const dayElement = await createDayElement(i);
        calendarWidget.insertBefore(dayElement, todayEl);
      }
      for (let i = 2; i >= 1; i--) {
          const dayEl = await createDayElement(i, user.uid);
          calendarWidget.insertBefore(dayEl, todayEl.nextSibling);
      }

      todayEl.querySelector(".day-number").textContent = currentDate.getDate();
      todayEl.querySelector(".weekday").textContent =
        weekdays[currentDate.getDay()];
    })();
  }
}
// ===========================
// Weight Graph Logic with Time Scale
// ===========================

let currentWeightScale = "days"; // default

// Helper: Get last N days as Date objects (ending today)
function getLastNDates(n) {
  const dates = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dates.push(d);
  }
  return dates;
}

// Helper: Get last N weeks (ending this week, Sunday-Saturday)
function getLastNWeeks(n) {
  const weeks = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Find last Sunday
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - today.getDay());
  for (let i = n - 1; i >= 0; i--) {
    const weekStart = new Date(lastSunday);
    weekStart.setDate(lastSunday.getDate() - i * 7);
    weeks.push(new Date(weekStart));
  }
  return weeks;
}

// Helper: Get last N months (ending this month)
function getLastNMonths(n) {
  const months = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(d);
  }
  return months;
}

// Main function: Draw weight graph for selected scale
async function weightGraphLogic(userId, scale = "days") {
  try {
    // Fetch all weight logs for the user
    const snapshot = await db.collection("users").doc(userId).collection("weight").orderBy("timestamp", "asc").get();
    const weightLogs = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const weight = parseFloat(data.weight);
      const date = new Date(data.timestamp);
      if (!isNaN(weight) && !isNaN(date)) {
        weightLogs.push({ date, weight });
      }
    });

    let labels = [];
    let weights = [];

    if (scale === "days") {
      // Last 7 days, today last
      const days = getLastNDates(7);
      labels = days.map(d => d.getDate());
      weights = days.map(day => {
        // Find the latest log for this day
        const log = weightLogs
          .filter(l => l.date.toDateString() === day.toDateString())
          .sort((a, b) => b.date - a.date)[0];
        return log ? log.weight : null;
      });
    } else if (scale === "weeks") {
      // Last 7 weeks, today last
      const weeks = getLastNWeeks(7);
      labels = weeks.map(weekStart => {
        // Label as "dd MMM" (start of week)
        return `${weekStart.getDate()} ${weekStart.toLocaleString("en-GB", { month: "short" })}`;
      });
      weights = weeks.map(weekStart => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        // Find the latest log in this week
        const log = weightLogs
          .filter(l => l.date >= weekStart && l.date <= weekEnd)
          .sort((a, b) => b.date - a.date)[0];
        return log ? log.weight : null;
      });
    } else if (scale === "months") {
      // Last 7 months, today last
      const months = getLastNMonths(7);
      const today = new Date();
      const targetDay = today.getDate();
      labels = months.map(m => m.toLocaleString("en-GB", { month: "short" }));
      weights = months.map(monthStart => {
        // Try to find a log for this month on the same day as today
        const year = monthStart.getFullYear();
        const month = monthStart.getMonth();
        let day = targetDay;
        // Handle months with fewer days (e.g. Feb)
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        if (day > lastDayOfMonth) {
          day = lastDayOfMonth;
        }
        const targetDate = new Date(year, month, day);
        // Find the latest log on or before this date in the month
        const log = weightLogs
          .filter(l =>
            l.date.getFullYear() === year &&
            l.date.getMonth() === month &&
            l.date.getDate() === day
          )
          .sort((a, b) => b.date - a.date)[0];
        // If no log for that day, try to find the closest before that day in the month
        if (!log) {
          const beforeLog = weightLogs
            .filter(l =>
              l.date.getFullYear() === year &&
              l.date.getMonth() === month &&
              l.date.getDate() < day
            )
            .sort((a, b) => b.date - a.date)[0];
          return beforeLog ? beforeLog.weight : null;
        }
        return log.weight;
      });
    }

    // Destroy any existing chart instance to prevent overlap
    const ctx = document.getElementById("weightChart").getContext("2d");
    if (window.weightChartInstance) {
      window.weightChartInstance.destroy();
    }

    // If all weights are null, show empty chart with "No Data"
    if (weights.every(w => w === null)) {
      labels = ["No Data"];
      weights = [null];
    }

    // Draw chart
    window.weightChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Weight (kg)",
            data: weights,
            borderColor: "#7030A1",
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: "#7030A1",
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            title: { display: true, text: scale === "months" ? "Month" : scale === "weeks" ? "Week" : "Day" },
            grid: { color: "rgba(243, 207, 238, 1)" }
          },
          y: {
            title: { display: true, text: "Weight (kg)" },
            beginAtZero: false,
            grid: { color: "rgba(243, 207, 238, 1)" }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error loading weight graph:", error);
  }
}

// ===========================
// Calorie & Water Logic
// ===========================

// Fetches total calories consumed today by the user
function fetchDailyCalories(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.toISOString();

  // Query food logs for today and calculate the total
  return db.collection("users").doc(userId).collection("food").where("timestamp", ">=", startOfToday).get().then(snapshot => {
      let total = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        const cals = parseFloat(data.caloriesConsumed);
        const servings = parseFloat(data.servings);
        if (!isNaN(cals) && !isNaN(servings)) {
          total += cals * servings;
        }
      });
      return total;
    });
}

// Fetches total calories burnt today by the user
function fetchDailyBurntCalories(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.toISOString();

  // Query exercise logs for today and calculate total burnt
  return db.collection("users").doc(userId).collection("exercise").where("timestamp", ">=", startOfToday).get().then(snapshot => {
      let total = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        const cals = parseFloat(data.caloriesBurned); 
        if (!isNaN(cals)) {
          total += cals;
        }
      });
      return total;
    });
}

// Updates the water intake display for the current day
function updateDailyWaterIntake(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Midnight
  const startOfToday = today.toISOString();

  // Query water logs and calculate total of all values
  db.collection("users").doc(userId).collection("water").where("timestamp", ">=", startOfToday).get().then((querySnapshot) => {
      let total = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const amount = parseInt(data.water, 10);
        if (!isNaN(amount)) {
          total += amount;
        }
      });

      document.getElementById("currentIntake").textContent = total;
    })
    .catch((error) => {
      console.error("Failed to fetch water logs:", error);
    });
}

// Compares calories consumed and burned against daily goal
function goalLogic(userId) {
  const dailyGoal = 2000;

  // Fetch both intake and burnt calories
  Promise.all([
    fetchDailyCalories(userId),
    fetchDailyBurntCalories(userId)
  ]).then(([currentCalories, burntCalories]) => {
    const remainingCalories = dailyGoal - (currentCalories - burntCalories);
    const currentTotalCalories = currentCalories - burntCalories;

    const messageElement = document.getElementById("goalMessage");
    const circle = document.querySelector("#circularProgress");
    const burntCircle = document.querySelector(".burnt-circle");

    // Calculate visual progress percentages
    const progressPercent = Math.min(
      (currentCalories / dailyGoal) * 100,
      100
    ).toFixed(1);
    const progressPercentBurnt = Math.min(
      (burntCalories / dailyGoal) * 100,
      100
    ).toFixed(1);

    // Apply progress to circular indicator
    circle.style.setProperty("--progress", progressPercent);
    circle.style.setProperty("--progress-burnt", progressPercentBurnt);

    // Show or hide the calorie burnt circle based on data
    if (burntCalories === 0) {
      burntCircle.style.display = "none";
    } else {
      burntCircle.style.display = "block";
    }

    // Update the UI with calorie info
    document.getElementById("currentCaloriesText").textContent = `${currentTotalCalories} kcal`;
    document.getElementById("dailyGoalText").textContent = `${dailyGoal} kcal goal`;

    // Display message depending on goal progress
    if (remainingCalories > 0) {
      messageElement.textContent = `You have ${remainingCalories} kcal left till your daily goal.`;
    } else {
      messageElement.textContent = "Congrats on reaching your daily goal!";
    }
  }).catch(error => {
    console.error("Error calculating daily calorie data:", error);
  });
}

// ===========================
// Add Menu & Form Logic
// ===========================

// Closes the form menu popup
function closeAddMenu() {
  document.getElementById("formMenu").style.display = "none";
}

// Toggles the display of the add entry form menu
function addMenuLogic() {
  const addButton = document.getElementById("addButton");
  const formMenu = document.getElementById("formMenu");
  const formContainer = document.querySelector(".form-container");
  const icon = addButton.querySelector("i");

  if (formMenu.classList.contains("show")) {
    // Close menu with animation
    formMenu.classList.remove("show");
    setTimeout(() => {
      formMenu.style.display = "none"; // Hide after animation
    }, 300);
    addButton.style.backgroundColor = "#7030A1";
    icon.className = "fas fa-plus";
    formContainer.innerHTML = "";
  } else {
    // Open menu with animation
    formMenu.style.display = "block";
    setTimeout(() => {
      formMenu.classList.add("show");
    }, 10); // Delay to trigger animation
    addButton.style.backgroundColor = "#FF2431";
    icon.className = "fa-solid fa-xmark";

    loadMenuForm();
  }
}

// Loads and displays the main form menu layout
function loadMenuForm() {
  const formContainer = document.querySelector(".form-container");
  const menuFormTemplate = document.getElementById("menuForm");

  if (menuFormTemplate) {
    const clone = menuFormTemplate.content.cloneNode(true);
    formContainer.innerHTML = "";
    formContainer.appendChild(clone);

    setTimeout(() => {
      formContainer.classList.add("show");
    }, 10); // Minor delay to trigger transition

    // Reattach event listeners for buttons in menu form after clone
    const logButtons = formContainer.querySelectorAll(".log-button");
    const templateMap = {
      foodButton: "foodForm",
      exerciseButton: "exerciseForm",
      waterButton: "waterForm",
      weightButton: "weightForm",
    };

    // Sets up button-to-form mapping
    logButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const formId = templateMap[this.id];
        const formTemplate = document.getElementById(formId);

        if (formTemplate) {
          const clone = formTemplate.content.cloneNode(true);

          formContainer.classList.remove("show");

          setTimeout(() => {
            formContainer.innerHTML = "";
            formContainer.appendChild(clone);

            setTimeout(() => {
              formContainer.classList.add("show");

              const formElement = formContainer.querySelector("form");
              console.log("Form element found:", formElement);

              // After form is loaded wait for submit
              const submitButton = formContainer.querySelector("#submitButton");
              console.log("Submit button found:", submitButton);

              if (submitButton) {
                // Attach submit event to dynamically loaded form
                formElement.addEventListener("submit", function (event)  {
                  console.log("Submit button event listener attached");
                  event.preventDefault(); // Prevent default form submission

                  // Grab form data
                  const formElement = formContainer.querySelector("form");
                  const formData = new FormData(formElement);
                  const data = Object.fromEntries(formData.entries());
                  data.timestamp = new Date().toISOString();
                  console.log("📝 Data to save:", data);

                  // Determine form type (e.g. food, exercise)
                  const formType = formId.replace("Form", "");
                  const userId = firebase.auth().currentUser.uid;

                  // Save to firebase food collection, using meal name as doc id
                  if (formType === "food") {
                    const mealName = data.meal?.trim();
                    if (!mealName) {
                      alert("Meal name is required.");
                      return;
                    }
                    firebase.firestore().collection("users").doc(userId).collection("food").doc(mealName).set(data)
                      .then(() => {
                        alert(`${formType} entry saved!`);
                      })
                      .catch((error) => {
                        console.error("Error saving data:", error);
                        alert("Failed to save. Try again.");
                      });
                  } else {
                    // If not food then store in the appropriate collection
                    firebase.firestore().collection("users").doc(userId).collection(formType).add(data)
                      .then(() => {
                        alert(`${formType} entry saved!`);
                      })
                      .catch((error) => {
                        console.error("Error saving data:", error);
                        alert("Failed to save. Try again.");
                      });
                  }
                });
              }

            }, 10); // Waits for inner dom to render before querying it

          }, 300); // Matches transition delay
        }
      });
    });
  }
}

// ===========================
// Exercise Form Toggle Logic
// ===========================

// Event listener for exercise checkbox to select type of exercise
document.addEventListener("change", function (e) {
  if (e.target.id === "exerciseCheckbox") {
    const isChecked = e.target.checked;
    document.getElementById("exerciseFormCardio").style.display = isChecked ? "none" : "flex";
    document.getElementById("exerciseFormStrength").style.display = isChecked ? "flex" : "none";
  }
});

// ===========================
// Leaderboard Logic
// ===========================

// Displays leaderboard sorted by the number of calories burnt
async function populateLeaderboard(sortBy = "burnt") {
  try {
    const usersSnapshot = await db.collection("users").get();
    const leaderboardData = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const name = userData.username || "Unknown";

      // Fetch exercise data (calories burnt)
      const exerciseSnapshot = await db.collection("users").doc(userId).collection("exercise").get();

      let totalBurnt = 0;
      exerciseSnapshot.forEach((doc) => {
        const data = doc.data();
        const burnt = parseFloat(data.caloriesBurned);
        if (!isNaN(burnt)) {
          totalBurnt += burnt;
        }
      });

      leaderboardData.push({
        name,
        caloriesBurned: totalBurnt,
      });
    }

    // Sort users by calories burnt (default)
    leaderboardData.sort((a, b) => b.caloriesBurned - a.caloriesBurned);
    
    // Top 10 users
    const top10 = leaderboardData.slice(0, 10);

    // Render the table rows
    const tbody = document.querySelector("#leaderboardWidget tbody");
    tbody.innerHTML = "";

    top10.forEach((entry, index) => {
      const row = document.createElement("tr");

      const rankCell = document.createElement("th");
      rankCell.scope = "row";
      rankCell.textContent = index + 1;

      const nameCell = document.createElement("td");
      nameCell.textContent = entry.name;

      const thirdCell = document.createElement("td");
      thirdCell.textContent =
        sortBy === "weight"
          ? (entry.weightChange != null ? `${entry.weightChange.toFixed(1)} kg` : "N/A")
          : `${Math.round(entry.caloriesBurned)} kcal`;

      row.appendChild(rankCell);
      row.appendChild(nameCell);
      row.appendChild(thirdCell);

      tbody.appendChild(row);
    });

    // Update leaderboard heading
    document.querySelector("#leaderboardWidget th:nth-child(3)").textContent =
      sortBy === "weight" ? "Weight Change" : "Calories Burnt";

  } catch (error) {
    console.error("Error populating leaderboard:", error);
  }
}

// ===========================
// App Initialization
// ===========================

// Initialise app features when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("formMenu");
  menu.style.display = "none";

  // Make sure firebase authenticates
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadUserData(user);  
      goalLogic(user.uid);
      calendearLogic();
      weightGraphLogic(user.uid);
      updateDailyWaterIntake(user.uid);
      populateLeaderboard("burnt");

      // Allows users to sort the leaderboard (currently only by calories burnt)
      document.querySelectorAll("#dropdownContentLeaderboard a").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const sortBy = item.getAttribute("data-sort");
          populateLeaderboard(sortBy);
          document.getElementById("dropbtnLeaderboard").textContent = `Sort by: ${item.textContent}`;
        });
      });
    } else {
      window.location.href = "/sign-in.html"; // Redirect to sign in page if not authenticated
    }
  });
});

// ===========================
// Time Scale Dropdown Handler
// ===========================

document.addEventListener("DOMContentLoaded", () => {
  // Add event listeners for time scale dropdown
  document.querySelectorAll(".dropdown-content a").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      let scale = "days";
      if (item.textContent.toLowerCase().includes("week")) scale = "weeks";
      if (item.textContent.toLowerCase().includes("month")) scale = "months";
      currentWeightScale = scale;
      const user = firebase.auth().currentUser;
      if (user) {
        weightGraphLogic(user.uid, scale);
      }
    });
  });
});

document.addEventListener("click", function (e) {
  if (
    e.target.id === "submitButton" ||
    (e.target.closest && e.target.closest("#submitButton"))
  ) {
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
});

// ===========================
// Exercise Autocomplete Logic
// ===========================

// Initialize exercise autocomplete for search inputs
function initExerciseAutocomplete() {
  // Use the correct selector for your input
  document.querySelectorAll('.search-bar').forEach(input => {
    // Prevent double initialization
    if (input.dataset.autocompleteInitialized) return;
    input.dataset.autocompleteInitialized = "true";
    new autoComplete({
      selector: () => input,
      threshold: 0, // Show all options by default
      data: {
        src: EXERCISE_OPTIONS,
      },
      resultsList: {
        maxResults: undefined // Show all matches
      },
      resultItem: {
        highlight: true
      },
      events: {
        input: {
          selection: (event) => {
            const selection = event.detail.selection.value;
            input.value = selection;
            // Optionally trigger any logic when an exercise is selected
          }
        }
      }
    });
  });
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initExerciseAutocomplete();
});