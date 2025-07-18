// backend/Local database/AsyncStorage/Storage/SharedStorageState.ts
import { UserData } from "../../../Supabase/RegisterUser";

// Shared current user data - single source of truth
let currentUserData: UserData | null = null;

// Getter function
export function getCurrentUserData(): UserData | null {
  return currentUserData;
}

// Setter function
export function setCurrentUserData(userData: UserData | null): void {
  currentUserData = userData;
}

// Clear function
export function clearCurrentUserData(): void {
  currentUserData = null;
}

// Check if user is current user
export function isCurrentUser(walletAddress: string): boolean {
  return currentUserData?.walletAddress === walletAddress;
}
