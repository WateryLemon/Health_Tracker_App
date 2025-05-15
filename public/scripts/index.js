// import Chart from 'chart.js/auto';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCQiV6-wvqLWa9NHatHsu9AE3zcb4FqmOI",
  authDomain: "health-tracker-fa572.firebaseapp.com",
  projectId: "health-tracker-fa572",
  storageBucket: "health-tracker-fa572.firebasestorage.app",
  messagingSenderId: "277390438554",
  appId: "1:277390438554:web:8ce3ec3a1ef13b20aaef23",
  measurementId: "G-SRHMFGLNN2",
};

// Initialise firebase
firebase.initializeApp(firebaseConfig);

// Make auth and db globally accessible
const auth = firebase.auth();
const db = firebase.firestore();

window.auth = auth;
window.db = db;

async function loadUserData(user) {
  try {
    const userDoc = await db.collection("users").doc(user.uid).get();

    if (userDoc.exists) {
      const data = userDoc.data();
      const name = data?.forename || data?.username || "there";
      const currentWeight = data?.weight;
      const startWeight = data?.current_weight;
      const unitPreference = data?.units;
      displayWeight(startWeight, currentWeight, unitPreference)
      updateGreeting(name);
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    alert("Error loading profile data");
  }
}

function formatSignedChange(startWeight, currentWeight) {
  if (currentWeight == null || startWeight == null) {
    return "N/A";
  }

  const weightChange = startWeight - currentWeight;
  if (weightChange === 0) return "0";

  const sign = weightChange > 0 ? "-" : "+";
  return `${sign}${Math.abs(weightChange)}`;
}

function displayWeight(startWeight, currentWeight, unitPreference){

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

function calendearLogic() {
  const calendarWidget = document.getElementById("calenderWidget");
  const todayEl = document.getElementById("today");

  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const currentDate = new Date();

  // Create day elements for calendar before and after today element
  function createDayElement(offset) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() + offset);

    const li = document.createElement("li");
    li.classList.add("day");

    li.innerHTML = `<span class="day-number">${date.getDate()}</span>
            <i class="fas fa-hotdog"></i><span>: </span><span class="calories-eaten"></span>
            <i class='fas fa-burn'></i><span>: </span><span class="calories-burnt"></span>
            <span class="weekday">${weekdays[date.getDay()]}</span>`;
    return li;
  }

  // Create date elements for previous and next days
  for (let i = -2; i < 0; i++) {
    calendarWidget.insertBefore(createDayElement(i), todayEl);
  }
  for (let i = 2; i >= 1; i--) {
    calendarWidget.insertBefore(createDayElement(i), todayEl.nextSibling);
  }

  todayEl.querySelector(".day-number").textContent = currentDate.getDate();
  todayEl.querySelector(".weekday").textContent =
    weekdays[currentDate.getDay()];
}


async function weightGraphLogic(userId) {
  try {
    const snapshot = await db
      .collection("users")
      .doc(userId)
      .collection("weight")
      .orderBy("timestamp", "asc")
      .get();

    const weightLogs = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const weight = parseFloat(data.weight); // handle string
      const date = new Date(data.timestamp);
      if (!isNaN(weight) && !isNaN(date)) {
        weightLogs.push({ date, weight });
      }
    });

    if (weightLogs.length === 0) return;

    const labels = weightLogs.map((log) =>
      log.date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short"
      })
    );

    const weights = weightLogs.map((log) => log.weight);

    const ctx = document.getElementById("weightChart").getContext("2d");

    if (window.weightChartInstance) {
      window.weightChartInstance.destroy();
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
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            title: { display: true, text: "Date" },
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
        if (!isNaN(cals) && !isNaN(servings)) {
          total += cals * servings;
        }
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
        if (!isNaN(cals)) {
          total += cals;
        }
      });
      return total;
    });
}

function updateDailyWaterIntake(userId) {
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Midnight

  const startOfToday = today.toISOString();

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

    const progressPercent = Math.min(
      (currentCalories / dailyGoal) * 100,
      100
    ).toFixed(1);
    const progressPercentBurnt = Math.min(
      (burntCalories / dailyGoal) * 100,
      100
    ).toFixed(1);

    circle.style.setProperty("--progress", progressPercent);
    circle.style.setProperty("--progress-burnt", progressPercentBurnt);

    if (burntCalories === 0) {
      burntCircle.style.display = "none";
    } else {
      burntCircle.style.display = "block";
    }

    document.getElementById("currentCaloriesText").textContent = `${currentTotalCalories} kcal`;
    document.getElementById("dailyGoalText").textContent = `${dailyGoal} kcal goal`;

    if (remainingCalories > 0) {
      messageElement.textContent = `You have ${remainingCalories} kcal left till your daily goal.`;
    } else {
      messageElement.textContent = "Congrats on reaching your daily goal!";
    }
  }).catch(error => {
    console.error("Error calculating daily calorie data:", error);
  });
}

