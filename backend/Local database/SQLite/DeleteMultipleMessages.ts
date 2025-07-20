// utils/ChatDetailUtils/ChatHandlers/HandleBulkDelete.ts

import { Alert } from "react-native";
import { ChatDetailHandlerDependencies } from "../../../utils/ChatDetailUtils/ChatHandlers/HandleDependencies";
import { deleteMessage } from "../../../backend/Local database/SQLite/DeleteMessage";
import { exitSelectionMode } from "../../../utils/ChatDetailUtils/ChatHandlers/HandleSelectMessage";

export const handleBulkDelete = async (
  dependencies: ChatDetailHandlerDependencies,
  selectedMessages: Set<string>
) => {
  if (selectedMessages.size === 0) return;

  const { setMessages, messages, addOrUpdateChat, conversationId, name, avatar } = dependencies;

  Alert.alert(
    "Delete Messages",
    `Are you sure you want to delete ${selectedMessages.size} message${selectedMessages.size > 1 ? "s" : ""}?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // Delete messages from database
            for (const messageId of selectedMessages) {
              await deleteMessage(messageId);
            }

            // Remove from local state
            setMessages((prev) => prev.filter((msg) => !selectedMessages.has(msg.id)));

            // Exit selection mode
            exitSelectionMode(dependencies);

            // Update chat preview with latest message
            const remainingMessages = messages.filter((msg) => !selectedMessages.has(msg.id));
            const lastMsg = remainingMessages[remainingMessages.length - 1];
            if (lastMsg) {
              addOrUpdateChat({
                id: conversationId,
                name,
                message: lastMsg.text || lastMsg.imageUrl || lastMsg.videoUrl || "Attachment",
                time: lastMsg.createdAt
                  ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "",
                avatar,
              });
            }
          } catch (error) {
            console.error("Error deleting messages:", error);
            Alert.alert("Error", "Failed to delete messages");
          }
        },
      },
    ]
  );
};

export const handleSelectAll = (
  dependencies: ChatDetailHandlerDependencies,
  messages: any[],
  selectedMessages: Set<string>
) => {
  const { setSelectedMessages } = dependencies;
  
  if (selectedMessages.size === messages.length) {
    // Deselect all
    exitSelectionMode(dependencies);
  } else {
    // Select all
    setSelectedMessages(new Set(messages.map((msg) => msg.id)));
  }
};
