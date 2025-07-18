// utils/ProfileUtils/HandleUserData.ts

import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./Supabase";
import { UserData, DEFAULT_USER_DATA, registerUser } from "./RegisterUser";
import { storeUserDataInStorage } from "../Local database/AsyncStorage/Utilities/UtilityIndex";

export async function handleUserData(): Promise<UserData | null> {
  try {
    console.log("🔍 Checking Supabase user profile...");

    const walletAddress = await AsyncStorage.getItem("walletAddress");

    if (!walletAddress) {
      console.warn("⚠️ No wallet address found in AsyncStorage.");
      return null;
    }

    // 1. Check if user exists in Supabase and GET ALL DATA
    const { data: existingUser, error } = await supabase
      .from("profiles")
      .select("*") // Get ALL user data, not just wallet_address
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (error) {
      console.error("❌ Error querying Supabase:", error);
      throw error;
    }

    let userData: UserData;

    if (existingUser) {
      console.log("✅ User already exists in Supabase.");

      // Map the REAL user data from Supabase
      userData = {
        walletAddress: existingUser.wallet_address,
        username: existingUser.username,
        name: existingUser.name,
        avatar: existingUser.avatar,
        bio: existingUser.bio,
        created_at: existingUser.created_at,
        publicKey: existingUser.public_key || existingUser.publicKey,
      };
    } else {
      console.log("🆕 User not found — registering new user...");
      const newUser: UserData = {
        walletAddress,
        ...DEFAULT_USER_DATA,
      };

      const result = await registerUser(newUser);

      if (result.error || !result.user) {
        throw new Error(result.error?.message || "User registration failed");
      }

      userData = result.user;
    }

    // 2. Store user data locally
    await storeUserDataInStorage(userData);

    console.log("✅ User data handled successfully");
    return userData;
  } catch (err) {
    console.error("❌ handleUserData error:", err);
    Alert.alert("User Init Failed", "Unable to verify or create user profile.");
    return null;
  }
}
