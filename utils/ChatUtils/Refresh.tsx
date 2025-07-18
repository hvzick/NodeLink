// utils/ChatUtils/handleRefresh.ts

import { ChatItemType } from "./ChatItemsTypes";
import {
  fetchAndCacheUserProfile,
  UserProfileCache,
  refreshChatParticipantsProfiles,
  batchLoadConversationProfiles,
} from "../../backend/Supabase/FetchAvatarAndName"; // Updated import path

/**
 * Fetches and caches the latest profile information (name, avatar) for all chats in a list.
 * @param chatList The current list of chats from the ChatContext.
 * @returns A promise that resolves to a dictionary mapping conversation IDs to their updated profile data.
 */
export const refreshAllChatProfiles = async (
  chatList: ChatItemType[]
): Promise<Record<string, UserProfileCache>> => {
  console.log(`🔄 Refreshing ${chatList.length} chat profiles...`);

  // Create an array of promises, one for each chat profile to fetch.
  const profilePromises = chatList.map((chat) =>
    fetchAndCacheUserProfile(chat.id)
  );

  const newProfileData: Record<string, UserProfileCache> = {};

  try {
    // Wait for all the fetch requests to complete.
    const results = await Promise.allSettled(profilePromises);

    // Process the results and build the new profile data object.
    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        const chatId = chatList[index].id;
        newProfileData[chatId] = result.value;
      } else {
        console.warn(
          `⚠️ Failed to refresh profile for chat: ${chatList[index].id}`
        );
      }
    });

    console.log(
      `✅ Successfully refreshed ${Object.keys(newProfileData).length}/${
        chatList.length
      } profiles`
    );
    return newProfileData;
  } catch (error) {
    console.error("❌ Failed to refresh profiles:", error);
    // Return an empty object in case of a failure to prevent crashing.
    return {};
  }
};

/**
 * Force refresh all chat profiles from Supabase (bypasses cache)
 * @param chatList The current list of chats from the ChatContext.
 * @returns A promise that resolves to a dictionary mapping conversation IDs to their updated profile data.
 */
export const forceRefreshAllChatProfiles = async (
  chatList: ChatItemType[]
): Promise<Record<string, UserProfileCache>> => {
  console.log(
    `🔄 Force refreshing ${chatList.length} chat profiles from Supabase...`
  );

  // Extract wallet addresses from conversation IDs
  const walletAddresses = chatList.map((chat) => chat.id.replace("convo_", ""));

  try {
    // Force refresh from Supabase
    const profiles = await refreshChatParticipantsProfiles(walletAddresses);

    const newProfileData: Record<string, UserProfileCache> = {};

    // Convert to the expected format
    profiles.forEach((profile) => {
      const conversationId = `convo_${profile.walletAddress}`;
      newProfileData[conversationId] = {
        name: profile.name ?? "Unknown User",
        avatar: profile.avatar === "default" ? null : profile.avatar ?? null,
      };
    });

    console.log(
      `✅ Force refreshed ${Object.keys(newProfileData).length}/${
        chatList.length
      } profiles`
    );
    return newProfileData;
  } catch (error) {
    console.error("❌ Failed to force refresh profiles:", error);
    return {};
  }
};

/**
 * Batch refresh chat profiles using the new batch loading system
 * @param chatList The current list of chats from the ChatContext.
 * @returns A promise that resolves to a dictionary mapping conversation IDs to their updated profile data.
 */
export const batchRefreshChatProfiles = async (
  chatList: ChatItemType[]
): Promise<Record<string, UserProfileCache>> => {
  console.log(`🔄 Batch refreshing ${chatList.length} chat profiles...`);

  const conversationIds = chatList.map((chat) => chat.id);

  try {
    // Use the new batch loading function
    const profileMap = await batchLoadConversationProfiles(conversationIds);

    const newProfileData: Record<string, UserProfileCache> = {};

    // Convert to the expected format
    Object.entries(profileMap).forEach(([conversationId, profile]) => {
      newProfileData[conversationId] = {
        name: profile.name ?? "Unknown User",
        avatar: profile.avatar === "default" ? null : profile.avatar ?? null,
      };
    });

    console.log(
      `✅ Batch refreshed ${Object.keys(newProfileData).length}/${
        chatList.length
      } profiles`
    );
    return newProfileData;
  } catch (error) {
    console.error("❌ Failed to batch refresh profiles:", error);
    return {};
  }
};

