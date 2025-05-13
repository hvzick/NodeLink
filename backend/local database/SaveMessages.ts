// SaveMessages.ts
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

// Define the Message type (adjust the fields as needed)
export type Message = {
  id: string;
  conversationId: string; // NEW property
  sender: string;
  text?: string;
  timestamp: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: string;
  videoUrl?: string;
  audioUrl?: string;
  replyTo?: Message | null;
};



// Helper to open the database asynchronously on supported platforms
const openDatabase = async () => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return await SQLite.openDatabaseAsync('chat.db');
  } else {
    console.warn('SQLite is not supported on this platform.');
    throw new Error('SQLite not supported');
  }
};

export const initializeDatabase = async (): Promise<void> => {
  try {
    const db = await openDatabase();
    // Create the table if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
         id TEXT PRIMARY KEY NOT NULL,
         conversationId TEXT,
         sender TEXT,
         text TEXT,
         timestamp TEXT,
         imageUrl TEXT,
         fileName TEXT,
         fileSize TEXT,
         videoUrl TEXT,
         audioUrl TEXT,
         replyTo TEXT
      );
    `);
    // Try to add the conversationId column if it isn't there yet
    // (This will error out if the column already exists, so we catch the error.)
    try {
      await db.execAsync(`
        ALTER TABLE messages ADD COLUMN conversationId TEXT;
      `);
    } catch (error) {
      console.warn("Column 'conversationId' may already exist:", error);
    }
    console.log('Database initialized and updated');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};


export const insertMessage = async (
  message: Message
): Promise<any> => {
  try {
    const db = await openDatabase();
    const result = await db.runAsync(
      `INSERT INTO messages (id, conversationId, sender, text, timestamp, imageUrl, fileName, fileSize, videoUrl, audioUrl, replyTo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      message.id,
      message.conversationId,
      message.sender,
      message.text || null, // Provide null instead of undefined
      message.timestamp,
      message.imageUrl || null,
      message.fileName || null,
      message.fileSize || null,
      message.videoUrl || null,
      message.audioUrl || null,
      message.replyTo ? JSON.stringify(message.replyTo) : null
    );
    return result;
  } catch (error) {
    console.error('Error inserting message:', error);
    throw error;
  }
};

export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const db = await openDatabase();
    const rows = await db.getAllAsync(
      `SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp ASC;`,
      conversationId
    );
    const messages: Message[] = rows.map((msg: any) => ({
      ...msg,
      replyTo: msg.replyTo ? JSON.parse(msg.replyTo) : null,
    }));
    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};
