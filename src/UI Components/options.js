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

// Options Page
function Options() {
    return (
        <Container maxWidth="sm">
            <Box mt={10}>
                <Button
                    component={Link}
                    to="/upload"
                    variant="contained"
                    color="secondary"
                    fullWidth
                    sx={{ mb: 2 }}
                >
                    Identify Textile
                </Button>
                <Button
                    component={Link}
                    to="/chat"
                    variant="contained"
                    color="primary"
                    fullWidth
                >
                    Start Chat
                </Button>
            </Box>
        </Container>
    );
}

export default Options;