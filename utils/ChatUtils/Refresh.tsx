// utils/ChatUtils/handleRefresh.ts
import { ChatItemType } from './ChatItemsTypes'; // Adjust path if necessary
import { fetchAndCacheUserProfile, UserProfileCache } from '../../backend/Supabase/FetchAvatarAndName'; // Adjust path if necessary

/**
 * Fetches and caches the latest profile information (name, avatar) for all chats in a list.
 * @param chatList The current list of chats from the ChatContext.
 * @returns A promise that resolves to a dictionary mapping conversation IDs to their updated profile data.
 */
export const refreshAllChatProfiles = async (
  chatList: ChatItemType[]
): Promise<Record<string, UserProfileCache>> => {
  console.log("Refreshing all chat profiles...");

  // Create an array of promises, one for each chat profile to fetch.
  const profilePromises = chatList.map(chat => fetchAndCacheUserProfile(chat.id));
  
  const newProfileData: Record<string, UserProfileCache> = {};

  try {
    // Wait for all the fetch requests to complete.
    const results = await Promise.all(profilePromises);
    
    // Process the results and build the new profile data object.
    results.forEach((profile, index) => {
      if (profile) {
        const chatId = chatList[index].id;
        newProfileData[chatId] = profile;
      }
    });
    
    console.log("✅ All profiles refreshed successfully.");
    return newProfileData;

  } catch (error) {
    console.error("❌ Failed to refresh one or more profiles:", error);
    // Return an empty object in case of a failure to prevent crashing.
    return {};
  }
};
