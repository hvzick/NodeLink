// /repository/deleteMessage.ts

import { openDatabase } from './InitialiseDatabase';

/**
 * Deletes a message by its ID.
 */
export const deleteMessage = async (id: string): Promise<any> => {
  try {
    const db = await openDatabase();
    const result = await db.runAsync(
        `DELETE FROM messages WHERE id = ?;`,
        id
    );
    console.log(`Message ${id} deleted successfully.`);
    return result;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};