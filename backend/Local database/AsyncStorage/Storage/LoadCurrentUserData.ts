// backend/Local database/AsyncStorage/Storage/LoadCurrentUserData.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserData } from "../../../Supabase/RegisterUser";
import { setCurrentUserData } from "./SharedStorageState";

export async function loadCurrentUserData(): Promise<UserData | null> {
  try {
    const raw = await AsyncStorage.getItem("currentUser");

    if (raw) {
      const userData = JSON.parse(raw);
      setCurrentUserData(userData); // Update shared state
      console.log("✅ Current user data loaded successfully");
      return userData;
    } else {
      setCurrentUserData(null);
      console.warn("⚠️ No current user data found");
      return null;
    }
  } catch (error) {
    console.error("❌ Failed to load current user data:", error);
    setCurrentUserData(null);
    return null;
  }
}
