// ===========================
// Firebase Configuration & Initialization
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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
window.auth = auth;
window.db = db;

// ===========================
// User Data Loading & Display
// ===========================

async function loadUserData(user) {
  try {
    const userDoc = await db.collection("users").doc(user.uid).get();
    const weightSnapshot = await db.collection("users").doc(user.uid).collection("weight").orderBy("timestamp", "desc").limit(1).get();
    let latestWeight = null;
    if (!weightSnapshot.empty) {
      latestWeight = weightSnapshot.docs[0].data().weight;
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

function displayWeight(startWeight, currentWeight, unitPreference) {
  const weightChangeKg = Number(startWeight) - Number(currentWeight);
  const getChangeSign = (change) => (change === 0 ? "" : change > 0 ? "-" : "+");
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

function updateGreeting(name = "there") {
  const greetingElement = document.getElementById("greeting");
  const currentHour = new Date().getHours();
  let greeting = "Good Evening";
  if (currentHour < 12) greeting = "Good Morning";
  else if (currentHour < 18) greeting = "Good Afternoon";
  greetingElement.textContent = `${greeting}, ${name}!`;
}

// ===========================
// Calendar Widget Logic
// ===========================

function calendearLogic() {
  const calendarWidget = document.getElementById("calenderWidget");
  const todayEl = document.getElementById("today");
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDate = new Date();

  async function fetchDayCalories(userId, date) {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 1);
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
      if (!isNaN(cals) && !isNaN(servings)) consumed += cals * servings;
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
      if (!isNaN(cals)) burnt += cals;
    });
    return { consumed, burnt };
  }

  async function createDayElement(offset) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() + offset);
    const li = document.createElement("li");
    li.classList.add("day");
    li.innerHTML = `
      <span class="day-number">${date.getDate()}</span>
      <span class="calorie-row"><i class="fas fa-hotdog"></i><span>: </span><span class="calories-eaten"></span></span>
      <span class="calorie-row"><i class='fas fa-burn'></i><span>: </span><span class="calories-burnt"></span></span>
      <span class="weekday">${weekdays[date.getDay()]}</span>
    `;
    if (offset <= 0) {
      const user = firebase.auth().currentUser;
      if (user) {
        const { consumed, burnt } = await fetchDayCalories(user.uid, date);
        li.querySelector(".calories-eaten").textContent = consumed;
        li.querySelector(".calories-burnt").textContent = burnt;
      } else {
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
      todayEl.querySelector(".weekday").textContent = weekdays[currentDate.getDay()];
    })();
  }
}

// ===========================
// Weight Graph Logic with Time Scale
// ===========================

let currentWeightScale = "days";

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

function getLastNWeeks(n) {
  const weeks = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - today.getDay());
  for (let i = n - 1; i >= 0; i--) {
    const weekStart = new Date(lastSunday);
    weekStart.setDate(lastSunday.getDate() - i * 7);
    weeks.push(new Date(weekStart));
  }
  return weeks;
}

function getLastNMonths(n) {
  const months = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(d);
  }
  return months;
}

async function weightGraphLogic(userId, scale = "days") {
  try {
    const snapshot = await db.collection("users").doc(userId).collection("weight").orderBy("timestamp", "asc").get();
    const weightLogs = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const weight = parseFloat(data.weight);
      const date = new Date(data.timestamp);
      if (!isNaN(weight) && !isNaN(date)) weightLogs.push({ date, weight });
    });

    let labels = [], weights = [];
    if (scale === "days") {
      const days = getLastNDates(7);
      labels = days.map(d => d.getDate());
      weights = days.map(day => {
        const log = weightLogs.filter(l => l.date.toDateString() === day.toDateString()).sort((a, b) => b.date - a.date)[0];
        return log ? log.weight : null;
      });
    } else if (scale === "weeks") {
      const weeks = getLastNWeeks(7);
      labels = weeks.map(weekStart => `${weekStart.getDate()} ${weekStart.toLocaleString("en-GB", { month: "short" })}`);
      weights = weeks.map(weekStart => {
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
        const log = weightLogs.filter(l => l.date >= weekStart && l.date <= weekEnd).sort((a, b) => b.date - a.date)[0];
        return log ? log.weight : null;
      });
    } else if (scale === "months") {
      const months = getLastNMonths(7);
      const today = new Date();
      const targetDay = today.getDate();
      labels = months.map(m => m.toLocaleString("en-GB", { month: "short" }));
      weights = months.map(monthStart => {
        const year = monthStart.getFullYear();
        const month = monthStart.getMonth();
        let day = targetDay;
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        if (day > lastDayOfMonth) day = lastDayOfMonth;
        const targetDate = new Date(year, month, day);
        const log = weightLogs.filter(l =>
          l.date.getFullYear() === year &&
          l.date.getMonth() === month &&
          l.date.getDate() === day
        ).sort((a, b) => b.date - a.date)[0];
        if (!log) {
          const beforeLog = weightLogs.filter(l =>
            l.date.getFullYear() === year &&
            l.date.getMonth() === month &&
            l.date.getDate() < day
          ).sort((a, b) => b.date - a.date)[0];
          return beforeLog ? beforeLog.weight : null;
        }
        return log.weight;
      });
    }

    const ctx = document.getElementById("weightChart").getContext("2d");
    if (window.weightChartInstance) window.weightChartInstance.destroy();

    if (weights.every(w => w === null)) {
      labels = ["No Data"];
      weights = [null];
    }

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
        plugins: { legend: { display: false } },
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

