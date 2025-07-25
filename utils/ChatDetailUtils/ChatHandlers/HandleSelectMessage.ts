// utils/ChatDetailUtils/ChatHandlers/HandleSelectMessage.ts

import { Keyboard, Alert } from "react-native";
import { ChatDetailHandlerDependencies } from "./HandleDependencies";
import { deleteMessage } from "../../../backend/Local database/SQLite/DeleteMessage";

// Individual functions
export const handleSelectMessage = (
  dependencies: ChatDetailHandlerDependencies,
  messageId: string
) => {
  const { setIsSelectionMode, setSelectedMessages } = dependencies;

  setIsSelectionMode(true);
  setSelectedMessages(new Set([messageId]));
  Keyboard.dismiss();

  console.log(`Entered selection mode with message: ${messageId}`);
};

export const toggleMessageSelection = (
  dependencies: ChatDetailHandlerDependencies,
  messageId: string
) => {
  const { setSelectedMessages, setIsSelectionMode } = dependencies;

  setSelectedMessages((prev) => {
    const newSet = new Set(prev);
    if (newSet.has(messageId)) {
      newSet.delete(messageId);
    } else {
      newSet.add(messageId);
    }

    // Exit selection mode if no messages selected
    if (newSet.size === 0) {
      setIsSelectionMode(false);
    }

    return newSet;
  });
};

export const exitSelectionMode = (
  dependencies: ChatDetailHandlerDependencies
) => {
  const { setIsSelectionMode, setSelectedMessages } = dependencies;

  setIsSelectionMode(false);
  setSelectedMessages(new Set());
};

export const handleSelectAll = (
  dependencies: ChatDetailHandlerDependencies,
  messages: any[],
  selectedMessages: Set<string>
) => {
  const { setSelectedMessages } = dependencies;

  if (selectedMessages.size === messages.length) {
    exitSelectionMode(dependencies);
  } else {
    setSelectedMessages(new Set(messages.map((msg) => msg.id)));
  }
};

export const handleBulkDelete = async (
  dependencies: ChatDetailHandlerDependencies,
  selectedMessages: Set<string>
) => {
  if (selectedMessages.size === 0) return;

  const {
    setMessages,
    messages,
    addOrUpdateChat,
    conversationId,
    name,
    avatar,
  } = dependencies;

  Alert.alert(
    "Delete Messages",
    `Are you sure you want to delete ${selectedMessages.size} message${
      selectedMessages.size > 1 ? "s" : ""
    }?`,
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
            setMessages((prev) =>
              prev.filter((msg) => !selectedMessages.has(msg.id))
            );

            // Exit selection mode
            exitSelectionMode(dependencies);

            // Update chat preview with latest message
            const remainingMessages = messages.filter(
              (msg) => !selectedMessages.has(msg.id)
            );
            const lastMsg = remainingMessages[remainingMessages.length - 1];
            if (lastMsg) {
              addOrUpdateChat({
                id: conversationId,
                name,
                message:
                  lastMsg.text ||
                  lastMsg.imageUrl ||
                  lastMsg.videoUrl ||
                  "Attachment",
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
