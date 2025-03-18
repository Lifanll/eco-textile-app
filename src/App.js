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

// Helper function to check authentication
const isAuthenticated = () => {
  const token = localStorage.getItem("access_token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    return expirationTime > Date.now(); // Check if token is still valid
  } catch (error) {
    return false; // Invalid token
  }
};

// Wrapper for protected routes
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    localStorage.removeItem("access_token"); // Remove invalid token
    return <Navigate to="/" />;
  }
  return children;
};


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
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/options"
          element={
            <ProtectedRoute>
              <Options />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadImage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conversation/:conversationId"
          element={
            <ProtectedRoute>
              <Conversation />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
