import { openDatabase } from "./InitialiseDatabase";

/**
 * Updates the status of a specific message in the local database.
 * @param messageId The ID of the message to update.
 * @param status The new status ('sent', 'delivered', 'read', 'failed').
 */
export const updateMessageStatus = async (
  messageId: string,
  status: "sent" | "delivered" | "read" | "failed"
): Promise<void> => {
  try {
    const db = await openDatabase();
    if (!db) throw new Error("Database connection not available.");

    await db.runAsync(
      `UPDATE messages SET status = ? WHERE id = ?;`,
      status,
      messageId
    );
    console.log(`Updated status for message ${messageId} to "${status}"`);
  } catch (error) {
    console.error(
      `❌ Failed to update status for message ${messageId}:`,
      error
    );
  }
};