function fetchDailyCalories(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.toISOString();
  return db.collection("users").doc(userId).collection("food").where("timestamp", ">=", startOfToday).get().then(snapshot => {
    let total = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      const cals = parseFloat(data.caloriesConsumed);
      const servings = parseFloat(data.servings);
      if (!isNaN(cals) && !isNaN(servings)) total += cals * servings;
    });
    return total;
  });
}

function fetchDailyBurntCalories(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.toISOString();
  return db.collection("users").doc(userId).collection("exercise").where("timestamp", ">=", startOfToday).get().then(snapshot => {
    let total = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      const cals = parseFloat(data.caloriesBurned);
      if (!isNaN(cals)) total += cals;
    });
    return total;
  });
}

function updateDailyWaterIntake(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.toISOString();
  db.collection("users").doc(userId).collection("water").where("timestamp", ">=", startOfToday).get().then((querySnapshot) => {
    let total = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const amount = parseInt(data.water, 10);
      if (!isNaN(amount)) total += amount;
    });
    document.getElementById("currentIntake").textContent = total;
  }).catch((error) => {
    console.error("Failed to fetch water logs:", error);
  });
}

function goalLogic(userId) {
  const dailyGoal = 2000;
  Promise.all([
    fetchDailyCalories(userId),
    fetchDailyBurntCalories(userId)
  ]).then(([currentCalories, burntCalories]) => {
    const remainingCalories = dailyGoal - (currentCalories - burntCalories);
    const currentTotalCalories = currentCalories - burntCalories;
    const messageElement = document.getElementById("goalMessage");
    const circle = document.querySelector("#circularProgress");
    const burntCircle = document.querySelector(".burnt-circle");
    const progressPercent = Math.min((currentCalories / dailyGoal) * 100, 100).toFixed(1);
    const progressPercentBurnt = Math.min((burntCalories / dailyGoal) * 100, 100).toFixed(1);
    circle.style.setProperty("--progress", progressPercent);
    circle.style.setProperty("--progress-burnt", progressPercentBurnt);
    burntCircle.style.display = burntCalories === 0 ? "none" : "block";
    document.getElementById("currentCaloriesText").textContent = `${currentTotalCalories} kcal`;
    document.getElementById("dailyGoalText").textContent = `${dailyGoal} kcal goal`;
    messageElement.textContent = remainingCalories > 0
      ? `You have ${remainingCalories} kcal left till your daily goal.`
      : "Congrats on reaching your daily goal!";
  }).catch(error => {
    console.error("Error calculating daily calorie data:", error);
  });
}

// ===========================
// Add Menu & Form Logic
// ===========================

function closeAddMenu() {
  document.getElementById("formMenu").style.display = "none";
}

function addMenuLogic() {
  const addButton = document.getElementById("addButton");
  const formMenu = document.getElementById("formMenu");
  const formContainer = document.querySelector(".form-container");
  const icon = addButton.querySelector("i");
  if (formMenu.classList.contains("show")) {
    formMenu.classList.remove("show");
    setTimeout(() => { formMenu.style.display = "none"; }, 300);
    addButton.style.backgroundColor = "#7030A1";
    icon.className = "fas fa-plus";
    formContainer.innerHTML = "";
  } else {
    formMenu.style.display = "block";
    setTimeout(() => { formMenu.classList.add("show"); }, 10);
    addButton.style.backgroundColor = "#FF2431";
    icon.className = "fa-solid fa-xmark";
    loadMenuForm();
  }
}

