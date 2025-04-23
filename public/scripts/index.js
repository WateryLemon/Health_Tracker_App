function updateGreeting() {
    const greetingElement = document.getElementById('greeting');
    const currentHour = new Date().getHours();

    if (currentHour < 12) {
        greetingElement.textContent = 'Good Morning!';
    } else if (currentHour < 18) {
        greetingElement.textContent = 'Good Afternoon!';
    } else {
        greetingElement.textContent = 'Good Evening!';
    }
}

function updateGoalElements() {
    const currentCalories = 1500; // Replace with dynamic value
    const dailyGoal = 2000;       // Replace with dynamic value
    const burntCalories = 100;    // Replace with dynamic value
    const remainingCalories = dailyGoal - (currentCalories - burntCalories);
    const currentTotalCalories = currentCalories - burntCalories;

    const messageElement = document.getElementById("goalMessage");
    const circle = document.querySelector("#circularProgress");
    const burntCircle = document.querySelector(".burnt-circle");

    // Update progress circle
    const progressPercent = Math.min((currentCalories / dailyGoal) * 100, 100).toFixed(1);
    const progressPercentBurnt = Math.min(((burntCalories) / dailyGoal) * 100, 100).toFixed(1);
    circle.style.setProperty('--progress', progressPercent);
    circle.style.setProperty('--progress-burnt', progressPercentBurnt);

    if (burntCalories === 0) {
        burntCircle.style.display = "none";
    } else {
        burntCircle.style.display = "block";
    }

    // Update SVG text
    document.getElementById("currentCaloriesText").textContent = `${currentTotalCalories} kcal`;
    document.getElementById("dailyGoalText").textContent = `${dailyGoal} kcal goal`;

    // Update goal message
    if (remainingCalories > 0) {
        messageElement.textContent = `You have ${remainingCalories} kcal left till your daily goal.`;
    } else {
        messageElement.textContent = "Congrats on reaching your daily goal!";
    }
}

function updateCalendar() {
    const calendarWidget = document.getElementById("calenderWidget");
    const todayEl = document.getElementById("today");

    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDate = new Date();

    function createDayElement(offset) {
        const date = new Date(currentDate);
        date.setDate(currentDate.getDate() + offset);

        const li = document.createElement("li");
        li.classList.add("day");

        li.innerHTML = 
            `<span class="day-number">${date.getDate()}</span>
            <i class="fas fa-hotdog"></i><span>: </span><span class="calories-eaten"></span>
            <i class='fas fa-burn'></i><span>: </span><span class="calories-burnt"></span>
            <span class="weekday">${weekdays[date.getDay()]}</span>`;
        return li;
    }

    for (let i = -2; i < 0; i++) {
        calendarWidget.insertBefore(createDayElement(i), todayEl);
    }

    for (let i = 2; i >= 1; i--) {
        calendarWidget.insertBefore(createDayElement(i), todayEl.nextSibling);
    }
    

    todayEl.querySelector(".day-number").textContent = currentDate.getDate();
    todayEl.querySelector(".weekday").textContent = weekdays[currentDate.getDay()];
}

function openAddMenu() {
    const addButton = document.getElementById("addButton");
    const formMenu = document.getElementById("formMenu");
    const formContainer = document.querySelector(".form-container");
    const buttonGrid = document.querySelector(".button-grid");
    const icon = addButton.querySelector("i");

    if (formMenu.style.display === "block") {
        // Close the menu
        formMenu.style.display = "none";
        addButton.style.backgroundColor = "#7030A1";
        icon.className = "fas fa-plus";
        
        // Reset the form container to show the button grid again
        formContainer.innerHTML = "";
        if (buttonGrid) {
            buttonGrid.style.display = "grid";
        }
    } else {
        // Open the menu
        formMenu.style.display = "block";
        addButton.style.backgroundColor = "#FF2431";
        icon.className = "fa-solid fa-xmark";
        
        // Ensure the button grid is visible when opening
        if (buttonGrid) {
            buttonGrid.style.display = "grid";
        }
        formContainer.innerHTML = "";
    }
}
  
function closeAddMenu() {
    document.getElementById("formMenu").style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
    const menu = document.getElementById("formMenu");
    menu.style.display = "none";
    updateGreeting();
    updateGoalElements();
    updateCalendar();
});

document.addEventListener("DOMContentLoaded", function() {
    const logButtons = document.querySelectorAll(".log-button");
    const formContainer = document.querySelector(".form-container");
    const buttonGrid = document.querySelector(".button-grid");

    const templateMap = {
        foodButton: "foodForm",
        exerciseButton: "exerciseForm",
        waterButton: "waterForm",
        weightButton: "weightForm",
    };

    logButtons.forEach(button => {
        button.addEventListener("click", function() {
            if (buttonGrid) {
                buttonGrid.style.display = "none";
            }

            const formId = templateMap[this.id];
            const formTemplate = document.getElementById(formId);

            if (formTemplate) {
                const clone = formTemplate.content.cloneNode(true);
                formContainer.innerHTML = "";
                formContainer.appendChild(clone);
                
                const backButton = document.createElement("button");
                backButton.textContent = "Back";
                backButton.addEventListener("click", function() {
                    formContainer.innerHTML = "";
                    if (buttonGrid) {
                        buttonGrid.style.display = "grid";
                    }
                });
                formContainer.appendChild(backButton);
            }
        });
    });
});
