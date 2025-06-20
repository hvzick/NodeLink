import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, DEFAULT_USER_DATA, registerUser } from './RegisterUser';

// ✅ Use EXPO_PUBLIC_ env vars if using Expo
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function handleUserData(): Promise<void> {
  try {
    console.log("🔍 Starting Supabase user data handling...");

    const walletAddress = await AsyncStorage.getItem("walletAddress");

    if (!walletAddress) {
      console.log("⚠️ No wallet address found in storage.");
      return;
    }

    // 🔍 Check if user exists in Supabase
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle(); // safe alternative to .single()

    if (error) {
      throw error;
    }

    let userData: UserData;

    if (user) {
      console.log("✅ User found in Supabase:");
      // Convert DB format to our format
      userData = {
        walletAddress: user.wallet_address,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio
      };
    } else {
      console.log("👤 User not found — registering new one...");

      const newUserData: UserData = {
        walletAddress,
        ...DEFAULT_USER_DATA
      };

      const { user: newUser } = await registerUser(newUserData);

      console.log("✅ New user registered:");
      userData = newUser;
    }

    // ✅ Store the final userData (found or new) into AsyncStorage
    await AsyncStorage.setItem("userData", JSON.stringify(userData));
    console.log("📦 User data saved to AsyncStorage");

  } catch (err) {
    console.error("❌ Error handling Supabase user data:", err);
  }
}
