// backend\Local database\AsyncStorage\Storage/UserProfileStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserData } from "../Types/UserData";
import { SessionUserStore } from "../Sessions/SessionUserStore";

/**
 * Store any user's profile data using your user_profile_<walletAddress> pattern.
 * This is for caching other users' profiles (contacts, chat participants, etc.).
 */
export async function storeUserProfile(userData: UserData): Promise<void> {
  if (!userData.walletAddress) throw new Error("No wallet address provided");

  // 1. Session cache
  SessionUserStore.set(userData.walletAddress, userData);

  // 2. AsyncStorage (your profile pattern)
  await AsyncStorage.setItem(
    `user_profile_${userData.walletAddress}`,
    JSON.stringify(userData)
  );
  console.log(`✅ Profile cached for ${userData.walletAddress}`);
}

/**
 * Load a user's profile from AsyncStorage and update session cache.
 * Uses your user_profile_<walletAddress> pattern.
 */
export async function loadUserProfile(
  walletAddress: string
): Promise<UserData | null> {
  try {
    const raw = await AsyncStorage.getItem(`user_profile_${walletAddress}`);
    if (raw) {
      const userData: UserData = JSON.parse(raw);
      // Cache in session for fast access
      SessionUserStore.set(walletAddress, userData);
      console.log(`✅ Profile loaded for ${walletAddress}`);
      return userData;
    }
    return null;
  } catch (err) {
    console.error(`❌ Failed to load profile for ${walletAddress}:`, err);
    return null;
  }
}

/**
 * Get user profile from session first, then AsyncStorage if needed.
 */
export async function getUserProfile(
  walletAddress: string
): Promise<UserData | null> {
  // First try session cache
  const sessionData = SessionUserStore.get(walletAddress);
  if (sessionData) return sessionData;

  // Fallback to AsyncStorage
  return await loadUserProfile(walletAddress);
}

/**
 * Remove user profile from both session and AsyncStorage.
 */
export async function removeUserProfile(walletAddress: string): Promise<void> {
  SessionUserStore.delete(walletAddress);
  await AsyncStorage.removeItem(`user_profile_${walletAddress}`);
  console.log(`🗑️ Profile removed for ${walletAddress}`);
}

/**
 * Preload user profiles into session cache for fast access.
 * Call this on app start with known wallet addresses.
 */
export async function preloadUserProfiles(
  walletAddresses: string[]
): Promise<void> {
  const promises = walletAddresses.map((address) => loadUserProfile(address));
  await Promise.all(promises);
  console.log(
    `✅ Preloaded ${walletAddresses.length} user profiles into session`
  );
}