function loadMenuForm() {
  const formContainer = document.querySelector(".form-container");
  const menuFormTemplate = document.getElementById("menuForm");
  if (menuFormTemplate) {
    const clone = menuFormTemplate.content.cloneNode(true);
    formContainer.innerHTML = "";
    formContainer.appendChild(clone);
    setTimeout(() => { formContainer.classList.add("show"); }, 10);

    const logButtons = formContainer.querySelectorAll(".log-button");
    const templateMap = {
      foodButton: "foodForm",
      exerciseButton: "exerciseForm",
      waterButton: "waterForm",
      weightButton: "weightForm",
    };

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
              const submitButton = formContainer.querySelector("#submitButton");

              // --- Food Form Special Logic ---
              if (formId === "foodForm") {
                const foodForm = formContainer.querySelector("#foodForm");
                const searchInput = foodForm.querySelector(".search-bar");
                autocomplete(searchInput, Object.keys(FOOD_KCAL_PER_SERVING));
                searchInput.addEventListener("change", function () {
                  const selected = searchInput.value;
                  if (FOOD_KCAL_PER_SERVING[selected]) {

                    const mealInput = foodForm.querySelector("#meal-input");
                    const mealLabel = foodForm.querySelector("label[for='meal-input']");
                    if (mealInput) {
                      mealInput.style.display = "none";
                      mealInput.value = selected;
                    }
                    if (mealLabel) mealLabel.style.display = "none";

                    const calorieInput = foodForm.querySelector("#calorie-input");
                    if (calorieInput) {
                      calorieInput.placeholder = "Calculating...";
                      calorieInput.value = "";
                    }
                    // Calculate calories when servings input changes
                    const servingsInput = foodForm.querySelector("#serving-input");
                    if (servingsInput && calorieInput) {
                      servingsInput.addEventListener("input", function () {
                        const servings = parseFloat(this.value);
                        if (!isNaN(servings) && servings > 0) {
                          const kcal = Math.round(FOOD_KCAL_PER_SERVING[selected] * servings);
                          calorieInput.value = kcal;
                        } else {
                          calorieInput.value = "";
                        }
                      });
                    }
                  }
                });
              }

              // --- Exercise Form Special Logic ---
              if (formId === "exerciseForm") {
                const exerciseForm = formContainer.querySelector("#exerciseForm");
                const searchInput = exerciseForm.querySelector(".search-bar");
                autocomplete(searchInput, Object.keys(EXERCISE_KCAL_PER_KG));
                searchInput.addEventListener("change", async function () {
                  const selected = searchInput.value;
                  if (EXERCISE_KCAL_PER_KG[selected]) {
                    exerciseForm.querySelectorAll('.injected-exercise-field').forEach(el => el.remove());
                    [
                      exerciseForm.querySelector("label[for='exercise-input']"),
                      exerciseForm.querySelector("#exercise-input"),
                      exerciseForm.querySelector("label[for='calorie-input']"),
                      exerciseForm.querySelector("#burnt-input")
                    ].forEach(el => { if (el) el.remove(); });

                    // Inject new duration/calories fields
                    const searchWrapper = exerciseForm.querySelector(".search-wrapper");
                    if (searchWrapper) {
                      const timeLabel = document.createElement("label");
                      timeLabel.setAttribute("for", "time-input");
                      timeLabel.className = "number-input-label injected-exercise-field";
                      timeLabel.textContent = "Duration of Exercise:";
                      const timeInput = document.createElement("input");
                      timeInput.type = "number";
                      timeInput.className = "number-input injected-exercise-field";
                      timeInput.id = "time-input";
                      timeInput.name = "time";
                      timeInput.placeholder = "Time (hr)";
                      timeInput.required = true;
                      const calLabel = document.createElement("label");
                      calLabel.setAttribute("for", "calorie-input");
                      calLabel.className = "number-input-label injected-exercise-field";
                      calLabel.textContent = "Calories burnt (kcal):";
                      const calInput = document.createElement("input");
                      calInput.type = "number";
                      calInput.className = "number-input injected-exercise-field";
                      calInput.id = "burnt-input";
                      calInput.name = "caloriesBurned";
                      calInput.placeholder = "Calculating...";
                      calInput.required = true;
                      searchWrapper.insertAdjacentElement("afterend", timeLabel);
                      timeLabel.insertAdjacentElement("afterend", timeInput);
                      timeInput.insertAdjacentElement("afterend", calLabel);
                      calLabel.insertAdjacentElement("afterend", calInput);

                      timeInput.addEventListener("input", async function () {
                        const hours = parseFloat(this.value);
                        if (!isNaN(hours) && hours > 0) {
                          const user = firebase.auth().currentUser;
                          if (!user) return;
                          const userDoc = await db.collection("users").doc(user.uid).get();
                          const weight = parseFloat(userDoc.data().current_weight);
                          if (!isNaN(weight)) {
                            const kcal = Math.round(EXERCISE_KCAL_PER_KG[selected] * weight * hours);
                            calInput.value = kcal;
                          }
                        } else {
                          calInput.value = "";
                        }
                      });
                    }
                    // Store the selected exercise name in a hidden input for submission
                    let hiddenName = exerciseForm.querySelector("input[name='exerciseName']");
                    if (!hiddenName) {
                      hiddenName = document.createElement("input");
                      hiddenName.type = "hidden";
                      hiddenName.name = "exerciseName";
                      exerciseForm.appendChild(hiddenName);
                    }
                    hiddenName.value = selected;
                  }
                });
              }

              // --- Form Submission Logic ---
              if (submitButton) {
                formElement.addEventListener("submit", function (event) {
                  event.preventDefault();
                  const formData = new FormData(formElement);
                  const data = Object.fromEntries(formData.entries());
                  data.timestamp = new Date().toISOString();
                  const formType = formId.replace("Form", "");
                  const userId = firebase.auth().currentUser.uid;

                  if (formType === "food") {
                    const mealName = data.meal?.trim();
                    if (!mealName) {
                      alert("Meal name is required.");
                      return;
                    }
                    firebase.firestore().collection("users").doc(userId).collection("food").doc(mealName).set(data)
                      .then(() => { alert(`${formType} entry saved!`); })
                      .catch((error) => {
                        console.error("Error saving data:", error);
                        alert("Failed to save. Try again.");
                      });
                  } else if (formType === 'weight') {
                    firebase.firestore().collection("users").doc(userId).collection(formType).add(data)
                      .then(() => firebase.firestore().collection("users").doc(userId).update({ current_weight: data.weight }))
                      .then(() => { alert(`${formType} entry saved!`); })
                      .catch((error) => {
                        console.error("Error saving data:", error);
                        alert("Failed to save. Try again.");
                      });
                  } else {
                    firebase.firestore().collection("users").doc(userId).collection(formType).add(data)
                      .then(() => { alert(`${formType} entry saved!`); })
                      .catch((error) => {
                        console.error("Error saving data:", error);
                        alert("Failed to save. Try again.");
                      });
                  }
                });
              }
            }, 10);
          }, 300);
        }
      });
    });
  }
}

