// backend/Local database/AsyncStorage/Utilities/StoreUserDataInStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserData } from "../../../Supabase/RegisterUser";
import { setSessionUserData } from "./SharedUserState";

export async function storeUserDataInStorage(
  userData: UserData
): Promise<void> {
  try {
    setSessionUserData(userData); // Update shared state

    await AsyncStorage.setItem("userData", JSON.stringify(userData));
    await AsyncStorage.setItem("sessionData", JSON.stringify(userData));

    console.log("User data stored in both session and AsyncStorage");
  } catch (err) {
    console.error("❌ Failed to store user data:", err);
    throw err;
  }
}
