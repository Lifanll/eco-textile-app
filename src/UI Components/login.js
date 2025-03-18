import React, { useState } from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    Button,
    TextField,
    Box,
    CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false); // For loading state

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch("https://eco-textile-app-backend.onrender.com/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error("Failed to log in. Please check your credentials.");
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            // Save userID to localStorage for session management
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("username", username);

            // Navigate to dashboard on success
            navigate("/dashboard");
        } catch (error) {
            console.error("Error during login:", error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box mt={10}>
                <Typography variant="h4" align="center" gutterBottom>
                    EcoTextBot
                </Typography>
                <form onSubmit={handleLogin}>
                    <TextField
                        label="Username"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        label="Password"
                        type="password"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Box mt={2}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={loading} // Disable button while loading
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
                        </Button>
                    </Box>
                </form>
                <Box mt={2} textAlign="center">
                    <Typography variant="body1">Don't have an account?</Typography>
                    <Button 
                        variant="outlined" 
                        color="secondary" 
                        fullWidth 
                        onClick={() => navigate("/signup")}
                    >
                        Sign Up
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default Login;
