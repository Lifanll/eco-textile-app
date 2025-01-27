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

// Dashboard Page
function Dashboard() {
    return (
        <Container maxWidth="md">
            <Box mt={5}>
                <Typography variant="h5">Hi Username!</Typography>
                <Typography variant="subtitle1" gutterBottom>
                    Let's start exploring textile!
                </Typography>
                <Grid container spacing={3}>
                    {["Title 1", "Title 2", "Title 3"].map((title, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">{title}</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Description
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <Button size="small">Open</Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
                <Box mt={3}>
                    <Button
                        component={Link}
                        to="/options"
                        variant="contained"
                        color="primary"
                    >
                        Start New Conversation
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default Dashboard;