/**
 * Refresh a single chat profile
 * @param conversationId The conversation ID to refresh
 * @returns A promise that resolves to the updated profile data or null
 */
export const refreshSingleChatProfile = async (
  conversationId: string
): Promise<UserProfileCache | null> => {
  console.log(`🔄 Refreshing single chat profile: ${conversationId}`);

  try {
    const profile = await fetchAndCacheUserProfile(conversationId);

    if (profile) {
      console.log(`✅ Successfully refreshed profile for ${conversationId}`);
      return profile;
    } else {
      console.warn(`⚠️ No profile found for ${conversationId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Failed to refresh profile for ${conversationId}:`, error);
    return null;
  }
};

/**
 * Preload essential chat profiles for better performance
 * @param chatList The current list of chats from the ChatContext.
 * @returns A promise that resolves when all profiles are preloaded
 */
export const preloadChatProfiles = async (
  chatList: ChatItemType[]
): Promise<void> => {
  console.log(`🚀 Preloading ${chatList.length} chat profiles...`);

  const walletAddresses = chatList.map((chat) => chat.id.replace("convo_", ""));

  try {
    const { preloadEssentialChatProfiles } = await import(
      "../../backend/Supabase/FetchAvatarAndName"
    );
    await preloadEssentialChatProfiles(walletAddresses);
    console.log(
      `✅ Successfully preloaded ${walletAddresses.length} chat profiles`
    );
  } catch (error) {
    console.error("❌ Failed to preload chat profiles:", error);
  }
};

/**
 * Check which chat profiles are already cached
 * @param chatList The current list of chats from the ChatContext.
 * @returns An object with cached and uncached conversation IDs
 */
export const getCachedChatProfiles = (
  chatList: ChatItemType[]
): { cached: string[]; uncached: string[] } => {
  const {
    hasUserProfileCached,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require("../../backend/Supabase/FetchAvatarAndName");

  const cached: string[] = [];
  const uncached: string[] = [];

  chatList.forEach((chat) => {
    const walletAddress = chat.id.replace("convo_", "");
    if (hasUserProfileCached(walletAddress)) {
      cached.push(chat.id);
    } else {
      uncached.push(chat.id);
    }
  });

  console.log(
    `📊 Profile cache status: ${cached.length} cached, ${uncached.length} uncached`
  );
  return { cached, uncached };
};

/**
 * Smart refresh that only loads uncached profiles
 * @param chatList The current list of chats from the ChatContext.
 * @returns A promise that resolves to a dictionary mapping conversation IDs to their profile data.
 */
export const smartRefreshChatProfiles = async (
  chatList: ChatItemType[]
): Promise<Record<string, UserProfileCache>> => {
  console.log(`🧠 Smart refreshing chat profiles...`);

  const { cached, uncached } = getCachedChatProfiles(chatList);
  const newProfileData: Record<string, UserProfileCache> = {};

  // Get cached profiles quickly
  const { getChatUserProfile } = await import(
    "../../backend/Supabase/FetchAvatarAndName"
  );
  cached.forEach((conversationId) => {
    const walletAddress = conversationId.replace("convo_", "");
    const profile = getChatUserProfile(walletAddress);
    if (profile) {
      newProfileData[conversationId] = profile;
    }
  });

  // Load uncached profiles
  if (uncached.length > 0) {
    const uncachedPromises = uncached.map((conversationId) =>
      fetchAndCacheUserProfile(conversationId)
    );

    try {
      const results = await Promise.allSettled(uncachedPromises);

      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) {
          newProfileData[uncached[index]] = result.value;
        }
      });
    } catch (error) {
      console.error("❌ Failed to load uncached profiles:", error);
    }
  }

  console.log(
    `✅ Smart refresh completed: ${
      Object.keys(newProfileData).length
    } profiles loaded`
  );
  return newProfileData;
};
