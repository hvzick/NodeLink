// utils/MyProfileUtils/CheckUsernameExists.ts
import { supabase } from '../../backend/Supabase/Supabase';

export const checkUsernameExists = async (username: string, currentWallet: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('wallet_address')
    .eq('username', username.toLowerCase())
    .neq('wallet_address', currentWallet) // Exclude current user

  if (error) {
    console.error('Error checking username existence:', error.message);
    return false;
  }

  return data.length > 0;
};
