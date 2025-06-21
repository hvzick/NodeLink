// /repository/createMessage.ts

import { openDatabase } from './InitialiseDatabase';
import { Message } from './MessageStructure';

/**
 * =================================================================
 * CREATE Operation
 * =================================================================
 * Inserts a new message into the database.
 */
export const insertMessage = async (message: Message): Promise<any> => {
  try {
    const db = await openDatabase();
    const result = await db.runAsync(
      `INSERT INTO messages (id, conversationId, sender, text, timestamp, imageUrl, fileName, fileSize, videoUrl, audioUrl, replyTo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      message.id,
      message.conversationId,
      message.sender,
      message.text || null, // Use null for optional fields if they are undefined
      message.timestamp,
      message.imageUrl || null,
      message.fileName || null,
      message.fileSize || null,
      message.videoUrl || null,
      message.audioUrl || null,
      message.replyTo ? JSON.stringify(message.replyTo) : null // Store complex objects as JSON strings
    );
    console.log(`Message ${message.id} inserted successfully.`);
    return result;
  } catch (error) {
    console.error('Error inserting message:', error);
    throw error;
  }
};