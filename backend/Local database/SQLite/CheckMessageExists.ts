import { openDatabase } from "./InitialiseDatabase";
import { Message } from "./MessageStructure";

// Corrected messageExists function using the same API pattern
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
