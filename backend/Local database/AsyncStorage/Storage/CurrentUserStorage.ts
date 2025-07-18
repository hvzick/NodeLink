// backend\Local database\AsyncStorage\Storage/CurrentUserStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserData } from "../Types/UserData";
import { SessionUserStore } from "../Sessions/SessionUserStore";

/**
 * Store current user data in both session and AsyncStorage under "userData" key.
 * This maintains your existing pattern for the logged-in user.
 */
export async function storeCurrentUserData(userData: UserData): Promise<void> {
  if (!userData.walletAddress) throw new Error("No wallet address provided");

  // 1. Session cache
  SessionUserStore.set(userData.walletAddress, userData);

  // 2. AsyncStorage (your existing pattern)
  await AsyncStorage.setItem("userData", JSON.stringify(userData));
  console.log(`✅ Current user data saved for ${userData.walletAddress}`);
}

/**
 * Get current user data from AsyncStorage and update session cache.
 * Follows your existing "userData" key pattern.
 */
export async function loadCurrentUserData(): Promise<UserData | null> {
  try {
    const raw = await AsyncStorage.getItem("userData");
    if (raw) {
      const userData: UserData = JSON.parse(raw);
      // Cache in session for fast access
      SessionUserStore.set(userData.walletAddress, userData);
      console.log(`✅ Current user data loaded: ${userData.walletAddress}`);
      return userData;
    }
    return null;
  } catch (err) {
    console.error("❌ Failed to load current user data:", err);
    return null;
  }
}

/**
 * Get current user data from session cache (instant access).
 * First tries session, then falls back to AsyncStorage if needed.
 */
export async function getCurrentUserData(): Promise<UserData | null> {
  // First check if we have current user in session
  const currentWallet = await AsyncStorage.getItem("walletAddress");
  if (currentWallet) {
    const sessionData = SessionUserStore.get(currentWallet);
    if (sessionData) return sessionData;
  }

  // Fallback to loading from AsyncStorage
  return await loadCurrentUserData();
}

/**
 * Clear current user data (logout).
 */
export async function clearCurrentUserData(): Promise<void> {
  const raw = await AsyncStorage.getItem("userData");
  if (raw) {
    const userData: UserData = JSON.parse(raw);
    SessionUserStore.delete(userData.walletAddress);
  }
  await AsyncStorage.removeItem("userData");
  console.log("🗑️ Current user data cleared");
}
