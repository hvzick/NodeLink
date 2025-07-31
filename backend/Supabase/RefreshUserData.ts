// utils/ProfileUtils/RefreshUserData.ts

import { supabase } from "../../backend/Supabase/Supabase";
import {
  UserData,
  DEFAULT_USER_DATA,
} from "../../backend/Supabase/RegisterUser";
import { storeUserDataInStorage } from "../Local database/AsyncStorage/UserDataStorage/UtilityIndex";
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

      console.log("Refreshing user data from Supabase...");

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

        // Update local storage and session cache using the utility function
        await storeUserDataInStorage(refreshedUserData);

        console.log("User data refreshed and stored successfully");
        return refreshedUserData;
      } else {
        console.log("⚠️ No user data found in Supabase");
        return null;
      }
    } catch (error) {
      console.error("❌ Unexpected error refreshing user data:", error);
      return null;
    }
  };

/**
 * Refresh user data for a specific wallet address
 * @param walletAddress - The wallet address to refresh data for
 * @returns Promise<UserData | null> - Returns updated user data or null if failed
 */
export const refreshSpecificUserData = async (
  walletAddress: string
): Promise<UserData | null> => {
  try {
    if (!walletAddress) {
      console.error("❌ Wallet address is required");
      return null;
    }

    console.log(`Refreshing user data for wallet: ${walletAddress}`);

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

      // Store in local storage
      await storeUserDataInStorage(refreshedUserData);

      console.log("Specific user data refreshed successfully");
      return refreshedUserData;
    } else {
      console.log("⚠️ No user data found in Supabase for this wallet");
      return null;
    }
  } catch (error) {
    console.error("❌ Unexpected error refreshing specific user data:", error);
    return null;
  }
};
