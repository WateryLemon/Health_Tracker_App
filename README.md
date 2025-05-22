<img src="https://cdn-icons-png.flaticon.com/512/4434/4434478.png" width="100" />

<a name="top"></a>

![Language: JavaScript](https://img.shields.io/badge/language-JavaScript-yellow)
![Frontend: HTML/CSS](https://img.shields.io/badge/frontend-HTML%2FCSS-blue)
![Backend: Node.js/Express](https://img.shields.io/badge/backend-Node.js%2FExpress-green)
![Database: Firestore](https://img.shields.io/badge/database-Firestore-orange)
![Uni Project](https://img.shields.io/badge/-university%20project-red?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/WateryLemon/Health_Tracker_App)

⭐ Star us on GitHub — every star is greatly appreciated

## Table of Contents
- [About](#-about)
- [How to Build](#-how-to-build)
- [Project Structure & Components](#-project-structure--components)
- [Contacts](#-contacts)

<a name="about"></a>
## 🚀 About

**Health Tracker App** is a full-stack web application designed to help users monitor and improve their health by tracking exercise, nutrition, weight, water intake, and personal goals. Built for a university group project, it combines an interactive dashboard, group goal features, and real-time progress tracking to encourage healthy habits and collaboration.

- **Interactive Dashboard:** Visualize daily calorie intake/burn, water consumption, and weight trends with dynamic charts and widgets.
- **Goal Setting & Progress:** Set personal fitness goals, track weight changes, and celebrate achievements with progress bars and popups.
- **Meal & Exercise Logging:** Log meals and exercises with autocomplete and calorie calculations, supporting both metric and imperial units.
- **Group Challenges:** Create or join groups, set shared goals, and view group progress with leaderboards and celebration effects.
- **Leaderboard:** Compete with friends or group members for calories burnt or weight change.
- **Responsive Design:** Clean, modern UI with mobile-friendly layouts and accessible controls.
- **Email Integration:** Invite users to groups and goals via email using Resend API.

This project demonstrates practical web development skills, teamwork, and a focus on user experience and maintainability.

<a name="how-to-build"></a>
## 📝 How to Build

To run this project locally:

```shell
# Open a terminal (Terminal for macOS or Linux)

# Ensure Git and Node.js are installed
# Visit https://git-scm.com and https://nodejs.org if needed

# Clone the repository
git clone https://github.com/WateryLemon/Health_Tracker_App.git

# Navigate to the project directory
cd Health_Tracker_App

# Install dependencies
npm install

# Start the application (default: http://localhost:3000)
npm run dev
```

> **Note:** You will need to provide your own Firebase and Resend API credentials in a `.env` file or via environment variables for production use.

<a name="project-structure--components"></a>
## 📚 Project Structure & Components

This project is organized for clarity and modularity. Key components include:

### 🖥️ Frontend (`/public`)

- **index.html / index.js / index.css:** Main dashboard with widgets for calories, water, weight, and leaderboard. Handles user interaction, chart rendering (Chart.js), and dynamic forms for logging data.
- **goals.html / goals.js:** Set and track personal fitness goals, with animated progress bars and achievement popups.
- **groups.html / groups.js:** Group management, shared goals, invitations, and group progress tracking.
- **profile.html / profile.js:** User profile management, unit preferences, and account settings.
- **Reusable Components:** Modular scripts and stylesheets for forms, popups, and widgets.

### 🗄️ Backend (`app.js`)

- **Express Server:** Handles API routes for user registration, authentication, group and goal management, and email invitations.
- **Firestore Integration:** Stores user data, logs, groups, and invitations securely.
- **Email Sending:** Uses Resend API to send group and goal invitations.

### 🗃️ Database

- **Firestore:** Stores users, groups, goals, logs, and invitations in a scalable NoSQL structure.

### 🎨 Styles

- **CSS:** Modern, responsive design with custom widgets, progress bars, and celebration effects for achievements.

### 🏆 Features Highlight

- **Dynamic Calorie & Weight Graphs:** Visualize trends over days, weeks, or months.
- **Autocomplete & Calculation:** Smart forms for food/exercise logging with real-time calorie computation.
- **Group Collaboration:** Shared goals, group leaderboards, and email invitations.
- **Celebratory UI:** Confetti, popups, and glowing progress bars for goal completion.

<a name="contacts"></a>
## 📬 Contacts

For questions, feedback, or collaboration inquiries, please reach out:

- **Name:** Jules, Ollie, Simas, Theo, Toby

Feel free to open an issue or pull request if you have suggestions or find any bugs!

[Back to top](#top)
