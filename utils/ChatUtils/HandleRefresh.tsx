// utils/ChatUtils/handleRefresh.ts

import { ChatItemType } from "./ChatItemsTypes";
import { supabase } from "../../backend/Supabase/Supabase";
import { UserData } from "../../backend/Supabase/RegisterUser";
import { getUserDataFromSession } from "../../backend/Local database/AsyncStorage/UserDataStorage/GetUserDataFromSession";
import { storeUserDataInStorage } from "../../backend/Local database/AsyncStorage/UserDataStorage/UtilityIndex";

export interface UserProfileCache {
  name: string;
  avatar: string | null;
}

/**
 * Load all chat profiles for the chat screen
 * Checks cache first, then fetches from Supabase if needed.
 *
 * @param chatList - Array of ChatItemType. Must have .id as "convo_<wallet>"
 * @returns Map from conversationId to UserProfileCache
 */
export const loadChatProfiles = async (
  chatList: ChatItemType[]
): Promise<Record<string, UserProfileCache>> => {
  // Safeguard: handle empty input
  if (!chatList || !Array.isArray(chatList) || chatList.length === 0) {
    return {};
  }

  const conversationIds: string[] = chatList.map((chat) => chat.id);
  const profiles: Record<string, UserProfileCache> = {};
  const walletsToFetch: string[] = [];

  // 1. Try to fill from session cache
  conversationIds.forEach((conversationId) => {
    const walletAddress = conversationId.replace("convo_", "");
    const cachedProfile = getUserDataFromSession(walletAddress);

    if (cachedProfile) {
      profiles[conversationId] = {
        name: cachedProfile.name ?? "Unknown User",
        avatar:
          cachedProfile.avatar === "default"
            ? null
            : cachedProfile.avatar ?? null,
      };
    } else {
      walletsToFetch.push(walletAddress);
    }
  });

  // 2. Fetch any missing profiles from Supabase
  if (walletsToFetch.length > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("wallet_address", walletsToFetch);

    if (error) {
      console.error("❌ Failed to fetch profiles from Supabase:", error);
    } else if (data) {
      for (const profile of data) {
        const userData: UserData = {
          walletAddress: profile.wallet_address,
          username:
            profile.username ?? `user${Date.now().toString(36).slice(-6)}`,
          name: profile.name ?? "Unknown User",
          avatar: profile.avatar ?? "default",
          bio: profile.bio ?? "",
          created_at: profile.created_at,
          publicKey: profile.public_key ?? profile.publicKey,
        };

        // Cache it
        try {
          await storeUserDataInStorage(userData);
        } catch (storeError) {
          console.error(
            `❌ Failed to store user data for ${profile.wallet_address}:`,
            storeError
          );
        }

        // Add to profiles
        const conversationId = `convo_${profile.wallet_address}`;
        profiles[conversationId] = {
          name: userData.name,
          avatar: userData.avatar === "default" ? null : userData.avatar,
        };
      }
    }
  }

  return profiles;
};
