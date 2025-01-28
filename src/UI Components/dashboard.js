import React, { useState, useEffect } from "react";
import {
    Typography,
    Container,
    Button,
    Box,
    Card,
    CardContent,
    CardActions,
    CircularProgress,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function Dashboard() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [openDialog, setOpenDialog] = useState(false); // Modal state
    const [newConversationTitle, setNewConversationTitle] = useState(""); // New conversation title
    const navigate = useNavigate();

    useEffect(() => {
        const userID = localStorage.getItem("userID");
        const localUsername = localStorage.getItem("username");

        if (!userID || !localUsername) {
            alert("You need to log in first!");
            navigate("/");
            return;
        }

        setUsername(localUsername);

        const fetchConversations = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/getConversations", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ userID }),
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch conversations.");
                }

                const data = await response.json();
                setConversations(data.conversations);
            } catch (error) {
                console.error("Error fetching conversations:", error);
                alert("Error fetching conversations. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [navigate]);

    // Function to handle new conversation creation
    const handleCreateConversation = async () => {
        const userID = localStorage.getItem("userID");

        if (!newConversationTitle.trim()) {
            alert("Please provide a valid conversation title.");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/createConversation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userID, title: newConversationTitle }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to create conversation.");
            }

            const data = await response.json();
            alert("Conversation created successfully!");

            // Add the new conversation to the list
            setConversations((prevConversations) => [
                ...prevConversations,
                { id: data.conversationId, title: newConversationTitle },
            ]);

            // Close dialog and reset input
            setOpenDialog(false);
            setNewConversationTitle("");
        } catch (error) {
            console.error("Error creating conversation:", error);
            alert(error.message);
        }
    };

    // Function to navigate to a conversation
    const handleOpenConversation = (conversationId) => {
        navigate(`/conversation/${conversationId}`); // Pass conversationId as a route parameter
    };

    return (
        <Container maxWidth="md">
            <Box mt={5}>
                <Typography variant="h5">Hi {username}!</Typography>
                <Typography variant="subtitle1" gutterBottom>
                    Let's start exploring textile!
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" mt={5}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box mt={3}>
                        {conversations.length > 0 ? (
                            conversations.map((conversation) => (
                                <Card key={conversation.id} style={{ marginBottom: "15px" }}>
                                    <CardContent>
                                        <Typography variant="h6">{conversation.title}</Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleOpenConversation(conversation.id)}
                                        >
                                            Open
                                        </Button>
                                    </CardActions>
                                </Card>
                            ))
                        ) : (
                            <Typography variant="body1">No conversations found.</Typography>
                        )}
                    </Box>
                )}

                <Box mt={3}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setOpenDialog(true)} // Open modal
                    >
                        Start New Conversation
                    </Button>
                </Box>

                {/* Dialog for creating a new conversation */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                    <DialogTitle>Create New Conversation</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Enter a unique title for your new conversation.
                        </DialogContentText>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Conversation Title"
                            type="text"
                            fullWidth
                            value={newConversationTitle}
                            onChange={(e) => setNewConversationTitle(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)} color="secondary">
                            Cancel
                        </Button>
                        <Button onClick={handleCreateConversation} color="primary">
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
}

export default Dashboard;
