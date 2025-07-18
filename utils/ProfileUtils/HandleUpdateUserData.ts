// utils\ProfileUtils\UpdateUserData.ts

import { UserData } from "../../backend/Supabase/RegisterUser";
import { updateSupabaseUser } from "../../backend/Supabase/UpdateUserData";
import { storeUserDataInStorage } from "../../backend/Local database/AsyncStorage/UserDataStorage/UtilityIndex";

/**
 * Syncs user data with Supabase and updates all storage layers
 * @param updatedData - The updated user data to sync
 * @param setUserData - Function to update component state
 * @param setSessionData - Function to update session state
 * @returns Promise with success status and error message if any
 */
export async function updateUserData(
  updatedData: UserData,
  setUserData: (data: UserData) => void,
  setSessionData: (data: UserData) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🔄 Starting data sync with Supabase...");

    // 1. Update Supabase first
    if (updatedData.walletAddress) {
      const updates = {
        name: updatedData.name,
        username: updatedData.username,
        bio: updatedData.bio,
        avatar: updatedData.avatar,
      };

      console.log("📤 Updating Supabase...");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data, error } = await updateSupabaseUser(
        updatedData.walletAddress,
        updates
      );

      if (error) {
        throw new Error(error.message);
      }

      console.log("✅ Supabase updated successfully");
    }

    // 2. Update both AsyncStorage and session using utility function
    console.log("💾 Updating local storage...");
    await storeUserDataInStorage(updatedData);
    console.log("✅ Local storage updated successfully");

    // 3. Update component state
    setUserData(updatedData);
    setSessionData(updatedData);
    console.log("✅ Component state updated successfully");

    return { success: true };
  } catch (error) {
    console.error("❌ Error syncing data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
