import React, { useState } from "react";
import {
    Container,
    TextField,
    Button,
    Box,
    Typography,
    CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function SignUp() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("http://127.0.0.1:8000/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error("Failed to sign up. Please try again.");
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            // Save userID to localStorage for session management
            localStorage.setItem("userID", data.userID);
            localStorage.setItem("username", username);

            navigate("/dashboard");
        } catch (error) {
            console.error("Error during sign up:", error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box mt={10}>
                <Typography variant="h4" align="center" gutterBottom>
                    Create an Account
                </Typography>
                <form onSubmit={handleSignUp}>
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
                    <TextField
                        label="Confirm Password"
                        type="password"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Box mt={2}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
                        </Button>
                    </Box>
                </form>
                <Box mt={2} textAlign="center">
                    <Typography variant="body1">Already have an account?</Typography>
                    <Button 
                        variant="outlined" 
                        color="secondary" 
                        fullWidth 
                        onClick={() => navigate("/")}
                    >
                        Back to Login
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default SignUp;
