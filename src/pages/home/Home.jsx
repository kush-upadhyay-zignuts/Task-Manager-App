import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  arrayRemove,
} from "firebase/firestore";
import { useFirebase } from "../../context/firebase";
import { getFirestore } from "firebase/firestore";
import { app } from "../../context/firebase";

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

const Home = () => {
  const firebase = useFirebase();
  const [taskError, setTaskError] = React.useState(false);
  const [taskErrorMessage, setTaskErrorMessage] = React.useState("");
  const [task, setTask] = useState([]);
  const [value, setValue] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [updatedTask, setUpdatedTask] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [doneTasks, setDoneTasks] = useState({}); // Stores the completion state of tasks

  const navigate = useNavigate();
  // Check user authentication status
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);
  // Fetch tasks for authenticated user from Firestore
  useEffect(() => {
    const handleData = async () => {
      if (!user) {
        setTask([]); // Clear tasks when user logs out
        return;
      }
      const userRef = doc(db, "User", user.uid);

      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setTask(docSnap.data().tasks || []);
        } else {
          setTask([]);
        }
      });

      return () => unsubscribe();
    };
    handleData();
  }, [user]);
  // Function to update a task in Firestore
  const handleUpdate = async () => {
    if (!updatedTask.trim()) return;

    const userRef = doc(db, "User", user.uid);
    const updatedTasks = task.map((t) =>
      t === selectedTaskId ? updatedTask : t
    );

    await setDoc(userRef, { tasks: updatedTasks }, { merge: true });

    setOpenUpdate(false);
    setUpdatedTask("");
    setSelectedTaskId(null);
  };
  // Function to delete a task from Firestore
  const handleDelete = async (taskToDelete) => {
    if (!user) return;

    const userRef = doc(db, "User", user.uid);
    await updateDoc(userRef, {
      tasks: arrayRemove(taskToDelete),
    });
  };
  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("authToken");
      navigate("/signin");
    } catch (error) {}
  };
  // Input validation for task addition
  const validateInputs = () => {
    const taskInput = document.getElementById("task");

    let isValid = true;

    if (!value) {
      setTaskError(true);
      setTaskErrorMessage("Name is required.");
      isValid = false;
    } else if (value.trim().length < 2) {
      setTaskError(true);
      setTaskErrorMessage("Task must be at least 2 characters long.");
      return;
    } else {
      setTaskError(false);
      setTaskErrorMessage("");
    }

    return isValid;
  };
  // Handle task submission
  const handleSubmit = (event) => {
    if (taskError) {
      event.preventDefault();
      return;
    }
    firebase.storeTaskInFirestore(value);
    event.preventDefault();

    setValue("");
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          gap: 2,
        }}
        noValidate
        component="form"
        onSubmit={handleSubmit}
      >
        <Typography variant="h4" color="initial">
          TASK MANAGER APP
        </Typography>

        <FormControl>
          <FormLabel htmlFor="task"></FormLabel>
          <TextField
            id="task"
            name="task"
            placeholder="Add your task"
            autoFocus
            required
            fullWidth
            variant="outlined"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            error={taskError}
            helperText={taskErrorMessage}
            color={taskError ? "error" : "primary"}
          />
        </FormControl>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          onClick={validateInputs}
        >
          ADD Task
        </Button>

        {loading && (
          <Typography variant="h1" color="initial">
            Loading...
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          gap: 2,
        }}
      >
        {task.map((task, index) => (
          <Box
            key={index}
            sx={{
              mt: "2rem",
              padding: "1rem",
              display: "flex",
              justifyContent: "space-between",
              flexWrap:"wrap",
              border: "2px solid black"
            }}
          >
            <Box sx={{ width: "70vw", ml: "2rem", mr: "2rem" }}>
              <Typography
                variant="h5"
                color="initial"
                sx={
                  doneTasks[index]
                    ? { backgroundColor: "black", color: "white"}
                    : {}
                }
              >
                {task}
              </Typography>
            </Box>
            <Box sx={{ mr: "1rem" }}>
              {!doneTasks[index] && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setUpdatedTask(task);
                    setSelectedTaskId(task);
                    setOpenUpdate(true);
                  }}
                >
                  update
                </Button>
              )}
            </Box>
            <Box sx={{ mr: "1rem" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  handleDelete(task);
                  setDoneTasks((prev) => ({ ...prev, [index]: false }));
                }}
              >
                delete
              </Button>
            </Box>
            <Box sx={{ mr: "1rem" }}>
              {!doneTasks[index] && (
                <Button
                  onClick={() =>
                    setDoneTasks((prev) => ({ ...prev, [index]: true }))
                  }
                  variant="contained"
                  color="primary"
                >
                  Done
                </Button>
              )}
            </Box>
          </Box>
        ))}
        <Button onClick={handleLogout} variant="contained" color="primary">
          Logout
        </Button>
      </Box>
      <Modal open={openUpdate} onClose={() => setOpenUpdate(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography variant="h6">Update Task</Typography>
          <TextField
            value={updatedTask}
            onChange={(e) => setUpdatedTask(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={handleUpdate}>
            Save Changes
          </Button>
        </Box>
      </Modal>
    </>
  );
};

export default Home;
