// utils/ChatUtils/getUserProfile.ts

import { supabase } from "../../backend/Supabase/Supabase";
import { UserData } from "../Local database/AsyncStorage/Types/UserData";
import { getUserDataFromSession } from "../Local database/AsyncStorage/Utilities/UtilityIndex";
import {
  storeUserProfile,
  getUserProfile,
} from "../Local database/AsyncStorage/Storage/UserProfileStorage";
import { SessionUserStore } from "../Local database/AsyncStorage/Sessions/SessionUserStore";

/**
 * Simplified interface for chat-specific profile data (backward compatibility)
 */
export interface UserProfileCache {
  name: string;
  avatar: string | null;
}

/**
 * Fetches ALL user details from Supabase and saves to both local and session storage.
 * This ensures complete user data is available for chat features.
 *
 * @param conversationId The conversation ID, expected to be in the format 'convo_WALLET_ADDRESS'.
 * @returns A promise that resolves to complete UserData object, or null if not found.
 */
export const fetchAndCacheFullUserProfile = async (
  conversationId: string
): Promise<UserData | null> => {
  const walletAddress = conversationId.replace("convo_", "");
  if (!walletAddress) {
    console.error(
      "Could not extract wallet address from conversationId:",
      conversationId
    );
    return null;
  }

  try {
    // 1. First check session cache for super fast access
    const sessionData = getUserDataFromSession(walletAddress);
    if (sessionData) {
      console.log(
        `⚡ Full profile loaded from session cache for ${walletAddress}`
      );
      return sessionData;
    }

    // 2. Check AsyncStorage cache
    const cachedProfile = await getUserProfile(walletAddress);
    if (cachedProfile) {
      console.log(
        `📱 Full profile loaded from AsyncStorage cache for ${walletAddress}`
      );
      return cachedProfile;
    }

    // 3. Fetch ALL user details from Supabase
    console.log(
      `🌐 Fetching complete profile from Supabase for ${walletAddress}`
    );
    const { data, error } = await supabase
      .from("profiles")
      .select("*") // Get ALL fields
      .eq("wallet_address", walletAddress)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    // 4. If data is found, create complete UserData and cache it
    if (data) {
      const fullUserData: UserData = {
        walletAddress: data.wallet_address,
        username: data.username ?? `user${Date.now().toString(36).slice(-6)}`,
        name: data.name ?? "Unknown User",
        avatar: data.avatar ?? "default",
        bio: data.bio ?? "",
        created_at: data.created_at,
        publicKey: data.public_key ?? data.publicKey,
      };

      // Store using your existing storage system (both local and session)
      await storeUserProfile(fullUserData);
      console.log(
        `✅ Fetched and cached complete profile for ${walletAddress}`
      );

      return fullUserData;
    }

    console.warn(`🚫 No profile found in Supabase for ${walletAddress}`);
    return null;
  } catch (error) {
    console.error(
      `❌ Failed to fetch complete profile for ${walletAddress}:`,
      error
    );

    // On failure, still try to load from your storage system
    try {
      const fallbackProfile = await getUserProfile(walletAddress);
      if (fallbackProfile) {
        console.log(
          `📱 Loaded complete profile from storage after error for ${walletAddress}`
        );
        return fallbackProfile;
      }
    } catch (cacheError) {
      console.error(
        `❌ Failed to load from storage after initial error:`,
        cacheError
      );
    }
    return null;
  }
};

/**
 * Backward compatibility: Returns simplified profile data for existing chat components
 */
export const fetchAndCacheUserProfile = async (
  conversationId: string
): Promise<UserProfileCache | null> => {
  const fullProfile = await fetchAndCacheFullUserProfile(conversationId);
  if (!fullProfile) return null;

  return {
    name: fullProfile.name ?? "Unknown User",
    avatar:
      fullProfile.avatar === "default" ? null : fullProfile.avatar ?? null,
  };
};

/**
 * Load multiple users' complete profiles for chat participants
 */
export const loadChatParticipantsProfiles = async (
  walletAddresses: string[]
): Promise<UserData[]> => {
  console.log(
    `🔄 Loading ${walletAddresses.length} chat participants profiles...`
  );

  const promises = walletAddresses.map((address) =>
    fetchAndCacheFullUserProfile(`convo_${address}`)
  );

  const results = await Promise.allSettled(promises);
  const profiles: UserData[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      profiles.push(result.value);
    } else {
      console.warn(`⚠️ Failed to load profile for ${walletAddresses[index]}`);
    }
  });

  console.log(
    `✅ Successfully loaded ${profiles.length}/${walletAddresses.length} profiles`
  );
  return profiles;
};

/**
 * Refresh all chat participants profiles (force fetch from Supabase)
 */
