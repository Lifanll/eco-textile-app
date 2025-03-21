import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
    Container,
    Typography,
    Box,
    Paper,
    TextField,
    Button,
    CircularProgress,
    List,
    ListItem,
    Divider,
    IconButton,
    Tooltip,
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DeleteIcon from "@mui/icons-material/Delete";

function Conversation() {
    const { conversationId } = useParams(); // Get conversationId from URL
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [uploadedImage, setUploadedImage] = useState(null); // Single image
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null); // Ref for the hidden file input

    // Fetch messages when the component loads or conversationId changes
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await fetch("https://eco-textile-app-backend.onrender.com/getMessages", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                    },
                    body: JSON.stringify({ conversationID: parseInt(conversationId) }),
                });

                const data = await response.json();
                setMessages(data.messages || []);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();
    }, [conversationId]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !uploadedImage) {
            alert("Please enter a message or upload an image.");
            return;
        }

        setLoading(true);

        try {
            let textile = "";
            let imagePath = "";

            if (uploadedImage) {
                const formData = new FormData();
                formData.append("image", uploadedImage);

                const imageResponse = await fetch("https://eco-textile-app-backend.onrender.com/predict", {
                    method: "POST",
                    body: formData,
                });

                if (!imageResponse.ok) {
                    throw new Error("Failed to process image.");
                }

                const predictionResult = await imageResponse.json();
                textile = predictionResult.prediction; // Get the predicted class
                imagePath = predictionResult.image_path; // Get the saved image path
            }

            const response = await fetch("https://eco-textile-app-backend.onrender.com/ask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,  
                },
                body: JSON.stringify({
                    query: newMessage,
                    conversationID: parseInt(conversationId),
                    textile,
                    imagePath,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send message.");
            }

            const data = await response.json();

            // Update messages with user message and LLM response
            setMessages((prevMessages) => [
                ...prevMessages,
                ...(newMessage ? [{ isUser: true, message: newMessage, image: imagePath }] : []),
                { isUser: false, message: data.response, image: null },
            ]);

            setNewMessage("");
            setUploadedImage(null);
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        const file = Array.from(e.dataTransfer.files).find((file) =>
            file.type.startsWith("image/")
        );
        if (file) {
            setUploadedImage(file); // Allow only one image
        }
    };

    const handleFileRemove = () => {
        setUploadedImage(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleFileSelect = (e) => {
        const file = Array.from(e.target.files).find((file) =>
            file.type.startsWith("image/")
        );
        if (file) {
            setUploadedImage(file); // Allow only one image
        }
    };

    return (
        <Container maxWidth="md">
            <Box mt={5}>
                <Typography variant="h5" gutterBottom>
                    Conversation {conversationId}
                </Typography>

                {/* Message List */}
                <Paper
                    elevation={3}
                    sx={{
                        height: "400px",
                        overflowY: "scroll",
                        borderRadius: "8px",
                        padding: "16px",
                        mb: 2,
                    }}
                >
                    <List>
                        {messages.map((msg, index) => (
                            <React.Fragment key={index}>
                                <ListItem
                                    sx={{
                                        justifyContent: msg.isUser ? "flex-end" : "flex-start",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: msg.isUser ? "flex-end" : "flex-start",
                                    }}
                                >
                                    {/* Display Image if Present */}
                                    {msg.image && (
                                        <img
                                            src={`https://eco-textile-app-backend.onrender.com/${msg.image}`}
                                            alt="Uploaded"
                                            style={{
                                                maxWidth: "100%",
                                                maxHeight: "150px",
                                                borderRadius: "8px",
                                                marginBottom: "5px",
                                            }}
                                        />
                                    )}

                                    {/* Display Text Message */}
                                    {msg.message && (
                                        <Box
                                            sx={{
                                                textAlign: msg.isUser ? "right" : "left",
                                                backgroundColor: msg.isUser
                                                    ? "rgba(33, 150, 243, 0.1)"
                                                    : "rgba(0, 0, 0, 0.05)",
                                                borderRadius: "12px",
                                                padding: "8px 16px",
                                                maxWidth: "75%",
                                            }}
                                        >
                                            <ReactMarkdown
                                                children={msg.message}
                                                remarkPlugins={[remarkGfm]}
                                            />
                                        </Box>
                                    )}
                                </ListItem>
                                <Divider variant="inset" component="li" />
                            </React.Fragment>
                        ))}
                    </List>

                </Paper>

                {/* Uploaded Image Preview */}
                {uploadedImage && (
                    <Box
                        sx={{
                            position: "relative",
                            width: "100px",
                            height: "100px",
                            mb: 2,
                        }}
                    >
                        <img
                            src={URL.createObjectURL(uploadedImage)}
                            alt="Uploaded"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "8px",
                            }}
                        />
                        <IconButton
                            onClick={handleFileRemove}
                            sx={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                backgroundColor: "rgba(255, 255, 255, 0.8)",
                            }}
                        >
                            <Tooltip title="Remove">
                                <DeleteIcon fontSize="small" />
                            </Tooltip>
                        </IconButton>
                    </Box>
                )}

                {/* Drag-and-Drop Area */}
                <Paper
                    elevation={2}
                    sx={{
                        border: "2px dashed #ccc",
                        borderRadius: "8px",
                        padding: "16px",
                        textAlign: "center",
                        mb: 2,
                        cursor: "pointer",
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current.click()} // Trigger file input on click
                >
                    Drag and drop an image here or click to select a file
                </Paper>
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                />

                {/* Input Field */}
                <TextField
                    variant="outlined"
                    placeholder="Type your message..."
                    fullWidth
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <Box mt={2} display="flex" gap={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={loading}
                        fullWidth
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Send"}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default Conversation;
