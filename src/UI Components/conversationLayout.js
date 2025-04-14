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
  TextField,
  Drawer,
  useMediaQuery,
  useTheme
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import MenuIcon from "@mui/icons-material/Menu";
import { useState, useEffect } from "react";

export default function ConversationLayout({ children, activeConversationId, onSelectConversation, drawerOpen, setDrawerOpen }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // < 600px

  const [conversations, setConversations] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedConv, setSelectedConv] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");

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
    if (!renameTitle.trim()) return;

    await fetch("https://eco-textile-app-backend.onrender.com/renameConversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      },
      body: JSON.stringify({
        conversationID: selectedConv.id,
        newTitle: renameTitle
      })
    });

    setRenameDialogOpen(false);
    setRenameTitle("");
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
      body: JSON.stringify({ title })
    });
    setTitle("");
    setCreateDialogOpen(false);
    const newConv = await res.json();
    await fetchConversations();
    onSelectConversation(newConv.id);
    setDrawerOpen(false); // close drawer on create
  };

  const SidebarContent = (
    <Box width={300} minWidth={300} flexShrink={0} bgcolor="#f5f5f5" p={2}>
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
            onClick={() => {
              onSelectConversation(conv.id);
              setDrawerOpen(false); // close drawer if on mobile
            }}
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

      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
        <MenuItem onClick={() => {
          setRenameTitle(selectedConv?.title || "");
          setRenameDialogOpen(true);
        }}>Rename</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>

      {/* Dialogs */}
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

      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>Rename Conversation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Title"
            type="text"
            fullWidth
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRename} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  return (
    <Box display="flex" height="100%" width="100%" overflow="hidden">
      {/* Sidebar: Drawer for mobile */}
      {isMobile ? (
        <>
          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} ModalProps={{ keepMounted: true }} PaperProps={{sx: { height: 'calc(100% - 56px)', top: 56 }}}>
            {SidebarContent}
          </Drawer>
        </>
      ) : (
        SidebarContent
      )}

      {/* Chat Panel */}
      <Box sx={{ flexGrow: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </Box>
    </Box>
  );
}
