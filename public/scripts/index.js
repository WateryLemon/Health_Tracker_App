//firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCQiV6-wvqLWa9NHatHsu9AE3zcb4FqmOI",
  authDomain: "health-tracker-fa572.firebaseapp.com",
  projectId: "health-tracker-fa572",
  storageBucket: "health-tracker-fa572.firebasestorage.app",
  messagingSenderId: "277390438554",
  appId: "1:277390438554:web:8ce3ec3a1ef13b20aaef23",
  measurementId: "G-SRHMFGLNN2",
};

//initialise firebase
firebase.initializeApp(firebaseConfig);

//db globally accessible and user auth
const auth = firebase.auth();
const db = firebase.firestore();
window.auth = auth;
window.db = db;

//loads user profile and weight data from Firestore
async function loadUserData(user) {
  try {
    const userDoc = await db.collection("users").doc(user.uid).get();
    //weightsnapshot gets the most resent weight from weight collection under the user collection
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

//returns the weight change with the appropriate sign i.e.
//returns '-' if weight was lost and '+' if weight was gained
function formatSignedChange(startWeight, currentWeight) {
  if (currentWeight == null || startWeight == null) {
    return "N/A";
  }

  const weightChange = startWeight - currentWeight;
  if (weightChange === 0) return "0";

  const sign = weightChange > 0 ? "-" : "+";
  return `${sign}${Math.abs(weightChange)}`;
}

//displays weight and changes in appropriate unit (kg or stones/lbs) depending on user choice
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

//updates the greeting message based on time of day and depending on user's name
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
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday","Saturday",];
  const currentDate = new Date();

//generate calendar UI elements for previous/next days around current day
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

  //creates date elements for previous and next days
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

//fetches and draws weight progress chart for a user
async function weightGraphLogic(userId) {
  try {
    //retrieve all weight logs for the user, ordered by ascending order 
    const snapshot = await db.collection("users").doc(userId).collection("weight").orderBy("timestamp", "asc").get();

    const weightLogs = [];

    //parse each document to extract weight and date, validate, and store
    snapshot.forEach((doc) => {
      const data = doc.data();
      const weight = parseFloat(data.weight); 
      const date = new Date(data.timestamp);
      if (!isNaN(weight) && !isNaN(date)) {
        weightLogs.push({ date, weight });
      }
    });

    const ctx = document.getElementById("weightChart").getContext("2d");

    //destroy any existing chart instance to prevent overlap
    if (window.weightChartInstance) {
      window.weightChartInstance.destroy();
    }

    let labels, weights;

    if (weightLogs.length === 0) {
      // Show an empty chart with a placeholder label and no data
      labels = ["No Data"];
      weights = [null];
    } else {
      //formats dates for chart labels
      labels = weightLogs.map((log) =>
        log.date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short"
        })
      );
      //extracts just the weight values
      weights = weightLogs.map((log) => log.weight);
    }

    //creates a new chart instance
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

//fetches total calories consumed today by the user
function fetchDailyCalories(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.toISOString();

  //querys food logs for today and calculates the total
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

//fetches total calories consumed today by the user
function fetchDailyBurntCalories(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.toISOString();

  //querys exercise logs for today and calculates total burnt
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

//updates the water intake display for the current day
function updateDailyWaterIntake(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); //midnight
  const startOfToday = today.toISOString();

  //querys water logs and calculates total of all values
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

//compares calories consumed and burned against daily goal
function goalLogic(userId) {
  const dailyGoal = 2000;

  //fetches both intake and burnt calories
  Promise.all([
    fetchDailyCalories(userId),
    fetchDailyBurntCalories(userId)
  ]).then(([currentCalories, burntCalories]) => {
    const remainingCalories = dailyGoal - (currentCalories - burntCalories);
    const currentTotalCalories = currentCalories - burntCalories;

    const messageElement = document.getElementById("goalMessage");
    const circle = document.querySelector("#circularProgress");
    const burntCircle = document.querySelector(".burnt-circle");

    //calculates visual progress percentages
    const progressPercent = Math.min(
      (currentCalories / dailyGoal) * 100,
      100
    ).toFixed(1);
    const progressPercentBurnt = Math.min(
      (burntCalories / dailyGoal) * 100,
      100
    ).toFixed(1);

    //applies progress to circular indicator
    circle.style.setProperty("--progress", progressPercent);
    circle.style.setProperty("--progress-burnt", progressPercentBurnt);

    //shows or hides the calorie burnt circle based on data
    if (burntCalories === 0) {
      burntCircle.style.display = "none";
    } else {
      burntCircle.style.display = "block";
    }

    //updates the UI with calorie info
    document.getElementById("currentCaloriesText").textContent = `${currentTotalCalories} kcal`;
    document.getElementById("dailyGoalText").textContent = `${dailyGoal} kcal goal`;


    //displays message depending on goal progress related to calorie goal
    if (remainingCalories > 0) {
      messageElement.textContent = `You have ${remainingCalories} kcal left till your daily goal.`;
    } else {
      messageElement.textContent = "Congrats on reaching your daily goal!";
    }
  }).catch(error => {
    console.error("Error calculating daily calorie data:", error);
  });
}

//closes the form menu popup
function closeAddMenu() {
  document.getElementById("formMenu").style.display = "none";
}

//toggles the display of the add entry form menu
function addMenuLogic() {
  const addButton = document.getElementById("addButton");
  const formMenu = document.getElementById("formMenu");
  const formContainer = document.querySelector(".form-container");
  const icon = addButton.querySelector("i");

  if (formMenu.classList.contains("show")) {
    //close menu with animation
    formMenu.classList.remove("show");
    setTimeout(() => {
      formMenu.style.display = "none"; //hide after animastion
    }, 300);
    addButton.style.backgroundColor = "#7030A1";
    icon.className = "fas fa-plus";
    formContainer.innerHTML = "";
  } else {
    //opens menu with animation
    formMenu.style.display = "block";
    setTimeout(() => {
      formMenu.classList.add("show");
    }, 10); //delay to trigger animation
    addButton.style.backgroundColor = "#FF2431";
    icon.className = "fa-solid fa-xmark";

    loadMenuForm();
  }
}

//loads and displays the main form menu layout
function loadMenuForm() {
  const formContainer = document.querySelector(".form-container");
  const menuFormTemplate = document.getElementById("menuForm");

  if (menuFormTemplate) {
    const clone = menuFormTemplate.content.cloneNode(true);
    formContainer.innerHTML = "";
    formContainer.appendChild(clone);

    setTimeout(() => {
      formContainer.classList.add("show");
    }, 10); //minor delay to trigger transition

    //reattaches event listeners for buttons in menu form after clone
    const logButtons = formContainer.querySelectorAll(".log-button");
    const templateMap = {
      foodButton: "foodForm",
      exerciseButton: "exerciseForm",
      waterButton: "waterForm",
      weightButton: "weightForm",
    };

//sets up button-to-form mapping
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

          //after form is loaded wait for submit
          const submitButton = formContainer.querySelector("#submitButton");
          console.log("Submit button found:", submitButton);

          if (submitButton) {
            //attaches submit event to dynamically loaded form
            formElement.addEventListener("submit", function (event)  {
              console.log("Submit button event listener attached");
              event.preventDefault(); //prevents default form submission

              //grabs form data
              const formElement = formContainer.querySelector("form");
              const formData = new FormData(formElement);
              const data = Object.fromEntries(formData.entries());
              data.timestamp = new Date().toISOString();
              console.log("📝 Data to save:", data);

              //determins form type (e.g. food, exercise)
              const formType = formId.replace("Form", "");
              const userId = firebase.auth().currentUser.uid;

              //saves to fire base food collection, due to the saving by the meal name
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
                //if not food then store in the appropriate collection based on form entry
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

        }, 10); //waits for inner dom to render before querying it

      }, 300); //matches transition delay
    }
  });
});
  }
}

