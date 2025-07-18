// backend/Local database/AsyncStorage/Storage/StoreUserProfile.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserData } from "../../../Supabase/RegisterUser";
import { setCurrentUserData, isCurrentUser } from "./SharedStorageState";

export async function storeUserProfile(userData: UserData): Promise<void> {
  try {
    // Store user profile
    await AsyncStorage.setItem(
      `user_${userData.walletAddress}`,
      JSON.stringify(userData)
    );

    // Update shared state if this is the current user
    if (isCurrentUser(userData.walletAddress)) {
      setCurrentUserData(userData);
      await AsyncStorage.setItem("currentUser", JSON.stringify(userData));
    }

    console.log("✅ User profile stored successfully");
  } catch (error) {
    console.error("❌ Failed to store user profile:", error);
    throw error;
  }
}
