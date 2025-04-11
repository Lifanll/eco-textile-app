import { useState, useEffect } from "react";
import ConversationLayout from "./conversationLayout";
import Conversation from "./conversation"; // main chat logic

export default function ChatPage({ drawerOpen, setDrawerOpen}) {
    const [convesrationID, setConversationID] = useState(null);

    return (
        <ConversationLayout
            activeConversationId={convesrationID}
            onSelectConversation={setConversationID}
            drawerOpen={drawerOpen}
            setDrawerOpen={setDrawerOpen}
        >
            {convesrationID ? (
                <Conversation conversationID={convesrationID} />
            ) : (
                <div>Select a conversation or start a new one.</div>
            )}
        </ConversationLayout>
    );
}
