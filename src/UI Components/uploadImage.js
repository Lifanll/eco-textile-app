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

// Image Upload Page
function UploadImage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            alert("Please select an image.");
            return;
        }
        setLoading(true);
        // Simulate upload
        setTimeout(() => {
            setLoading(false);
            alert("File uploaded successfully!");
            navigate("/chat");
        }, 2000);
    };

    return (
        <Container maxWidth="sm">
            <Box mt={5}>
                <Typography variant="h6" gutterBottom>
                    Take or upload a photo and confirm
                </Typography>
                <TextField
                    type="file"
                    onChange={handleFileUpload}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                />
                {loading && <CircularProgress />}
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => navigate("/chat")}
                >
                    Continue to Chat
                </Button>
            </Box>
        </Container>
    );
}

export default UploadImage;