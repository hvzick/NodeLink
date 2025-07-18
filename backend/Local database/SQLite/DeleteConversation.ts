// repository/deleteConversation.ts
import { openDatabase } from './InitialiseDatabase';

/**
 * Deletes all messages associated with a specific conversation ID.
 * @param conversationId The ID of the conversation whose messages should be deleted.
 */
export const deleteMessagesByConversation = async (conversationId: string): Promise<void> => {
  try {
    const db = await openDatabase();
    // This SQL command deletes all rows from the 'messages' table
    // where the 'conversationId' column matches the provided ID.
    await db.runAsync(
        `DELETE FROM messages WHERE conversationId = ?;`,
        conversationId
    );
    console.log(`All messages for conversation ${conversationId} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting messages for conversation ${conversationId}:`, error);
    throw error;
  }
};
