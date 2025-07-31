// utils/Database/clearAllMessages.ts
import { openDatabase } from "./InitialiseDatabase";

/**
 * Deletes all records from the 'messages' table in the SQLite database.
 * This is a destructive operation and should be used with care, e.g., during a full logout.
 */
export const clearAllMessagesFromDB = async (): Promise<void> => {
  try {
    const db = await openDatabase();
    // This SQL command deletes every row from the 'messages' table.
    await db.runAsync("DELETE FROM messages;");
    console.log("All messages have been deleted from the Local database.");
  } catch (error) {
    console.error("❌ Error clearing messages from the database:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};
