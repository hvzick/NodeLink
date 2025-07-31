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

    console.log("Database initialized successfully with signature support.");

    // Migrate existing database to add signature fields
    await addSignatureColumns(db);
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
};

/**
 * Adds signature columns to existing messages table.
 */
const addSignatureColumns = async (
  db: SQLite.SQLiteDatabase
): Promise<void> => {
  try {
    // Check if signature columns already exist
    const result = await db.getAllAsync(`PRAGMA table_info(messages)`);
    const columnNames = result.map((column: any) => column.name);

    const signatureColumns = [
      { name: "signature", type: "TEXT" },
      { name: "signatureNonce", type: "TEXT" },
      { name: "signatureTimestamp", type: "INTEGER" },
      { name: "messageHash", type: "TEXT" },
      { name: "signatureVerified", type: "INTEGER DEFAULT 0" },
    ];

    // Add missing signature columns
    for (const column of signatureColumns) {
      if (!columnNames.includes(column.name)) {
        await db.execAsync(
          `ALTER TABLE messages ADD COLUMN ${column.name} ${column.type}`
        );
        console.log(`Added signature column: ${column.name}`);
      }
    }
  } catch (error) {
    console.error("❌ Error adding signature columns:", error);
    // Don't throw as this might be a new installation
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
