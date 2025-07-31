// utils/ChatUtils/chatProfiles.ts

import { supabase } from "./Supabase";
import { UserData } from "./RegisterUser";
import { getUserDataFromSession } from "../Local database/AsyncStorage/UserDataStorage/GetUserDataFromSession";
import { storeUserDataInStorage } from "../Local database/AsyncStorage/UserDataStorage/UtilityIndex";

export interface ChatProfile {
  name: string;
  avatar: string | null;
}

/**
 * Load all chat profiles for the chat screen
 * Checks cache first, then fetches from Supabase if needed
 */
export const fetchChatProfiles = async (
  conversationIds: string[]
): Promise<Record<string, ChatProfile>> => {
  console.log(`Loading ${conversationIds.length} chat profiles...`);

  const profiles: Record<string, ChatProfile> = {};
  const walletsToFetch: string[] = [];

  // Check cache first
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

  // Fetch uncached profiles from Supabase
  if (walletsToFetch.length > 0) {
    console.log(
      `🌐 Fetching ${walletsToFetch.length} profiles from Supabase...`
    );

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("wallet_address", walletsToFetch);

    if (error) {
      console.error("❌ Failed to fetch profiles:", error);
    } else if (data) {
      // Cache and format the data
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
        await storeUserDataInStorage(userData);

        // Add to return object
        const conversationId = `convo_${profile.wallet_address}`;
        profiles[conversationId] = {
          name: userData.name,
          avatar: userData.avatar === "default" ? null : userData.avatar,
        };
      }
    }
  }

  console.log(
    `Loaded ${Object.keys(profiles).length}/${conversationIds.length} profiles`
  );
  return profiles;
};
