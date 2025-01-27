import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  TextField,
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  CircularProgress,
} from "@mui/material";
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from "react-router-dom";
import "./App.css";
import Login from "./UI Components/login";
import SignUp from "./UI Components/signup";
import Dashboard from "./UI Components/dashboard";
import Options from "./UI Components/options";
import UploadImage from "./UI Components/uploadImage";
import Conversation from "./UI Components/conversation";

// Main App Component
function App() {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            EcoTextBot
          </Typography>
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        {/* Protected pages */}
        <Route path="/dashboard" element={isAuthenticated() ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/options" element={isAuthenticated() ? <Options /> : <Navigate to="/" />} />
        <Route path="/upload" element={isAuthenticated() ? <UploadImage /> : <Navigate to="/" />} />
        <Route path="/chat" element={isAuthenticated() ? <Conversation /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
