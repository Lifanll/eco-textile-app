import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
} from "@mui/material";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Login from "./UI Components/login";
import SignUp from "./UI Components/signup";
import Dashboard from "./UI Components/dashboard";
import Options from "./UI Components/options";
import UploadImage from "./UI Components/uploadImage";
import Conversation from "./UI Components/conversation";
import jwtDecode from "jwt-decode";

// Helper function to check authentication
const isAuthenticated = () => {
  const token = localStorage.getItem("access_token");
  if (!token) return false;

  try {
    const decodedToken = jwtDecode(token);
    return decodedToken.exp * 1000 > Date.now();
  } catch (error) {
    return false; // Invalid token
  }
};

// check authentication when the page loads
useEffect(() => {
  if (!isAuthenticated()) {
      alert("Session expired, please log in again.");
      localStorage.removeItem("access_token");
      localStorage.removeItem("userID");
      localStorage.removeItem("username");
      window.location.href = "/";
  }
}, []);


// Main App Component
function App() {
  return (
    <Router>
      {/* Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            EcoTextBot
          </Typography>
          {isAuthenticated() && (
            <Button
              color="inherit"
              onClick={() => {
                localStorage.removeItem("access_token");
                localStorage.removeItem("userID");
                localStorage.removeItem("username");
                window.location.href = "/";
              }}
            >
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/dashboard"
          element={
            <Dashboard />
          }
        />
        <Route
          path="/options"
          element={
            <Options />
          }
        />
        <Route
          path="/upload"
          element={
            <UploadImage />
          }
        />
        <Route
          path="/conversation/:conversationId"
          element={
            <Conversation />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
