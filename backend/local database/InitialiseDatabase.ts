// database.ts

import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

// Helper to open the database asynchronously
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
    // Create the messages table if it doesn't exist
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

    // Add the conversationId column if it doesn't exist (for backward compatibility)
    try {
      await db.execAsync(`
        ALTER TABLE messages ADD COLUMN conversationId TEXT;
      `);
    } catch (error) {
      // This will likely fail if the column already exists, which is fine.
      console.warn("Column 'conversationId' may already exist:", error);
    }

    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export { openDatabase };