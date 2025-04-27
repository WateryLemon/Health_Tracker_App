// import Chart from 'chart.js/auto';

function updateGreeting() {
  const greetingElement = document.getElementById("greeting");
  const currentHour = new Date().getHours();

  // Determine the appropriate greeting based on the current Time
  if (currentHour < 12) {
    greetingElement.textContent = "Good Morning!";
  } else if (currentHour < 18) {
    greetingElement.textContent = "Good Afternoon!";
  } else {
    greetingElement.textContent = "Good Evening!";
  }
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

          // Add a back button to return to the menu form
          const backButton = document.createElement("button");
          backButton.textContent = "Back";
          backButton.style.marginTop = "10px";
          backButton.addEventListener("click", function () {
            loadMenuForm();
          });
          formContainer.appendChild(backButton);
        }
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
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
});
