// backend/Local database/SQLite/GetUnreadCounts.ts
import { openDatabase } from "./InitialiseDatabase";

/**
 * Get unread message counts for all conversations
 */
export const getUnreadMessageCounts = async (): Promise<
  Record<string, number>
> => {
  try {
    const db = await openDatabase();

    const result = await db.getAllAsync(`
      SELECT conversationId, COUNT(*) as count 
      FROM messages 
      WHERE readAt IS NULL 
      GROUP BY conversationId
    `);

    const counts: Record<string, number> = {};
    result.forEach((row: any) => {
      counts[row.conversationId] = row.count;
    });

    return counts;
  } catch (error) {
    console.error("❌ Failed to get unread message counts:", error);
    return {};
  }
};