//event listener for exercise checkbox
//allows user to select type of exercise
document.addEventListener("change", function (e) {
  if (e.target.id === "exerciseCheckbox") {
    const isChecked = e.target.checked;
    document.getElementById("exerciseFormCardio").style.display = isChecked ? "none" : "flex";
    document.getElementById("exerciseFormStrength").style.display = isChecked ? "flex" : "none";
  }
});

//displays leaderboard sorted by the number of calories burnt
async function populateLeaderboard(sortBy = "burnt") {
  try {
    const usersSnapshot = await db.collection("users").get();
    const leaderboardData = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const name = userData.username || "Unknown";

      //fetch exercise data (calories burnt)
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

    //sorts users by calories burnt (default)
    leaderboardData.sort((a, b) => b.caloriesBurned - a.caloriesBurned);
    

    //sorts users into top 10 based on kcals
    const top10 = leaderboardData.slice(0, 10);

    //renders the table rows
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

    //update leaderboard heading
    document.querySelector("#leaderboardWidget th:nth-child(3)").textContent =
      sortBy === "weight" ? "Weight Change" : "Calories Burnt";

  } catch (error) {
    console.error("Error populating leaderboard:", error);
  }
}

//initialise app features when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("formMenu");
  menu.style.display = "none";

  //makes sure firebase authenticates
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadUserData(user);  
      goalLogic(user.uid);
      calendearLogic();
      weightGraphLogic(user.uid);
      updateDailyWaterIntake(user.uid);
      populateLeaderboard("burnt");

    //allows users to sort the leaderboard, ;imited to calories burnt at the moment
    document.querySelectorAll("#dropdownContentLeaderboard a").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const sortBy = item.getAttribute("data-sort");
      populateLeaderboard(sortBy);
      document.getElementById("dropbtnLeaderboard").textContent = `Sort by: ${item.textContent}`;
  });
});
      
    } else {
      window.location.href = "/sign-in.html"; //if user isnt signed in redirect to sign in page
    }
  });
});