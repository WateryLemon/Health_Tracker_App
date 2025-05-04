//For password resets
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const handleResetPassword = () => {
  const auth = getAuth();
  const email = "user@example.com"; // Get this from user input

  sendPasswordResetEmail(auth, email)
    .then(() => {
      alert("Password reset email sent!");
    })
    .catch((error) => {
      console.error("Error sending reset email:", error.message);
    });
};
