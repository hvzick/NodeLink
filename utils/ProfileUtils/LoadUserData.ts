import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../backend/Supabase/Supabase";
import { UserData } from "../../backend/Supabase/RegisterUser";

// Fetch and cache user profile data
export const loadUserData = async (
  address: string,
  setUserData: (data: UserData | null) => void,
  setIsProfileLoading: (loading: boolean) => void
) => {
  setIsProfileLoading(true);
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", address)
      .single();

    if (data && !error) {
      const formattedUser: UserData = {
        walletAddress: data.wallet_address,
        username: data.username,
        name: data.name,
        avatar: data.avatar,
        bio: data.bio,
        created_at: data.created_at,
        publicKey: data.public_key,
      };
      setUserData(formattedUser);
      await AsyncStorage.setItem(
        `user_profile_${address}`,
        JSON.stringify(formattedUser)
      );
    } else {
      const cachedData = await AsyncStorage.getItem(`user_profile_${address}`);
      if (cachedData) {
        setUserData(JSON.parse(cachedData));
      } else {
        setUserData(null);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    setUserData(null);
  } finally {
    setIsProfileLoading(false);
  }
};
