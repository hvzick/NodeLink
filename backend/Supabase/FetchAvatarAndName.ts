// utils/ChatUtils/getUserProfile.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../backend/Supabase/Supabase'; // Adjust the path to your Supabase client

/**
 * Defines the structure for the profile data we want to fetch and cache.
 */
export interface UserProfileCache {
  name: string;
  avatar: string | null;
}

/**
 * Fetches the latest name and avatar for a user from Supabase,
 * caches the result in AsyncStorage, and returns the data.
 *
 * @param conversationId The conversation ID, expected to be in the format 'convo_WALLET_ADDRESS'.
 * @returns A promise that resolves to an object containing the user's name and avatar, or null if not found.
 */
export const fetchAndCacheUserProfile = async (
  conversationId: string
): Promise<UserProfileCache | null> => {
  const walletAddress = conversationId.replace('convo_', '');
  if (!walletAddress) {
    console.error('Could not extract wallet address from conversationId:', conversationId);
    return null;
  }

  const cacheKey = `user_profile_${walletAddress}`;

  try {
    // 1. Fetch fresh data from Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('name, avatar')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // 2. If data is found, cache it and return it
    if (data) {
      const userProfile: UserProfileCache = {
        name: data.name || 'Unknown User',
        avatar: data.avatar,
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(userProfile));
      console.log(`✅ Fetched and cached profile for ${walletAddress}`);
      return userProfile;
    }

    // 3. If no data from Supabase, try to get from cache as a fallback
    const cachedProfile = await AsyncStorage.getItem(cacheKey);
    if (cachedProfile) {
      console.log(`📱 Loaded profile from cache for ${walletAddress}`);
      return JSON.parse(cachedProfile);
    }

    // 4. If nothing is found anywhere
    console.warn(`🚫 No profile found in Supabase or cache for ${walletAddress}`);
    return null;

  } catch (error) {
    console.error(`❌ Failed to fetch or cache profile for ${walletAddress}:`, error);
    // On failure, still try to load from cache
    try {
        const cachedProfile = await AsyncStorage.getItem(cacheKey);
        if (cachedProfile) {
            console.log(`📱 Loaded profile from cache for ${walletAddress} after error.`);
            return JSON.parse(cachedProfile);
        }
    } catch(cacheError) {
        console.error(`❌ Failed to load from cache after initial error:`, cacheError);
    }
    return null;
  }
};