// ===========================
// Leaderboard Logic
// ===========================

async function populateLeaderboard(sortBy = "burnt") {
  try {
    const usersSnapshot = await db.collection("users").get();
    const leaderboardData = [];
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const name = userData.username || "Unknown";
      const exerciseSnapshot = await db.collection("users").doc(userId).collection("exercise").get();
      let totalBurnt = 0;
      exerciseSnapshot.forEach((doc) => {
        const data = doc.data();
        const burnt = parseFloat(data.caloriesBurned);
        if (!isNaN(burnt)) totalBurnt += burnt;
      });
      leaderboardData.push({ name, caloriesBurned: totalBurnt });
    }
    leaderboardData.sort((a, b) => b.caloriesBurned - a.caloriesBurned);
    const top10 = leaderboardData.slice(0, 10);
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
      thirdCell.textContent = sortBy === "weight"
        ? (entry.weightChange != null ? `${entry.weightChange.toFixed(1)} kg` : "N/A")
        : `${Math.round(entry.caloriesBurned)} kcal`;
      row.appendChild(rankCell);
      row.appendChild(nameCell);
      row.appendChild(thirdCell);
      tbody.appendChild(row);
    });
    document.querySelector("#leaderboardWidget th:nth-child(3)").textContent =
      sortBy === "weight" ? "Weight Change" : "Calories Burnt";
  } catch (error) {
    console.error("Error populating leaderboard:", error);
  }
}

