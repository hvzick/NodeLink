// backend\Local database\AsyncStorage\Storage/StorageCleanup.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { SessionUserStore } from "../Sessions/SessionUserStore";

/**
 * Clear all user data from both session and AsyncStorage.
 */
export async function clearAllUserData(): Promise<void> {
  // Clear session cache
  SessionUserStore.clear();

  // Clear AsyncStorage
  await AsyncStorage.removeItem("userData");

  // Get all AsyncStorage keys and remove user profiles
  const allKeys = await AsyncStorage.getAllKeys();
  const userProfileKeys = allKeys.filter((key) =>
    key.startsWith("user_profile_")
  );
  if (userProfileKeys.length > 0) {
    await AsyncStorage.multiRemove(userProfileKeys);
  }

  console.log("🗑️ All user data cleared from session and AsyncStorage");
}

/**
 * Remove old/unused user profiles from AsyncStorage.
 * Keeps only the specified wallet addresses.
 */
export async function cleanupOldProfiles(keepWallets: string[]): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const userProfileKeys = allKeys.filter((key) =>
    key.startsWith("user_profile_")
  );

  const keysToRemove = userProfileKeys.filter((key) => {
    const walletAddress = key.replace("user_profile_", "");
    return !keepWallets.includes(walletAddress);
  });

  if (keysToRemove.length > 0) {
    await AsyncStorage.multiRemove(keysToRemove);
    // Also remove from session
    keysToRemove.forEach((key) => {
      const walletAddress = key.replace("user_profile_", "");
      SessionUserStore.delete(walletAddress);
    });
  }

  console.log(`🧹 Cleaned up ${keysToRemove.length} old profiles`);
}
