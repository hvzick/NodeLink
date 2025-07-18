// backend/Local database/AsyncStorage/Storage/LoadUserProfile.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserData } from "../../../Supabase/RegisterUser";
import { setCurrentUserData } from "./SharedStorageState";

export async function loadUserProfile(
  walletAddress: string
): Promise<UserData | null> {
  try {
    const raw = await AsyncStorage.getItem(`user_${walletAddress}`);

    if (raw) {
      const userData = JSON.parse(raw);
      // Only update shared state if this is the current user
      if (userData.walletAddress === walletAddress) {
        setCurrentUserData(userData);
      }
      console.log("✅ User profile loaded successfully");
      return userData;
    } else {
      console.warn(`⚠️ No profile found for wallet: ${walletAddress}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Failed to load user profile:", error);
    return null;
  }
}
