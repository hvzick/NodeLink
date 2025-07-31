/* eslint-disable @typescript-eslint/no-unused-vars */
// backend/Supabase/DeleteUserData.ts

import { supabase } from "./Supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface DeleteUserResult {
  success: boolean;
  error?: string;
  details?: any;
}

export const deleteUserByWallet = async (
  walletAddress: string
): Promise<DeleteUserResult> => {
  try {
    console.log("🗑️ Starting user deletion process for:", walletAddress);

    // Step 1: Fetch the user's profile data including avatar
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("avatar, username")
      .eq("wallet_address", walletAddress)
      .single();

    if (fetchError) {
      console.error("❌ Error fetching user profile:", fetchError.message);
      return {
        success: false,
        error: `Failed to fetch user profile: ${fetchError.message}`,
        details: fetchError,
      };
    }

    if (!profile) {
      console.warn("⚠️ User profile not found for wallet:", walletAddress);
      return {
        success: false,
        error: "User profile not found",
      };
    }

    console.log("📝 Found user profile:", profile.username);

    // Step 2: Delete avatar image from storage (if it's not the default)
    let avatarDeleted = false;
    if (profile.avatar && profile.avatar !== "default") {
      try {
        // Extract the file path from the avatar URL
        const avatarUrl: string = profile.avatar;
        let avatarPath: string | null = null;

        // Handle different URL formats
        if (avatarUrl.includes("/storage/v1/object/public/avatars/")) {
          avatarPath = avatarUrl.split("/storage/v1/object/public/avatars/")[1];
        } else if (avatarUrl.includes("/avatars/")) {
          avatarPath = avatarUrl.split("/avatars/")[1];
        }

        if (avatarPath) {
          console.log("🖼️ Deleting avatar image:", avatarPath);

          const { error: deleteImageError } = await supabase.storage
            .from("avatars")
            .remove([avatarPath]);

          if (deleteImageError) {
            console.warn(
              "⚠️ Failed to delete avatar image:",
              deleteImageError.message
            );
            // Don't fail the entire operation for avatar deletion failure
          } else {
            console.log("Avatar image deleted successfully");
            avatarDeleted = true;
          }
        }
      } catch (avatarError) {
        console.warn("⚠️ Error during avatar deletion:", avatarError);
        // Continue with profile deletion even if avatar deletion fails
      }
    }

    // Step 3: Delete related data (messages, etc.) if you have other tables
    // You might want to add these based on your database schema
    try {
      // Example: Delete user messages (adjust table name as needed)
      // const { error: messagesError } = await supabase
      //   .from("messages")
      //   .delete()
      //   .eq("sender_wallet", walletAddress);
      // if (messagesError) {
      //   console.warn("⚠️ Failed to delete user messages:", messagesError.message);
      // }
    } catch (relatedDataError) {
      console.warn("⚠️ Error deleting related data:", relatedDataError);
      // Continue with profile deletion
    }

    // Step 4: Delete the profile from the database
    console.log("🗑️ Deleting user profile from database...");

    const { error: deleteUserError } = await supabase
      .from("profiles")
      .delete()
      .eq("wallet_address", walletAddress);

    if (deleteUserError) {
      console.error(
        "❌ Failed to delete user profile:",
        deleteUserError.message
      );
      return {
        success: false,
        error: `Failed to delete user profile: ${deleteUserError.message}`,
        details: deleteUserError,
      };
    }

    console.log("User profile deleted successfully");

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ Unexpected error during user deletion:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      details: error,
    };
  }
};

/**
 * Clear all user data from local storage
 */
export const clearAllUserData = async (): Promise<void> => {
  try {
    console.log("🧹 Clearing all local user data...");

    // Get all keys first to see what we're clearing
    const allKeys = await AsyncStorage.getAllKeys();
    console.log("📱 Found AsyncStorage keys:", allKeys);

    // Clear all AsyncStorage data
    await AsyncStorage.clear();

    console.log("All local storage cleared");
  } catch (error) {
    console.error("❌ Error clearing local storage:", error);
    throw error;
  }
};

/**
 * Complete user deletion including logout
 */
export const deleteUserAndLogout = async (
  walletAddress: string,
  logoutFunction: () => void
): Promise<DeleteUserResult> => {
  try {
    console.log("Starting complete user deletion and logout process...");

    // Step 1: Delete user from Supabase
    const deletionResult = await deleteUserByWallet(walletAddress);

    if (!deletionResult.success) {
      return deletionResult;
    }

    // Step 2: Clear all local data
    try {
      await clearAllUserData();
    } catch (storageError) {
      console.warn("⚠️ Failed to clear some local data:", storageError);
      // Don't fail the operation for storage clearing issues
    }

    // Step 3: Execute logout
    try {
      logoutFunction();
      console.log("User logged out successfully");
    } catch (logoutError) {
      console.error("❌ Error during logout:", logoutError);
      // The account is deleted, but logout failed - still consider it a success
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ Error in complete deletion process:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete deletion process",
      details: error,
    };
  }
};
