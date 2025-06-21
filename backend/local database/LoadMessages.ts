// LoadMessages.ts

import { openDatabase } from './InitialiseDatabase'; // Use your filename
import { Message } from './MessageStructure';      // Use your filename

/**
 * Fetches all messages for a specific conversation, ordered by timestamp.
 */
export const fetchMessagesByConversation = async (conversationId: string): Promise<Message[]> => {
  try {
    const db = await openDatabase();
    const rows: any[] = await db.getAllAsync(
      `SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp ASC;`,
      conversationId
    );
    // Deserialize the 'replyTo' field from JSON string to object
    return rows.map((msg) => ({
      ...msg,
      replyTo: msg.replyTo ? JSON.parse(msg.replyTo) : null,
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};