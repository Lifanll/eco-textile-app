import React, { useEffect } from "react";
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
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import Login from "./UI Components/login";
import SignUp from "./UI Components/signup";
import { jwtDecode } from "jwt-decode";
import ChatPage from "./UI Components/chatPage";

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

// ProtectedRoute Wrapper
const ProtectedRoute = ({ element }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      alert("Session expired, please log in again.");
      localStorage.removeItem("access_token");
      localStorage.removeItem("userID");
      localStorage.removeItem("username");
      navigate("/");
    }
  }, [navigate]);

  return element;
};

// Main App Component
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();

  return (
    <>
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
        <Route path="/dashboard" element={<ChatPage />} />
      </Routes>
    </>
  );
}

export default App;
