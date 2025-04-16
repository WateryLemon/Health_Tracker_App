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

function updateGoalMessage() {
    const currentCalories = 1000; // Replace with dynamic value
    const dailyGoal = 2000;       // Replace with dynamic value
    const burntCalories = 250;    // Replace with dynamic value
    const remainingCalories = dailyGoal - (currentCalories - burntCalories);
    const currentTotalCalories = currentCalories - burntCalories;

    const messageElement = document.getElementById("goalMessage");
    const circle = document.querySelector("#circularProgress");

    // Update progress
    const progressPercent = Math.min((currentCalories / dailyGoal) * 100, 100).toFixed(1);
    const progressPercentBurnt = Math.min(((burntCalories) / dailyGoal) * 100, 100).toFixed(1);
    circle.style.setProperty('--progress', progressPercent);
    circle.style.setProperty('--progress-burnt', progressPercentBurnt);

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

        li.innerHTML = `
            <span class="day-number">${date.getDate()}</span>
            <i class="fas fa-hotdog"></i><span>: </span><span class="calories-eaten"></span>
            <i class='fas fa-burn'></i><span>: </span><span class="calories-burnt"></span>
            <span class="weekday">${weekdays[date.getDay()]}</span>
        `;
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

document.addEventListener("DOMContentLoaded", () => {
    updateGreeting();
    updateGoalMessage();
    updateCalendar();
});
