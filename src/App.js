import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
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

const isAuthenticated = () => {
  const token = localStorage.getItem("access_token");
  if (!token) return false;
  try {
    const decodedToken = jwtDecode(token);
    return decodedToken.exp * 1000 > Date.now();
  } catch (error) {
    return false;
  }
};

const ProtectedRoute = ({ element }) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated()) {
      alert("Session expired, please log in again.");
      localStorage.clear();
      navigate("/");
    }
  }, [navigate]);
  return element;
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Make drawer state accessible to ChatPage or sidebar
  const drawerControls = {
    drawerOpen,
    setDrawerOpen,
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* AppBar */}
      <AppBar position="static" sx={{ zIndex: 1201 }}>
        <Toolbar>
          {isAuthenticated() && isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setDrawerOpen((prev) => !prev)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            EcoTextBot
          </Typography>
          {isAuthenticated() && (
            <Button
              color="inherit"
              onClick={() => {
                localStorage.clear();
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
        <Route path="/dashboard" element={<ProtectedRoute element={<ChatPage {...drawerControls} />} />} />
      </Routes>
    </Box>
  );
}

export default App;
