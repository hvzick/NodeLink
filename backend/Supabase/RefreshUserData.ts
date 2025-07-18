// utils/ProfileUtils/RefreshUserData.ts

import { supabase } from "./Supabase";
import { UserData } from "../Local database/AsyncStorage/Types/UserData";
import { storeCurrentUserData } from "../Local database/AsyncStorage/Storage/CurrentUserStorage";
import { DEFAULT_USER_DATA } from "./RegisterUser";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Refresh user data from Supabase and update local storage
 * @returns Promise<UserData | null> - Returns updated user data or null if failed
 */
export const refreshUserDataFromSupabase =
  async (): Promise<UserData | null> => {
    try {
      const walletAddress = await AsyncStorage.getItem("walletAddress");

      if (!walletAddress) {
        console.error("❌ No wallet address found");
        return null;
      }

      console.log("🔄 Refreshing user data from Supabase...");

      // Fetch fresh data from Supabase
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", walletAddress)
        .single();

      if (error) {
        console.error("❌ Error fetching user data from Supabase:", error);
        return null;
      }

      if (data) {
        // Create UserData object from Supabase response
        const refreshedUserData: UserData = {
          walletAddress: data.wallet_address,
          username: data.username ?? DEFAULT_USER_DATA.username,
          name: data.name ?? DEFAULT_USER_DATA.name,
          avatar: data.avatar ?? DEFAULT_USER_DATA.avatar,
          bio: data.bio ?? DEFAULT_USER_DATA.bio,
          created_at: data.created_at,
          publicKey: data.public_key ?? data.publicKey,
        };

        // Update local storage and session
        await storeCurrentUserData(refreshedUserData);

        console.log("✅ User data refreshed successfully");
        return refreshedUserData;
      } else {
        console.warn("⚠️ No user data found in Supabase");
        return null;
      }
    } catch (error) {
      console.error("❌ Unexpected error refreshing user data:", error);
      return null;
    }
  };
