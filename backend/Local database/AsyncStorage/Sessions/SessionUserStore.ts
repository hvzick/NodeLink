// backend\Local database\AsyncStorage\Session/SessionUserStore.ts

import { UserData } from "../Types/UserData";

// In-memory session cache for fast access
const sessionUserDataMap = new Map<string, UserData>();

export const SessionUserStore = {
  /**
   * Store user data in session cache (memory).
   */
  set: (walletAddress: string, userData: UserData): void => {
    sessionUserDataMap.set(walletAddress, userData);
  },

  /**
   * Get user data from session cache (instant access).
   */
  get: (walletAddress: string): UserData | null => {
    return sessionUserDataMap.get(walletAddress) || null;
  },

  /**
   * Check if user data exists in session cache.
   */
  has: (walletAddress: string): boolean => {
    return sessionUserDataMap.has(walletAddress);
  },

  /**
   * Remove user data from session cache.
   */
  delete: (walletAddress: string): void => {
    sessionUserDataMap.delete(walletAddress);
  },

  /**
   * Clear all user data from session cache.
   */
  clear: (): void => {
    sessionUserDataMap.clear();
  },

  /**
   * Get all wallet addresses in session cache.
   */
  getAllWallets: (): string[] => {
    return Array.from(sessionUserDataMap.keys());
  },

  /**
   * Get all user data in session cache.
   */
  getAllUsers: (): UserData[] => {
    return Array.from(sessionUserDataMap.values());
  },
};
