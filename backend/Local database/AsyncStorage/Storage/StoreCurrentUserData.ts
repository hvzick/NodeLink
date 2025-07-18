// backend/Local database/AsyncStorage/Storage/StoreCurrentUserData.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserData } from "../../../Supabase/RegisterUser";
import { setCurrentUserData } from "./SharedStorageState";

export async function storeCurrentUserData(userData: UserData): Promise<void> {
  try {
    // Update shared state
    setCurrentUserData(userData);

    // Store in AsyncStorage
    await AsyncStorage.setItem("currentUser", JSON.stringify(userData));
    await AsyncStorage.setItem(
      `user_${userData.walletAddress}`,
      JSON.stringify(userData)
    );

    console.log("✅ Current user data stored successfully");
  } catch (error) {
    console.error("❌ Failed to store current user data:", error);
    throw error;
  }
}
