// backend/Local database/AsyncStorage/Utilities/GetUserDataFromSession.ts
import { getSessionUserData } from "./SharedUserState";

export function getUserDataFromSession(walletAddress: string) {
  const sessionData = getSessionUserData();

  if (sessionData && sessionData.walletAddress === walletAddress) {
    console.log("Loaded user data from session cache");
    return sessionData;
  }
  console.log("No user data found in session cache");
  return null;
}
