// backend\Supabase\RegisterUser.ts

import { supabase } from "./Supabase";
import { storeUserDataInStorage } from "../Local database/AsyncStorage/UserDataStorage/UtilityIndex";

// User interface
export interface UserData {
  walletAddress: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  created_at?: string;
  publicKey?: string;
}

// Default user data with better username generation
export const DEFAULT_USER_DATA: Omit<UserData, "walletAddress" | "created_at"> =
  {
    name: "NodeLink User",
    bio: "Im not being spied on",
    avatar: "default",
    username: `user${Math.random().toString(36).substring(2, 8)}${Date.now()
      .toString(36)
      .slice(-3)}`,
  };

/**
 * Registers a user if they don't already exist, and saves to storage
 *
 * @param userInfo User data to register
 * @returns Object containing user data and whether they're new
 */
export async function registerUser(userInfo: UserData): Promise<{
  error: any;
  user: UserData | null;
  isNew: boolean;
}> {
  try {
    console.log("🔍 Checking if user exists in Supabase...");

    // 🔍 Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", userInfo.walletAddress)
      .maybeSingle();

    if (fetchError) {
      return {
        error: fetchError,
        user: null,
        isNew: false,
      };
    }

    if (existingUser) {
      console.log("✅ User found in database");

      const user: UserData = {
        walletAddress: existingUser.wallet_address,
        username: existingUser.username,
        name: existingUser.name,
        avatar: existingUser.avatar,
        bio: existingUser.bio,
        created_at: existingUser.created_at,
        publicKey: existingUser.public_key || existingUser.publicKey,
      };

      // Store using the storage utility function
      await storeUserDataInStorage(user);
      console.log("✅ Existing user loaded and stored:", user);
      return {
        error: null,
        user,
        isNew: false,
      };
    }

    console.log("🆕 User not found - creating new user...");

    // 👤 Insert new user
    const insertData = {
      wallet_address: userInfo.walletAddress,
      username: userInfo.username,
      name: userInfo.name,
      avatar: userInfo.avatar,
      bio: userInfo.bio,
      ...(userInfo.publicKey && { public_key: userInfo.publicKey }),
    };

    const { data: newUser, error: insertError } = await supabase
      .from("profiles")
      .insert([insertData])
      .select()
      .single();

    if (insertError) {
      // Handle specific error cases
      if (insertError.code === "23505") {
        return {
          error: {
            message:
              "Username already exists. Please choose a different username.",
            code: insertError.code,
            details: insertError,
          },
          user: null,
          isNew: false,
        };
      }
      return {
        error: {
          message: `Insert error: ${insertError.message}`,
          code: insertError.code,
          details: insertError,
        },
        user: null,
        isNew: false,
      };
    }

    if (!newUser) {
      return {
        error: {
          message: "User creation failed: No data returned from database",
          code: "NO_DATA_ERROR",
        },
        user: null,
        isNew: false,
      };
    }

    const user: UserData = {
      walletAddress: newUser.wallet_address,
      username: newUser.username,
      name: newUser.name,
      avatar: newUser.avatar,
      bio: newUser.bio,
      created_at: newUser.created_at,
      publicKey: newUser.public_key || newUser.publicKey,
    };

    // Store using the storage utility function
    await storeUserDataInStorage(user);
    console.log("✅ New user registered and stored:", user);

    return {
      error: null,
      user,
      isNew: true,
    };
  } catch (err) {
    console.error("❌ Error registering user:", err);

    // Return error in consistent format
    return {
      error: {
        message: err instanceof Error ? err.message : "Unknown error occurred",
        code: (err as any)?.code || "UNKNOWN_ERROR",
        details: err,
      },
      user: null,
      isNew: false,
    };
  }
}

/**
 * Generate a unique username with timestamp to avoid collisions
 */
export function generateUniqueUsername(): string {
  const randomPart = Math.random().toString(36).substring(2, 8);
  const timestampPart = Date.now().toString(36).slice(-3);
  return `user${randomPart}${timestampPart}`;
}

/**
 * Validate user data before registration
 */
export function validateUserData(userData: Partial<UserData>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!userData.walletAddress) {
    errors.push("Wallet address is required");
  }

  if (!userData.username) {
    errors.push("Username is required");
  } else if (userData.username.length < 3) {
    errors.push("Username must be at least 3 characters long");
  } else if (userData.username.length > 50) {
    errors.push("Username must be less than 50 characters");
  }

  if (!userData.name) {
    errors.push("Name is required");
  } else if (userData.name.length > 100) {
    errors.push("Name must be less than 100 characters");
  }

  if (userData.bio && userData.bio.length > 500) {
    errors.push("Bio must be less than 500 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create user data with defaults
 */
export function createUserDataWithDefaults(
  walletAddress: string,
  overrides: Partial<UserData> = {}
): UserData {
  return {
    walletAddress,
    ...DEFAULT_USER_DATA,
    username: generateUniqueUsername(),
    ...overrides,
  };
}

/**
 * Update user profile in both Supabase and local storage
 */
export async function updateUserProfile(
  walletAddress: string,
  updates: Partial<Omit<UserData, "walletAddress" | "created_at">>
): Promise<UserData> {
  try {
    console.log("🔄 Updating user profile...");

    // Validate updates
    const validation = validateUserData({ walletAddress, ...updates });
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Update in Supabase
    const updateData = {
      ...(updates.username && { username: updates.username }),
      ...(updates.name && { name: updates.name }),
      ...(updates.avatar && { avatar: updates.avatar }),
      ...(updates.bio && { bio: updates.bio }),
      ...(updates.publicKey && { public_key: updates.publicKey }),
    };

    const { data: updatedUser, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("wallet_address", walletAddress)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Update error: ${updateError.message}`);
    }

    if (!updatedUser) {
      throw new Error("Profile update failed: No data returned from database");
    }

    const user: UserData = {
      walletAddress: updatedUser.wallet_address,
      username: updatedUser.username,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      created_at: updatedUser.created_at,
      publicKey: updatedUser.public_key || updatedUser.publicKey,
    };

    // Update local storage
    await storeUserDataInStorage(user);
    console.log("✅ User profile updated:", user);

    return user;
  } catch (err) {
    console.error("❌ Error updating user profile:", err);
    throw err;
  }
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      console.error("Error checking username availability:", error);
      return false;
    }

    return !data; // Available if no data found
  } catch (err) {
    console.error("Error checking username availability:", err);
    return false;
  }
}