// ===========================
// App Initialization
// ===========================

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("formMenu");
  menu.style.display = "none";
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadUserData(user);
      goalLogic(user.uid);
      calendearLogic();
      weightGraphLogic(user.uid);
      updateDailyWaterIntake(user.uid);
      populateLeaderboard("burnt");
      document.querySelectorAll("#dropdownContentLeaderboard a").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const sortBy = item.getAttribute("data-sort");
          populateLeaderboard(sortBy);
          document.getElementById("dropbtnLeaderboard").textContent = `Sort by: ${item.textContent}`;
        });
      });
    } else {
      window.location.href = "/sign-in.html";
    }
  });
});

// ===========================
// Time Scale Dropdown Handler
// ===========================

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".dropdown-content a").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      let scale = "days";
      if (item.textContent.toLowerCase().includes("week")) scale = "weeks";
      if (item.textContent.toLowerCase().includes("month")) scale = "months";
      currentWeightScale = scale;
      const user = firebase.auth().currentUser;
      if (user) weightGraphLogic(user.uid, scale);
    });
  });
});

document.addEventListener("click", function (e) {
  if (
    e.target.id === "submitButton" ||
    (e.target.closest && e.target.closest("#submitButton"))
  ) {
    setTimeout(() => { window.location.reload(); }, 500);
  }
});

// ===========================
// Exercise kcal/kg/hr Data
// ===========================
const EXERCISE_KCAL_PER_KG = {
  "Cycling, leisure": 0.823,
  "Cycling, racing": 3.295,
  "Calisthenics": 0.721,
  "Weight lifting": 0.617,
  "Stair machine": 1.133,
  "Rowing machine, light": 1.853,
  "Rowing machine, moderate": 0.721,
  "Rowing machine, vigorous": 1.441,
  "Ski machine": 2.471,
  "Aerobics, general": 1.751,
  "Running, general": 1.853
};

// ===========================
// Food kcal/serving Data
// ===========================
const FOOD_KCAL_PER_SERVING = {
  "Apple": 95,
  "Banana": 105,
  "Orange": 62,
  "Grapes (1 cup)": 104,
  "Strawberries (1 cup)": 53,
  "Broccoli": 55,
  "Carrots": 52,
  "Spinach (raw)": 7,
  "Sweet potato (1 medium, baked)": 103,
  "Avocado (1/2)": 120,
  "Chicken breast (100g, cooked)": 165,
  "Salmon (100g, cooked)": 208,
  "Egg (1 large)": 70,
  "Tofu (100g)": 76,
  "Black beans (1/2 cup, cooked)": 114,
  "White rice (1 cup, cooked)": 205,
  "Brown rice (1 cup, cooked)": 216,
  "Quinoa (1 cup, cooked)": 222,
  "Whole wheat bread (1 slice)": 69,
  "Oatmeal (1/2 cup dry)": 150,
  "Milk (1 cup, whole)": 149,
  "Greek yogurt (100g, plain)": 59,
  "Cheddar cheese (1 oz)": 113,
  "Almond milk (1 cup, unsweetened)": 30,
  "Dark chocolate (1 oz)": 170,
  "Potato chips (1 oz)": 152,
  "Peanut butter (2 tbsp)": 188,
  "Granola bar (1 bar)": 100,
  "Ice cream (1/2 cup)": 137,
  "Coffee (black, 8 oz)": 2,
  "Orange juice (1 cup)": 112,
  "Soda (12 oz can)": 150,
  "Beer (12 oz)": 153,
  "Red wine (5 oz)": 125
};

// ===========================
// Autocomplete Functionality
// ===========================

function autocomplete(inp, arr) {
  var currentFocus;
  inp.addEventListener("input", function(e) {
    var a, b, i, val = this.value;
    closeAllLists();
    if (!val) return false;
    currentFocus = -1;
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    this.parentNode.appendChild(a);
    for (i = 0; i < arr.length; i++) {
      if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
        b = document.createElement("DIV");
        b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
        b.innerHTML += arr[i].substr(val.length);
        b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
        b.addEventListener("click", function(e) {
          inp.value = this.getElementsByTagName("input")[0].value;
          closeAllLists();
          inp.dispatchEvent(new Event("change"));
        });
        a.appendChild(b);
      }
    }
  });
  inp.addEventListener("keydown", function(e) {
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      currentFocus++;
      addActive(x);
    } else if (e.keyCode == 38) {
      currentFocus--;
      addActive(x);
    } else if (e.keyCode == 13) {
      e.preventDefault();
      if (currentFocus > -1) {
        if (x) x[currentFocus].click();
      }
    }
  });
  function addActive(x) {
    if (!x) return false;
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}