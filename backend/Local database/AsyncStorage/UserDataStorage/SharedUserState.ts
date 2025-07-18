// backend/Local database/AsyncStorage/Utilities/SharedUserState.ts
import { UserData } from "../../../Supabase/RegisterUser";

// Shared session cache - this is the single source of truth
let sessionUserData: UserData | null = null;

// Getter function
export function getSessionUserData(): UserData | null {
  return sessionUserData;
}

// Setter function
export function setSessionUserData(userData: UserData | null): void {
  sessionUserData = userData;
}

// Clear function
export function clearSessionUserData(): void {
  sessionUserData = null;
}
