import { createContext } from "react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { collection, addDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import { getFirestore } from "firebase/firestore";
import "react-toastify/dist/ReactToastify.css";

// Create a React context for Firebase
const FirebaseContext = createContext(null);
// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyDCqAk5MoXHf-JuN5V18E5OmzUgfevv_wI",
  authDomain: "task1-cd7f9.firebaseapp.com",
  projectId: "task1-cd7f9",
  storageBucket: "task1-cd7f9.firebasestorage.app",
  messagingSenderId: "273874102748",
  appId: "1:273874102748:web:8800780b6cb4039f8f4719",
  measurementId: "G-ZY4W7Q14YC",
  databaseURL:
    "https://task1-cd7f9-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
// Hook to use Firebase context
export const useFirebase = () => useContext(FirebaseContext);
// Firebase provider component
export const FirebaseProvider = (props) => {
  const navigate = useNavigate();
  // Function to sign in a user with email and password
  const signinUser = (email, password) => {
    signInWithEmailAndPassword(auth, email, password)
      .then((res) => {
        if (res?.user) {
          const token = res.user.uid;
          
          localStorage.setItem("authToken", token);
          navigate("/home"); // Redirect to home page on successful login
          
        }
      })
      .catch((error) => {
        if (error.code === "auth/invalid-credential") {
          toast.error("check the email or password");
        } else {
          toast.error("Something went wrong. Try again.");
        }
      });
  };
  // Function to send password reset email
  const forgotPassword = (email) => {
    sendPasswordResetEmail(auth, email)
      .then(() => {
        toast.success("Password reset email sent! Check your inbox.");
      })
      .catch((error) => {
        if (error.code === "auth/user-not-found") {
          toast.error("No user found with this email.");
        } else {
          toast.error("Something went wrong. Try again.");
        }
      });
  };
  // Function to create a new user account
  const createUser = (email, password) => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((res) => {
        if (res?.user) {
          navigate("/signin"); // Redirect to sign-in page after registration
        }
      })
      .catch((error) => {
        if (error.code === "auth/email-already-in-use") {
          toast.error("This email is already registered. Try logging in!");
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      });
  };
  // Function to sign in with Google
  const signinWithGoogle = () => {
    signInWithPopup(auth, provider).then((res) => {
      if (res?.user) {
        const token = res.user.uid;
          
        localStorage.setItem("authToken", token);
        navigate("/home");

      }
    });
  };
  // Function to store a task in Firestore
  const storeTaskInFirestore = async (task) => {
    try {
      const user = auth.currentUser;

      if (!user) {
        return;
      }

      const userRef = doc(db, "User", user.uid); // Reference to the user's document

      // Get the existing document to check if tasks exist
      const userDoc = await getDoc(userRef);
      let existingTasks = [];

      if (userDoc.exists()) {
        existingTasks = userDoc.data().tasks || []; // Get existing tasks if available
      }

      // Add the new task to the existing tasks array
      const updatedTasks = [...existingTasks, task];

      // Store tasks inside the user document
      await setDoc(userRef, { tasks: updatedTasks }, { merge: true });

      console.log("Task added successfully!");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };
  return (
    <FirebaseContext.Provider
      value={{
        signinUser,
        createUser,
        signinWithGoogle,
        forgotPassword,
        storeTaskInFirestore,
      }}
    >
      {props.children}
    </FirebaseContext.Provider>
  );
};
