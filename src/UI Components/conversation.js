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

// Conversation Interface
function Conversation() {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAskQuestion = () => {
        if (!question.trim()) {
            alert("Please enter a question.");
            return;
        }
        setLoading(true);
        // Simulate fetching answer
        setTimeout(() => {
            setAnswer(`Response to: "${question}"`);
            setLoading(false);
        }, 2000);
    };

    return (
        <Container maxWidth="md">
            <Box mt={5}>
                <Typography variant="h5" gutterBottom>
                    Chat
                </Typography>
                <Box
                    sx={{
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        padding: "16px",
                        height: "300px",
                        overflowY: "scroll",
                        mb: 2,
                    }}
                >
                    <Typography color="textSecondary">
                        {answer || "Response from LLM will appear here"}
                    </Typography>
                </Box>
                <TextField
                    variant="outlined"
                    placeholder="Ask a question..."
                    fullWidth
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                />
                <Box mt={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAskQuestion}
                        fullWidth
                    >
                        {loading ? <CircularProgress size={24} /> : "Send"}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default Conversation;