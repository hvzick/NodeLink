import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";

/**
 * Opens the database on supported platforms (iOS/Android).
 */
const openDatabase = async () => {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    try {
      return await SQLite.openDatabaseAsync("chat.db");
    } catch (error) {
      console.error("❌ Failed to open database:", error);
      throw error;
    }
  } else {
    const msg = "SQLite is not supported on this platform.";
    console.warn(msg);
    throw new Error(msg);
  }
};

/**
 * Initializes the messages table schema with signature support.
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    const db = await openDatabase();

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY NOT NULL,
        conversationId TEXT,
        sender TEXT,
        receiver TEXT,
        text TEXT,
        timestamp TEXT,
        imageUrl TEXT,
        fileName TEXT,
        fileSize TEXT,
        videoUrl TEXT,
        audioUrl TEXT,
        replyTo TEXT,
        status TEXT,
        encrypted INTEGER,
        decrypted INTEGER,
        encryptedContent TEXT,
        iv TEXT,
        createdAt INTEGER,
        receivedAt INTEGER,
        encryptionVersion TEXT,
        readAt INTEGER,
        -- Message signing fields
        signature TEXT,
        signatureNonce TEXT,
        signatureTimestamp INTEGER,
        messageHash TEXT,
        signatureVerified INTEGER DEFAULT 0
      );
    `);

    console.log("✅ Database initialized successfully with signature support.");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
};

// Lazy init to prevent multiple calls
let dbInitPromise: Promise<void> | null = null;

/**
 * Ensures the DB is initialized before access.
 */
export const ensureDatabaseInitialized = async () => {
  if (!dbInitPromise) {
    dbInitPromise = initializeDatabase();
  }
  return dbInitPromise;
};

export { openDatabase };
