import { useState, useEffect } from "react";
import ConversationLayout from "./conversationLayout";
import Conversation from "./conversation"; // main chat logic
import { Box, Typography } from "@mui/material";

export default function ChatPage({ drawerOpen, setDrawerOpen }) {
  const [conversationID, setConversationID] = useState(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "there";
    setUsername(storedUsername);
  }, []);

  return (
    <ConversationLayout
      activeConversationId={conversationID}
      onSelectConversation={setConversationID}
      drawerOpen={drawerOpen}
      setDrawerOpen={setDrawerOpen}
    >
      {conversationID ? (
        <Conversation conversationID={conversationID} />
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            textAlign: "center",
            padding: 4,
            bgcolor: "background.default",
          }}
        >
          <Typography variant="h4" gutterBottom>
            Hi {username} 👋
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Let's explore some textiles together!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 400 }}>
            To get started, select an existing conversation from the sidebar (top left menu on mobile), or open a new one to begin exploring the world of eco-textiles.
          </Typography>
        </Box>
      )}
    </ConversationLayout>
  );
}
