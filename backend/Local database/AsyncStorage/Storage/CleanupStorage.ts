// backend/Local database/AsyncStorage/Storage/CleanupStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearCurrentUserData } from "./SharedStorageState";

export async function cleanupStorage(): Promise<void> {
  try {
    // Get all keys
    const keys = await AsyncStorage.getAllKeys();

    // Filter user-related keys
    const userKeys = keys.filter(
      (key) =>
        key.startsWith("user_") ||
        key === "currentUser" ||
        key === "userData" ||
        key === "sessionData"
    );

    // Remove all user-related data
    await AsyncStorage.multiRemove(userKeys);

    // Clear shared state
    clearCurrentUserData();

    console.log("✅ Storage cleanup completed");
  } catch (error) {
    console.error("❌ Failed to cleanup storage:", error);
    throw error;
  }
}
