// backend/Local database/AsyncStorage/Utilities/LoadUserDataFromStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserData } from "../../../Supabase/RegisterUser";
import { setSessionUserData } from "./SharedUserState";

export async function loadUserDataFromStorage(
  walletAddress: string
): Promise<UserData | null> {
  try {
    let raw = await AsyncStorage.getItem("sessionData");
    if (!raw) {
      raw = await AsyncStorage.getItem("userData");
    }

    if (raw) {
      const userData = JSON.parse(raw);
      if (userData.walletAddress === walletAddress) {
        setSessionUserData(userData);
        console.log("UserData loaded from AsyncStorage into session.");
        return userData;
      } else {
        console.warn(`Stored user data is for different wallet address.`);
        return null;
      }
    } else {
      setSessionUserData(null);
      console.log("⚠️ No user data found in AsyncStorage");
      return null;
    }
  } catch (err) {
    console.error("❌ Failed to load user data from AsyncStorage:", err);
    setSessionUserData(null);
    return null;
  }
}
