// backend/Local database/MessageIndex.ts

import { openDatabase } from './InitialiseDatabase';
import { Message } from './MessageStructure';

export const insertMessage = async (message: Message): Promise<any> => {
  try {
    const db = await openDatabase();

    const result = await db.runAsync(
      `INSERT INTO messages (
        id, conversationId, sender, receiver, text, timestamp, imageUrl,
        fileName, fileSize, videoUrl, audioUrl, replyTo,
        status, encrypted, decrypted, encryptedContent, iv, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        message.id,
        message.conversationId,
        message.sender,
        message.receiver,
        message.text || null,
        message.timestamp,
        message.imageUrl || null,
        message.fileName || null,
        message.fileSize || null,
        message.videoUrl || null,
        message.audioUrl || null,
        message.replyTo ? JSON.stringify(message.replyTo) : null,
        message.status || 'sending',
        message.encrypted ? 1 : 0,
        message.decrypted ? 1 : 0,
        message.encryptedContent || null,
        message.iv || null,
        message.createdAt || Date.now()
      ]
    );

    console.log(`✅ Message ${message.id} inserted successfully.`);
    return result;
  } catch (error) {
    console.error('❌ Error inserting message:', error);
    throw error;
  }
};
