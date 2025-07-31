// backend/Supabase/RegisterUser.ts

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
    username: "temp_user", // Will be replaced by generateUniqueUsername()
  };

/**
 * Generate a unique username with collision checking
 */
export async function generateUniqueUsername(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const randomPart = Math.random().toString(36).substring(2, 8);
    const timestampPart = Date.now().toString(36).slice(-3);
    const username = `user${randomPart}${timestampPart}`;

    if (await isUsernameAvailable(username)) {
      return username;
    }
    attempts++;

    // Small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Final fallback with UUID-like approach
  return `user${Date.now()}${Math.random().toString(36).substring(2, 5)}`;
}

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
    console.log("Checking if user exists in Supabase...");

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", userInfo.walletAddress)
      .maybeSingle();

    if (fetchError) {
      return {
        error: {
          message: `Database fetch error: ${fetchError.message}`,
          code: fetchError.code,
          details: fetchError,
        },
        user: null,
        isNew: false,
      };
    }

    if (existingUser) {
      console.log("User found in database");

      // Handle null values from database
      const user: UserData = {
        walletAddress: existingUser.wallet_address,
        username: existingUser.username || (await generateUniqueUsername()),
        name: existingUser.name || DEFAULT_USER_DATA.name,
        avatar: existingUser.avatar || DEFAULT_USER_DATA.avatar,
        bio: existingUser.bio || DEFAULT_USER_DATA.bio,
        created_at: existingUser.created_at,
        publicKey: existingUser.public_key,
      };

      // If we had to generate defaults, update the database
      if (
        !existingUser.username ||
        !existingUser.name ||
        !existingUser.bio ||
        !existingUser.avatar
      ) {
        console.log("Updating user with missing required fields...");
        try {
          const updateData = {
            ...(!existingUser.username && { username: user.username }),
            ...(!existingUser.name && { name: user.name }),
            ...(!existingUser.bio && { bio: user.bio }),
            ...(!existingUser.avatar && { avatar: user.avatar }),
          };

          const { error: updateError } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("wallet_address", user.walletAddress);

          if (updateError) {
            console.warn(
              "⚠️ Failed to update user with defaults:",
              updateError
            );
          } else {
            console.log("Updated user with default values");
          }
        } catch (updateError) {
          console.warn("⚠️ Error updating user defaults:", updateError);
        }
      }

      // Store using the storage utility function
      try {
        await storeUserDataInStorage(user);
        console.log("Existing user loaded and stored:", user);
      } catch (storageError) {
        console.warn("⚠️ Failed to store user data locally:", storageError);
      }

      return {
        error: null,
        user,
        isNew: false,
      };
    }

    console.log("🆕 User not found - creating new user...");

    // Validate user data before proceeding
    const validation = validateUserData(userInfo);
    if (!validation.isValid) {
      return {
        error: {
          message: `Validation failed: ${validation.errors.join(", ")}`,
          code: "VALIDATION_ERROR",
        },
        user: null,
        isNew: false,
      };
    }

    // Generate unique username if not provided or if it's the default
    let finalUsername = userInfo.username;
    if (!finalUsername || finalUsername === "temp_user") {
      finalUsername = await generateUniqueUsername();
    } else {
      // Check if provided username is available
      const isAvailable = await isUsernameAvailable(finalUsername);
      if (!isAvailable) {
        return {
          error: {
            message:
              "Username already exists. Please choose a different username.",
            code: "USERNAME_TAKEN",
          },
          user: null,
          isNew: false,
        };
      }
    }

    // Insert new user
    const insertData = {
      wallet_address: userInfo.walletAddress,
      username: finalUsername,
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
      publicKey: newUser.public_key,
    };

    // Store using the storage utility function
    try {
      await storeUserDataInStorage(user);
      console.log("New user registered and stored:", user);
    } catch (storageError) {
      console.warn("⚠️ Failed to store user data locally:", storageError);
    }

    return {
      error: null,
      user,
      isNew: true,
    };
  } catch (err) {
    console.error("❌ Error registering user:", err);

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
 * Validate user data before registration with null handling
 */
export function validateUserData(userData: Partial<UserData>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check wallet address
  if (
    !userData.walletAddress ||
    typeof userData.walletAddress !== "string" ||
    userData.walletAddress.trim() === ""
  ) {
    errors.push("Valid wallet address is required");
  }

  // Check username with null handling
  if (
    !userData.username ||
    userData.username === null ||
    typeof userData.username !== "string" ||
    userData.username.trim() === ""
  ) {
    errors.push("Username is required");
  } else if (userData.username.length < 3) {
    errors.push("Username must be at least 3 characters long");
  } else if (userData.username.length > 50) {
    errors.push("Username must be less than 50 characters");
  } else if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
    errors.push("Username can only contain letters, numbers, and underscores");
  }

  // Check name with null handling
  if (
    !userData.name ||
    userData.name === null ||
    typeof userData.name !== "string" ||
    userData.name.trim() === ""
  ) {
    errors.push("Name is required");
  } else if (userData.name.length > 100) {
    errors.push("Name must be less than 100 characters");
  }

  // Check bio (allow null/empty)
  if (
    userData.bio !== null &&
    userData.bio !== undefined &&
    typeof userData.bio === "string" &&
    userData.bio.length > 500
  ) {
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
export async function createUserDataWithDefaults(
  walletAddress: string,
  overrides: Partial<UserData> = {}
): Promise<UserData> {
  const uniqueUsername = await generateUniqueUsername();

  return {
    walletAddress,
    ...DEFAULT_USER_DATA,
    username: uniqueUsername,
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
    console.log("Updating user profile...");

    // Validate updates
    const validation = validateUserData({ walletAddress, ...updates });
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Check username availability if username is being updated
    if (updates.username) {
      const isAvailable = await isUsernameAvailable(updates.username);
      if (!isAvailable) {
        throw new Error(
          "Username already exists. Please choose a different username."
        );
      }
    }

    // Update in Supabase
    const updateData = {
      ...(updates.username && { username: updates.username }),
      ...(updates.name && { name: updates.name }),
      ...(updates.avatar && { avatar: updates.avatar }),
      ...(updates.bio !== undefined && { bio: updates.bio }),
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
      publicKey: updatedUser.public_key,
    };

    // Update local storage
    try {
      await storeUserDataInStorage(user);
      console.log("User profile updated:", user);
    } catch (storageError) {
      console.warn("⚠️ Failed to update local storage:", storageError);
    }

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
    if (!username || username.length < 3) {
      return false;
    }

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
