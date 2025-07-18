// backend/Local database/AsyncStorage/Storage/ClearUserData.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearCurrentUserData } from "./SharedStorageState";

export async function clearUserData(walletAddress?: string): Promise<void> {
  try {
    if (walletAddress) {
      // Clear specific user data
      await AsyncStorage.removeItem(`user_${walletAddress}`);
      console.log(`✅ User data cleared for wallet: ${walletAddress}`);
    } else {
      // Clear all user data
      await AsyncStorage.removeItem("currentUser");
      clearCurrentUserData();
      console.log("✅ All user data cleared");
    }
  } catch (error) {
    console.error("❌ Failed to clear user data:", error);
    throw error;
  }
}
