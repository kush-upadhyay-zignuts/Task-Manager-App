import { Routes, Route } from "react-router-dom";
import { Navigate, Outlet } from "react-router-dom";
import Login from "./pages/login/Login";
import SignUp from "./pages/signup/SignUp";
import Home from "./pages/home/Home";
import ProtectedRoutes from "./constants/ProtectedRoutes";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" />} />
      <Route path="/signin" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route element={<ProtectedRoutes/>}>  
        <Route path="/home" element={<Home />} />
      </Route>
    </Routes>
  );
}

export default App;