export const refreshChatParticipantsProfiles = async (
  walletAddresses: string[]
): Promise<UserData[]> => {
  console.log(
    `🔄 Refreshing ${walletAddresses.length} chat participants profiles...`
  );

  const promises = walletAddresses.map(async (address) => {
    try {
      // Fetch fresh data from Supabase
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", address)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        const fullUserData: UserData = {
          walletAddress: data.wallet_address,
          username: data.username ?? `user${Date.now().toString(36).slice(-6)}`,
          name: data.name ?? "Unknown User",
          avatar: data.avatar ?? "default",
          bio: data.bio ?? "",
          created_at: data.created_at,
          publicKey: data.public_key ?? data.publicKey,
        };

        // Store in both local and session storage
        await storeUserProfile(fullUserData);
        console.log(`✅ Refreshed profile for ${address}`);
        return fullUserData;
      }
    } catch (error) {
      console.error(`❌ Failed to refresh profile for ${address}:`, error);
    }
    return null;
  });

  const results = await Promise.allSettled(promises);
  const profiles: UserData[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      profiles.push(result.value);
    } else {
      console.warn(
        `⚠️ Failed to refresh profile for ${walletAddresses[index]}`
      );
    }
  });

  console.log(
    `✅ Successfully refreshed ${profiles.length}/${walletAddresses.length} profiles`
  );
  return profiles;
};

/**
 * Get complete user profile for chat display (fast session access)
 */
export const getChatUserFullProfile = (
  walletAddress: string
): UserData | null => {
  return getUserDataFromSession(walletAddress);
};

/**
 * Get simplified profile for backward compatibility
 */
export const getChatUserProfile = (
  walletAddress: string
): UserProfileCache | null => {
  const userData = getUserDataFromSession(walletAddress);
  if (!userData) return null;

  return {
    name: userData.name ?? "Unknown User",
    avatar: userData.avatar === "default" ? null : userData.avatar ?? null,
  };
};

/**
 * Check if user profile exists in session/local storage
 */
export const hasUserProfileCached = (walletAddress: string): boolean => {
  return getUserDataFromSession(walletAddress) !== null;
};

/**
 * Get all cached user profiles from session
 */
export const getAllCachedChatProfiles = (): UserData[] => {
  return SessionUserStore.getAllUsers();
};

/**
 * Preload and cache essential chat profiles on app start
 */
export const preloadEssentialChatProfiles = async (
  essentialWallets: string[]
): Promise<void> => {
  console.log(
    `🚀 Preloading ${essentialWallets.length} essential chat profiles...`
  );
  await loadChatParticipantsProfiles(essentialWallets);
  console.log(`✅ Essential profiles preloaded`);
};

/**
 * Batch load profiles for multiple conversations
 */
export const batchLoadConversationProfiles = async (
  conversationIds: string[]
): Promise<Record<string, UserData>> => {
  console.log(
    `🔄 Batch loading profiles for ${conversationIds.length} conversations...`
  );

  const promises = conversationIds.map(async (conversationId) => {
    const profile = await fetchAndCacheFullUserProfile(conversationId);
    return { conversationId, profile };
  });

  const results = await Promise.allSettled(promises);
  const profileMap: Record<string, UserData> = {};

  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value.profile) {
      profileMap[result.value.conversationId] = result.value.profile;
    }
  });

  console.log(`✅ Batch loaded ${Object.keys(profileMap).length} profiles`);
  return profileMap;
};

/**
 * Get or load user profile (tries session first, then storage, then Supabase)
 */
export const getOrLoadUserProfile = async (
  walletAddress: string
): Promise<UserData | null> => {
  // Try session first
  const sessionData = getUserDataFromSession(walletAddress);
  if (sessionData) return sessionData;

  // Try storage
  const storageData = await getUserProfile(walletAddress);
  if (storageData) return storageData;

  // Load from Supabase
  return await fetchAndCacheFullUserProfile(`convo_${walletAddress}`);
};

/**
 * Update user profile in session and storage
 */
export const updateCachedUserProfile = async (
  walletAddress: string,
  updates: Partial<UserData>
): Promise<void> => {
  const existingProfile = getUserDataFromSession(walletAddress);
  if (!existingProfile) return;

  const updatedProfile: UserData = {
    ...existingProfile,
    ...updates,
  };

  await storeUserProfile(updatedProfile);
  console.log(`✅ Updated cached profile for ${walletAddress}`);
};

/**
 * Clear user profile from session and storage
 */
export const clearUserProfileCache = async (
  walletAddress: string
): Promise<void> => {
  const { removeUserProfile } = await import(
    "../Local database/AsyncStorage/Storage/UserProfileStorage"
  );
  await removeUserProfile(walletAddress);
  console.log(`🗑️ Cleared profile cache for ${walletAddress}`);
};
