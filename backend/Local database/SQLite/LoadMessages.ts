// utils/ChatDetailUtils/LoadMessages.ts

import { openDatabase } from "./InitialiseDatabase";
import { Message } from "./MessageStructure";

/**
 * Fetches all messages a specific conversation, ordered by timestamp,
 * converting SQLite types back to the expected TypeScript types.
 */
export const fetchMessagesByConversation = async (
  conversationId: string
): Promise<Message[]> => {
  try {
    const db = await openDatabase();
    const rows: any[] = await db.getAllAsync(
      `SELECT * FROM messages
       WHERE conversationId = ?
       ORDER BY timestamp ASC;`,
      conversationId
    );

    return rows.map(
      (row): Message => ({
        // Basic identifiers
        id: row.id || "",
        conversationId: row.conversationId || "",
        sender: row.sender || "",
        receiver: row.receiver || "",

        // Message content
        text: row.text || "",
        encryptedContent: row.encryptedContent || "",
        iv: row.iv || "",

        // Convert SQLite integers to booleans
        encrypted: Boolean(row.encrypted),
        decrypted: Boolean(row.decrypted),
        signatureVerified: Boolean(row.signatureVerified),

        // Status and metadata
        status: row.status || "received",

        // Signature fields (never null)
        signature: row.signature || "",
        signatureNonce: row.signatureNonce || "",
        messageHash: row.messageHash || "",

        // Numeric fields
        signatureTimestamp: row.signatureTimestamp
          ? Number(row.signatureTimestamp)
          : 0,
        createdAt: Number(row.createdAt) || Date.now(),
        receivedAt: row.receivedAt ? Number(row.receivedAt) : null,
        readAt: row.readAt ? Number(row.readAt) : null,

        // Timestamps
        timestamp: row.timestamp || new Date().toISOString(),

        // Media attachments
        imageUrl: row.imageUrl || "",
        videoUrl: row.videoUrl || "",
        audioUrl: row.audioUrl || "",
        fileName: row.fileName || "",
        fileSize: row.fileSize || "",

        // Other fields
        encryptionVersion: row.encryptionVersion || "AES-256-GCM",
        replyTo: row.replyTo ? JSON.parse(row.replyTo) : null,
      })
    );
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    throw error;
  }
};
