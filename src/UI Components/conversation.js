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
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DeleteIcon from "@mui/icons-material/Delete";

function Conversation({ conversationID }) {
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [uploadedImage, setUploadedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [typing, setTyping] = useState(false); // Fake typing indicator

    useEffect(() => {
        if (!conversationID) return;

        const fetchMessages = async () => {
            try {
                const response = await fetch("https://eco-textile-app-backend.onrender.com/getMessages", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                    },
                    body: JSON.stringify({ conversationID }),
                });
                const data = await response.json();
                setMessages(data.messages || []);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();
    }, [conversationID]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typing]);

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

                const predictionResult = await imageResponse.json();
                textile = predictionResult.prediction;
                imagePath = predictionResult.image_path;
            }

            const userMessage = newMessage;

            setMessages((prev) => [
                ...prev,
                ...(userMessage ? [{ isUser: true, message: userMessage, image: imagePath }] : []),
            ]);
            setNewMessage("");
            setUploadedImage(null);

            // Fake typing indicator
            setTyping(true);
            setTimeout(async () => {
                const response = await fetch("https://eco-textile-app-backend.onrender.com/ask", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                    },
                    body: JSON.stringify({ query: userMessage, conversationID, textile, imagePath }),
                });

                const data = await response.json();
                setMessages((prev) => [
                    ...prev,
                    { isUser: false, message: data.response, image: null },
                ]);
                setTyping(false);
            }, 1000); // Simulate a short delay
        } catch (error) {
            console.error("Error sending message:", error);
            setTyping(false);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = Array.from(e.target.files).find((f) => f.type.startsWith("image/"));

        if (!file) {
            alert("Please upload a valid image file (JPEG, PNG, etc).");
            return;
        }
    
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
            alert("Unsupported image format. Please use JPEG, PNG, or WEBP.");
            return;
        }
    
        if (file.size > 5 * 1024 * 1024) { // optional size check: 5MB
            alert("File size too large. Please upload an image under 5MB.");
            return;
        }
    
        setUploadedImage(file);
    };

    return (
        <Box display="flex" flexDirection="column" height="100%" p={2}>
            {/* Message List (scrollable) */}
            <Box
                component={Paper}
                elevation={3}
                sx={{
                    flexGrow: 1,
                    overflowY: "auto",
                    borderRadius: 2,
                    p: 2,
                    mb: 2,
                    backgroundColor: "#f9fafb"
                }}
            >
                {/* Messages... */}
                <List>
                    {messages.map((msg, index) => (
                        <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            <ListItem
                                sx={{
                                    justifyContent: msg.isUser ? "flex-end" : "flex-start",
                                    flexDirection: "column",
                                    alignItems: msg.isUser ? "flex-end" : "flex-start"
                                }}
                            >
                                {msg.image && (
                                    <img
                                        src={`https://eco-textile-app-backend.onrender.com/${msg.image}`}
                                        alt="Uploaded"
                                        style={{ maxWidth: "200px", borderRadius: 10, marginBottom: 6 }}
                                    />
                                )}
                                <Box
                                    sx={{
                                        bgcolor: msg.isUser ? "#e3f2fd" : "#eeeeee",
                                        borderRadius: 3,
                                        px: 2,
                                        py: 1,
                                        maxWidth: "75%"
                                    }}
                                >
                                    <ReactMarkdown children={msg.message} remarkPlugins={[remarkGfm]} />
                                </Box>
                            </ListItem>
                            <Divider component="li" />
                        </motion.div>
                    ))}
                    {typing && (
                        <ListItem>
                            <Box
                                sx={{
                                    bgcolor: "#eeeeee",
                                    px: 2,
                                    py: 1,
                                    borderRadius: 3,
                                    fontStyle: "italic",
                                    color: "gray"
                                }}
                            >
                                typing...
                            </Box>
                        </ListItem>
                    )}
                    <div ref={messagesEndRef} />
                </List>
            </Box>

            {/* Image Preview */}
            {uploadedImage && (
                <Box sx={{ position: "relative", width: "100px", height: "100px", mb: 1 }}>
                    <img
                        src={URL.createObjectURL(uploadedImage)}
                        alt="Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                    />
                    <IconButton
                        onClick={() => setUploadedImage(null)}
                        sx={{ position: "absolute", top: 0, right: 0, bgcolor: "white" }}
                    >
                        <Tooltip title="Remove">
                            <DeleteIcon fontSize="small" />
                        </Tooltip>
                    </IconButton>
                </Box>
            )}

            {/* Drag & Drop */}
            <Paper
                elevation={2}
                sx={{
                    border: "2px dashed #ccc",
                    borderRadius: 2,
                    padding: 2,
                    textAlign: "center",
                    mb: 1,
                    cursor: "pointer"
                }}
                onClick={() => fileInputRef.current.click()}
            >
                Drag and drop an image here or click to select
            </Paper>
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileSelect} />

            {/* Input & Send */}
            <Box display="flex" alignItems="flex-end" gap={1}>
                <TextField
                    variant="outlined"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    multiline
                    minRows={1}
                    maxRows={4}
                    fullWidth
                />
                <IconButton
                    onClick={handleSendMessage}
                    disabled={loading}
                    sx={{
                        bgcolor: "#1976d2",
                        color: "white",
                        ":hover": { bgcolor: "#1565c0" },
                        width: 48,
                        height: 48
                    }}
                >
                    {loading ? <CircularProgress size={20} color="inherit" /> : <span>➤</span>}
                </IconButton>
            </Box>
        </Box>
    );
}

export default Conversation;
