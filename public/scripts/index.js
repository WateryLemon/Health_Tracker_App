// import Chart from 'chart.js/auto';

// Firebase config (copy it from your HTML)
const firebaseConfig = {
  apiKey: "AIzaSyCQiV6-wvqLWa9NHatHsu9AE3zcb4FqmOI",
  authDomain: "health-tracker-fa572.firebaseapp.com",
  projectId: "health-tracker-fa572",
  storageBucket: "health-tracker-fa572.firebasestorage.app",
  messagingSenderId: "277390438554",
  appId: "1:277390438554:web:8ce3ec3a1ef13b20aaef23",
  measurementId: "G-SRHMFGLNN2",
};

// Initialize Firebase
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

function goalLogic() {
  const currentCalories = 1500; // Replace with dynamic value
  const dailyGoal = 2000; // Replace with dynamic value
  const burntCalories = 100; // Replace with dynamic value
  const remainingCalories = dailyGoal - (currentCalories - burntCalories);
  const currentTotalCalories = currentCalories - burntCalories;

  const messageElement = document.getElementById("goalMessage");
  const circle = document.querySelector("#circularProgress");
  const burntCircle = document.querySelector(".burnt-circle");

  // Update circular progress bar based on current calorie intake and burn
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

  // Hide burnt calorie circle if = 0
  if (burntCalories === 0) {
    burntCircle.style.display = "none";
  } else {
    burntCircle.style.display = "block";
  }

  // Update SVG text
  document.getElementById(
    "currentCaloriesText"
  ).textContent = `${currentTotalCalories} kcal`;
  document.getElementById(
    "dailyGoalText"
  ).textContent = `${dailyGoal} kcal goal`;

  // Update goal message (calander)
  if (remainingCalories > 0) {
    messageElement.textContent = `You have ${remainingCalories} kcal left till your daily goal.`;
  } else {
    messageElement.textContent = "Congrats on reaching your daily goal!";
  }
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

  // Create day elements for the calendar, before and after the today element
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

  // Create date elements for the previous and next days
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


function weightGraphLogic() {
  const ctx = document.getElementById("weightChart").getContext("2d");
  
  
  // Replace with dynamic data
  const labels = ["27th", "28th", "29th", "30th", "1st", "2nd", "3rd"];
  const weightData = [70, 69.5, 69.5, 69.1, 68.8, 68.9, 68.8];

  // Create the line chart
  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Weight (kg)",
          data: weightData,
          borderColor: "#7030A1", // Line color
          borderWidth: 2,
          tension: 0.4, // Smoothness
          pointBackgroundColor: "#7030A1", // Point color
          pointRadius: 2, //  Size of points
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Weeks",
          },
          grid: {
            color: "rgba(243, 207, 238, 1)",
          },
        },
        y: {
          title: {
            display: true,
            text: "Weight (kg)",
          },
          grid: {
            color: "rgba(243, 207, 238, 1)",
          },
          beginAtZero: false,
        },
      },
    },
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

  if (formMenu.style.display === "block") {
    // Close the menu
    formMenu.style.display = "none";
    addButton.style.backgroundColor = "#7030A1";
    icon.className = "fas fa-plus";
    formContainer.innerHTML = "";
  } else {
    // Open the menu
    formMenu.style.display = "block";
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

    // Reattach event listeners for the buttons in the menu form
    const logButtons = formContainer.querySelectorAll(".log-button");
    const templateMap = {
      foodButton: "foodForm",
      exerciseButton: "exerciseForm",
      waterButton: "waterForm",
      weightButton: "weightForm",
    };

    // Handles click events for each button
    logButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const formId = templateMap[this.id];
        const formTemplate = document.getElementById(formId);

        // Load the corresponding form template
        if (formTemplate) {
          const clone = formTemplate.content.cloneNode(true);
          formContainer.innerHTML = "";
          formContainer.appendChild(clone);
        }
      });
    });
  }
}

// Event listener for the exercise checkbox
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

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("formMenu");
  menu.style.display = "none";

  auth.onAuthStateChanged((user) => {
    if (user) {
      loadUserData(user);  // 🔁 pass the user object to loadUserData()
      goalLogic();
      calendearLogic();
      weightGraphLogic();
    } else {
      window.location.href = "/sign-in.html"; // not signed in
    }
  });
});