// backend\Local database\SQLite\MarkMessagesAsRead
import { openDatabase } from "./InitialiseDatabase";

/**
 * Mark all messages in a conversation as read
 */
export const markMessagesAsRead = async (
  conversationId: string
): Promise<void> => {
  try {
    const db = await openDatabase();
    const currentTime = Date.now();

    await db.runAsync(
      `
      UPDATE messages 
      SET readAt = ? 
      WHERE conversationId = ? AND readAt IS NULL
    `,
      [currentTime, conversationId]
    );

    console.log(`Messages marked as read for: ${conversationId}`);
  } catch (error) {
    console.error("❌ Failed to mark messages as read:", error);
  }
};

/**
 * Get unread message count for a specific conversation
 */
export const getUnreadMessageCountForConversation = async (
  conversationId: string
): Promise<number> => {
  try {
    const db = await openDatabase();

    const result = await db.getFirstAsync(
      `
      SELECT COUNT(*) as count 
      FROM messages 
      WHERE conversationId = ? AND readAt IS NULL
    `,
      [conversationId]
    );

    return (result as any)?.count || 0;
  } catch (error) {
    console.error("❌ Failed to get unread count for conversation:", error);
    return 0;
  }
};
