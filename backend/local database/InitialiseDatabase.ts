// backend/Local database/InitialiseDatabase.ts

import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

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

    // ✅ Create table with 18 columns including `createdAt`
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
        createdAt INTEGER
      );
    `);

    console.log('✅ Database initialized successfully.');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

let dbInitPromise: Promise<void> | null = null;

export const ensureDatabaseInitialized = async () => {
  if (!dbInitPromise) {
    dbInitPromise = initializeDatabase();
  }
  return dbInitPromise;
};

export { openDatabase };
