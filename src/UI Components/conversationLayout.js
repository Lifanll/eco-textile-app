import {
    Box,
    List,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Divider,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import { useState, useEffect } from "react";

export default function ConversationLayout({
    children,
    activeConversationId,
    onSelectConversation
}) {
    const [conversations, setConversations] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedConv, setSelectedConv] = useState(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [title, setTitle] = useState("");

    const open = Boolean(anchorEl);

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        const res = await fetch("https://eco-textile-app-backend.onrender.com/getConversations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        const data = await res.json();
        setConversations(data.conversations || []);
    };

    const handleMenuClick = (event, conv) => {
        setAnchorEl(event.currentTarget);
        setSelectedConv(conv);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedConv(null);
    };

    const handleRename = async () => {
        const newTitle = prompt("New title", selectedConv.title);
        if (!newTitle) return;

        await fetch("https://eco-textile-app-backend.onrender.com/renameConversation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("access_token")}`
            },
            body: JSON.stringify({
                conversationID: selectedConv.id,
                newTitle
            })
        });

        handleMenuClose();
        fetchConversations();
    };

    const handleDelete = async () => {
        await fetch("https://eco-textile-app-backend.onrender.com/deleteConversation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("access_token")}`
            },
            body: JSON.stringify({ conversationID: selectedConv.id })
        });

        handleMenuClose();
        fetchConversations();
    };

    const handleCreateConversation = async () => {
        const res = await fetch("https://eco-textile-app-backend.onrender.com/createConversation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("access_token")}`
            },
            body: JSON.stringify({
                title
            })
        });
        setTitle("");
        setCreateDialogOpen(false);
        const newConv = await res.json();
        await fetchConversations();
        onSelectConversation(newConv.id); // Select new conversation
    };

    return (
        <Box display="flex" height="100vh">
            {/* Sidebar */}
            <Box
                width="300px"
                p={2}
                sx={{
                    borderRight: "1px solid #e0e0e0",
                    bgcolor: "#f9f9f9",
                    overflowY: "auto"
                }}
            >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6">My Conversations</Typography>
                    <Tooltip title="New Chat">
                        <IconButton onClick={() => setCreateDialogOpen(true)}>
                            <AddIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Divider sx={{ mb: 1 }} />
                <List>
                    {conversations.map((conv) => (
                        <Box
                            key={conv.id}
                            onClick={() => onSelectConversation(conv.id)}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                bgcolor: conv.id === activeConversationId ? "#e3f2fd" : "transparent",
                                borderRadius: 2,
                                px: 2,
                                py: 1,
                                mb: 1,
                                cursor: "pointer",
                                ":hover": { bgcolor: "#e0e0e0" }
                            }}
                        >
                            <Typography
                                sx={{
                                    flexGrow: 1,
                                    fontSize: "0.95rem",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis"
                                }}
                            >
                                {conv.title}
                            </Typography>
                            <IconButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuClick(e, conv);
                                }}
                                size="small"
                            >
                                <MoreVertIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    ))}
                </List>

                {/* Options Menu */}
                <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
                    <MenuItem onClick={handleRename}>Rename</MenuItem>
                    <MenuItem onClick={handleDelete}>Delete</MenuItem>
                </Menu>
                <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
                    <DialogTitle>Start a New Conversation</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Conversation Title"
                            type="text"
                            fullWidth
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateConversation} variant="contained">
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>

            {/* Chat Panel */}
            <Box flex={1} bgcolor="white" overflow="auto">
                {children}
            </Box>
        </Box>
    );
}
