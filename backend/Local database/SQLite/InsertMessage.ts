import { openDatabase } from "./InitialiseDatabase";
import { Message } from "./MessageStructure";

export const insertMessage = async (message: Message): Promise<any> => {
  try {
    const db = await openDatabase();

    // 🔍 Check if message already exists
    const existing = await db.getFirstAsync(
      `SELECT id FROM messages WHERE id = ?;`,
      [message.id]
    );

    if (existing) {
      console.log(
        `⚠️ Message with ID ${message.id} already exists. Skipping insert.`
      );
      return;
    }

    // 💾 Insert the new message with signature fields
    const result = await db.runAsync(
      `INSERT OR IGNORE INTO messages (
        id, conversationId, sender, receiver, text, timestamp, imageUrl,
        fileName, fileSize, videoUrl, audioUrl, replyTo,
        status, encrypted, decrypted, encryptedContent, iv, createdAt, receivedAt,
        encryptionVersion, readAt,
        signature, signatureNonce, signatureTimestamp, messageHash, signatureVerified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        message.id || null,
        message.conversationId || null,
        message.sender || null,
        message.receiver || null,
        message.text || null,
        message.timestamp || null,
        message.imageUrl || null,
        message.fileName || null,
        message.fileSize || null,
        message.videoUrl || null,
        message.audioUrl || null,
        message.replyTo ? JSON.stringify(message.replyTo) : null,
        message.status || "sending",
        message.encrypted ? 1 : 0,
        message.decrypted ? 1 : 0,
        message.encryptedContent || null,
        message.iv || null,
        message.createdAt || Date.now(),
        message.receivedAt || null,
        message.encryptionVersion || null,
        message.readAt || null,
        message.signature || null,
        message.signatureNonce || null,
        message.signatureTimestamp || null,
        message.messageHash || null,
        message.signatureVerified ? 1 : 0,
      ]
    );

    // console.log(`✅ Message ${message.id} inserted successfully with signature data.`);
    return result;
  } catch (error) {
    console.error("❌ Error inserting message:", error);
    throw error;
  }
};