function closeAddMenu() {
  document.getElementById("formMenu").style.display = "none";
}

function addMenuLogic() {
  const addButton = document.getElementById("addButton");
  const formMenu = document.getElementById("formMenu");
  const formContainer = document.querySelector(".form-container");
  const icon = addButton.querySelector("i");

  if (formMenu.classList.contains("show")) {
    // Close menu
    formMenu.classList.remove("show");
    setTimeout(() => {
      formMenu.style.display = "none"; // Hide after animation
    }, 300);
    addButton.style.backgroundColor = "#7030A1";
    icon.className = "fas fa-plus";
    formContainer.innerHTML = "";
  } else {
    // Open menu
    formMenu.style.display = "block";
    setTimeout(() => {
      formMenu.classList.add("show");
    }, 10); // Slight delay to trigger transition
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

    setTimeout(() => {
      formContainer.classList.add("show");
    }, 10); // Slight delay to trigger transition

    // Reattach event listeners for buttons in menu form
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
          console.log("Form element found:", formElement);

          // After form is loaded wait for submit
          const submitButton = formContainer.querySelector("#submitButton");
          console.log("Submit button found:", submitButton);

          if (submitButton) {
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

              // Save to firebase
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

        }, 10); // Wait for inner dom to render before querying it

      }, 300); // Match transition delay
    }
  });
});
  }
}

// Event listener for exercise checkbox
document.addEventListener("change", function (e) {
  if (e.target.id === "exerciseCheckbox") {
    const isChecked = e.target.checked;
    document.getElementById("exerciseFormCardio").style.display = isChecked ? "none" : "flex";
    document.getElementById("exerciseFormStrength").style.display = isChecked ? "flex" : "none";
  }
});

 /*document.addEventListener("DOMContentLoaded", () => {
   // Check authentication state first
   const auth = window.auth;
   auth.onAuthStateChanged((user) => {
     if (user) {
       // User is signed in, initialize the dashboard
       const menu = document.getElementById("formMenu");
       menu.style.display = "none";
       updateGreeting();
       goalLogic();
       calendearLogic();
       weightGraphLogic();
     } else {
       // No user is signed in, redirect to login
       window.location.href = "/sign-in.html";
     }
   });
 });*/

/*document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("formMenu");
  menu.style.display = "none";
  
  loadUserData();
  goalLogic();
  calendearLogic();
  weightGraphLogic();
});*/

async function populateLeaderboard(sortBy = "burnt") {
  try {
    const usersSnapshot = await db.collection("users").get();
    const leaderboardData = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const name = userData.forename || userData.username || "Unknown";

      // Fetch exercise data
      const exerciseSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("exercise")
        .get();

      let totalBurnt = 0;
      exerciseSnapshot.forEach((doc) => {
        const data = doc.data();
        const burnt = parseFloat(data.caloriesBurned);
        if (!isNaN(burnt)) {
          totalBurnt += burnt;
        }
      });

      // Calculate weight change
      const startWeight = parseFloat(userData.current_weight);
      const currentWeight = parseFloat(userData.weight);
      let weightChange = null;

      if (!isNaN(startWeight) && !isNaN(currentWeight)) {
        weightChange = startWeight - currentWeight;
      }

      leaderboardData.push({
        name,
        caloriesBurned: totalBurnt,
        weightChange: weightChange, // in kg
      });
    }

    // Sort
    if (sortBy === "weight") {
      leaderboardData.sort((a, b) => (b.weightChange ?? -Infinity) - (a.weightChange ?? -Infinity));
    } else {
      leaderboardData.sort((a, b) => b.caloriesBurned - a.caloriesBurned);
    }

    // Top 10
    const top10 = leaderboardData.slice(0, 10);

    // Render
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

    // Update headers
    document.querySelector("#leaderboardWidget th:nth-child(3)").textContent =
      sortBy === "weight" ? "Weight Change" : "Calories Burnt";

  } catch (error) {
    console.error("Error populating leaderboard:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("formMenu");
  menu.style.display = "none";

  auth.onAuthStateChanged((user) => {
    if (user) {
      loadUserData(user);  // Pass user object to loadUserData()
      goalLogic(user.uid);
      calendearLogic();
      weightGraphLogic(user.uid);
      updateDailyWaterIntake(user.uid);
      populateLeaderboard("burnt");

    document.querySelectorAll("#dropdownContentLeaderboard a").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const sortBy = item.getAttribute("data-sort"); // "burnt" or "weight"
      populateLeaderboard(sortBy);
      document.getElementById("dropbtnLeaderboard").textContent = `Sort by: ${item.textContent}`;
  });
});
      
    } else {
      window.location.href = "/sign-in.html"; // Not signed in
    }
  });
});