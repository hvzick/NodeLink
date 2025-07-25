import { useEffect, useCallback } from "react";
import { markMessagesAsRead } from "../../../backend/Local database/SQLite/MarkMessagesAsRead";
import { EventBus } from "../../ChatUtils/ChatContext";

export function useMarkMessagesAsRead(
  conversationId: string,
  isFocused: boolean
) {
  // Mark messages as read when screen is focused
  useEffect(() => {
    if (!isFocused) return;

    const markAsRead = async () => {
      try {
        await markMessagesAsRead(conversationId);
        // console.log(`Messages marked as read for: ${conversationId}`);
      } catch (error) {
        console.error("❌ Failed to mark messages as read:", error);
      }
    };

    // Mark as read when screen opens
    markAsRead();

    // Listen for new messages while focused on this chat
    const handleNewMessage = (message: any) => {
      if (message.conversationId === conversationId && isFocused) {
        setTimeout(() => {
          markAsRead();
        }, 100);
      }
    };

    EventBus.on("new-message", handleNewMessage);

    return () => {
      EventBus.off("new-message", handleNewMessage);
    };
  }, [conversationId, isFocused]);

  // Optional: Mark as read when scrolling to bottom
  const onEndReached = useCallback(async () => {
    try {
      await markMessagesAsRead(conversationId);
      // console.log("Messages marked as read - reached bottom");
    } catch (error) {
      console.error("❌ Failed to mark messages as read:", error);
    }
  }, [conversationId]);

  return { onEndReached };
}
