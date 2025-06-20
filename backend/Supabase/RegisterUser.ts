import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

// User interface
export interface UserData {
  walletAddress: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
}

// Default user data
export const DEFAULT_USER_DATA: Omit<UserData, 'walletAddress'> = {
  name: "NodeLink User",
  bio: "Im not being spied on",
  avatar: "default",
  username: "user" + Math.random().toString(36).substring(2, 8)
};

/**
 * Registers a user if they don’t already exist, and saves to AsyncStorage
 */
export async function registerUser(
  userInfo: UserData
): Promise<{ user: UserData; isNew: boolean }> {
  try {
    // 🔍 Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', userInfo.walletAddress)
      .maybeSingle();

    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);

    if (existingUser) {
      const user: UserData = {
        walletAddress: existingUser.wallet_address,
        username: existingUser.username,
        name: existingUser.name,
        avatar: existingUser.avatar,
        bio: existingUser.bio,
      };

      await AsyncStorage.setItem('userData', JSON.stringify(user));
      console.log("✅ Existing user loaded and stored:", user);
      return { user, isNew: false };
    }

    // 👤 Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          wallet_address: userInfo.walletAddress,
          username: userInfo.username,
          name: userInfo.name,
          avatar: userInfo.avatar,
          bio: userInfo.bio,
        }
      ])
      .select()
      .single();

    if (insertError) throw new Error(`Insert error: ${insertError.message}`);

    const user: UserData = {
      walletAddress: newUser.wallet_address,
      username: newUser.username,
      name: newUser.name,
      avatar: newUser.avatar,
      bio: newUser.bio,
    };

    await AsyncStorage.setItem('userData', JSON.stringify(user));
    console.log("✅ New user registered and stored:");

    return { user, isNew: true };

  } catch (err) {
    console.error("❌ Error registering user:", err);
    throw err;
  }
}
