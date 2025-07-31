// utils/ProfileUtils/HandleUserData.ts

import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../backend/Supabase/Supabase";
import {
  UserData,
  DEFAULT_USER_DATA,
  registerUser,
  validateUserData,
  createUserDataWithDefaults,
  generateUniqueUsername,
} from "../../backend/Supabase/RegisterUser";
import { storeUserDataInStorage } from "../Local database/AsyncStorage/UserDataStorage/UtilityIndex";

export async function handleUserData(): Promise<UserData | null> {
  try {
    console.log("Checking Supabase user profile...");

    // Get wallet address with error handling
    let walletAddress: string | null;
    try {
      walletAddress = await AsyncStorage.getItem("walletAddress");
    } catch (storageError) {
      console.error("❌ AsyncStorage error:", storageError);
      Alert.alert("Storage Error", "Failed to access local storage.");
      return null;
    }

    if (!walletAddress) {
      console.warn("⚠️ No wallet address found in AsyncStorage.");
      Alert.alert(
        "Authentication Required",
        "Please connect your wallet first."
      );
      return null;
    }

    console.log("Found wallet address:", walletAddress);

    // Check if user exists in Supabase and GET ALL DATA
    const { data: existingUser, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (error) {
      console.error("❌ Error querying Supabase:", error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    let userData: UserData;

    if (existingUser) {
      console.log("User already exists in Supabase.");

      // Map the REAL user data from Supabase with null handling
      userData = {
        walletAddress: existingUser.wallet_address,
        username: existingUser.username || (await generateUniqueUsername()),
        name: existingUser.name || DEFAULT_USER_DATA.name,
        avatar: existingUser.avatar || DEFAULT_USER_DATA.avatar,
        bio: existingUser.bio || DEFAULT_USER_DATA.bio,
        created_at: existingUser.created_at,
        publicKey: existingUser.public_key,
      };

      // If we had to fill in missing data, update the database
      if (
        !existingUser.username ||
        !existingUser.name ||
        !existingUser.bio ||
        !existingUser.avatar
      ) {
        console.log("Updating database with missing user data...");
        try {
          const updateData = {
            ...(!existingUser.username && { username: userData.username }),
            ...(!existingUser.name && { name: userData.name }),
            ...(!existingUser.bio && { bio: userData.bio }),
            ...(!existingUser.avatar && { avatar: userData.avatar }),
          };

          const { error: updateError } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("wallet_address", userData.walletAddress);

          if (updateError) {
            console.warn("⚠️ Failed to update user defaults:", updateError);
          } else {
            console.log("Updated user with default values");
          }
        } catch (updateError) {
          console.warn("⚠️ Error updating user defaults:", updateError);
        }
      }

      // Validate final user data
      const validation = validateUserData(userData);
      if (!validation.isValid) {
        console.warn("⚠️ User data validation warnings:", validation.errors);
        // Continue with warnings but don't fail
      }
    } else {
      console.log("🆕 User not found — registering new user...");

      // Create new user data with defaults and unique username
      const newUserData = await createUserDataWithDefaults(walletAddress);

      const result = await registerUser(newUserData);

      if (result.error || !result.user) {
        const errorMessage =
          result.error?.message || "User registration failed";
        console.error("❌ Registration failed:", errorMessage);
        throw new Error(errorMessage);
      }

      userData = result.user;
      console.log("New user registered successfully");
    }

    // Store user data locally with error handling
    try {
      await storeUserDataInStorage(userData);
      console.log("User data stored locally");
    } catch (storageError) {
      console.warn("⚠️ Failed to store user data locally:", storageError);
      // Don't throw here as the user data is still valid from the database
    }

    return userData;
  } catch (err) {
    console.error("❌ handleUserData error:", err);

    const errorMessage =
      err instanceof Error
        ? err.message
        : "Unable to verify or create user profile.";

    Alert.alert("User Profile Error", errorMessage);
    return null;
  }
}

/**
 * Refresh user data from Supabase and update local storage
 */
export async function refreshUserData(
  walletAddress: string
): Promise<UserData | null> {
  try {
    console.log("Refreshing user data from Supabase...");

    const { data: userData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single();

    if (error) {
      console.error("❌ Error refreshing user data:", error);
      return null;
    }

    // Handle null values during refresh too
    const user: UserData = {
      walletAddress: userData.wallet_address,
      username: userData.username || (await generateUniqueUsername()),
      name: userData.name || DEFAULT_USER_DATA.name,
      avatar: userData.avatar || DEFAULT_USER_DATA.avatar,
      bio: userData.bio || DEFAULT_USER_DATA.bio,
      created_at: userData.created_at,
      publicKey: userData.public_key,
    };

    // Update local storage
    try {
      await storeUserDataInStorage(user);
      console.log("User data refreshed and stored");
    } catch (storageError) {
      console.warn("⚠️ Failed to store refreshed data:", storageError);
    }

    return user;
  } catch (err) {
    console.error("❌ Error refreshing user data:", err);
    return null;
  }
}

/**
 * Clear user data from local storage
 */
export async function clearUserData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      "walletAddress",
      "userData",
      // Add other user-related keys as needed
    ]);
    console.log("User data cleared from local storage");
  } catch (error) {
    console.error("❌ Error clearing user data:", error);
    throw error;
  }
}
