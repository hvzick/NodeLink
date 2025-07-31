import { openDatabase } from "./InitialiseDatabase";
import { Message } from "./MessageStructure";

// Define interface for verification query result
interface MessageVerificationData {
  signature: string | null;
  signatureNonce: string | null;
  signatureVerified: number;
}

export const insertMessage = async (message: Message): Promise<any> => {
  try {
    const db = await openDatabase();

    // Check if message already exists - EXIT EARLY
    const existing = await db.getFirstAsync(
      `SELECT id FROM messages WHERE id = ?;`,
      [message.id]
    );

    if (existing) {
      console.log(
        `⚠️ Message with ID ${message.id} already exists. Skipping all processing.`
      );
      return existing; // Return early, don't log anything else
    }

    // Only log and process if message is truly new
    console.log(" === INSERTING MESSAGE TO DATABASE ===");
    // Insert the new message with signature fields
    const result = await db.runAsync(
      `INSERT OR IGNORE INTO messages (
        id, conversationId, sender, receiver, text, timestamp, imageUrl,
        fileName, fileSize, videoUrl, audioUrl, replyTo,
        status, encrypted, decrypted, encryptedContent, iv, createdAt, receivedAt,
        encryptionVersion, readAt,
        signature, signatureNonce, signatureTimestamp, messageHash, signatureVerified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        message.id || "",
        message.conversationId || "",
        message.sender || "",
        message.receiver || "",
        message.text || "",
        message.timestamp || new Date().toISOString(),
        message.imageUrl || "",
        message.fileName || "",
        message.fileSize || "",
        message.videoUrl || "",
        message.audioUrl || "",
        message.replyTo ? JSON.stringify(message.replyTo) : null,
        message.status || "sending",
        message.encrypted ? 1 : 0,
        message.decrypted ? 1 : 0,
        message.encryptedContent || "",
        message.iv || "",
        message.createdAt || Date.now(),
        message.receivedAt || null,
        message.encryptionVersion || "AES-256-GCM",
        message.readAt || null,
        // 🔥 CRITICAL FIX: Don't convert signature fields to null
        message.signature || "",
        message.signatureNonce || "",
        message.signatureTimestamp || 0,
        message.messageHash || "",
        message.signatureVerified ? 1 : 0,
      ]
    );

    console.log(
      `Message ${message.id} inserted successfully with signature data`
    );

    // Verify the insert worked by reading it back
    const inserted = (await db.getFirstAsync(
      `SELECT signature, signatureNonce, signatureVerified FROM messages WHERE id = ?;`,
      [message.id]
    )) as MessageVerificationData | null;

    console.log("Verification - Data actually stored in DB:", {
      signature: inserted?.signature
        ? `Present (${inserted.signature.length} chars)`
        : "Missing",
      signatureNonce: inserted?.signatureNonce || "Missing",
      signatureVerified: inserted?.signatureVerified,
    });

    return result;
  } catch (error) {
    console.error("❌ Error inserting message:", error);
    console.error("❌ Message data that failed:", {
      id: message.id,
      signature: message.signature ? "Present" : "Missing",
      signatureNonce: message.signatureNonce ? "Present" : "Missing",
    });
    throw error;
  }
};

// Helper function to check if a message exists (for deduplication)
export const messageExists = async (messageId: string): Promise<boolean> => {
  try {
    const db = await openDatabase();
    const existing = await db.getFirstAsync(
      `SELECT id FROM messages WHERE id = ?;`,
      [messageId]
    );
    return !!existing;
  } catch (error) {
    console.error("❌ Error checking message existence:", error);
    return false;
  }
};
