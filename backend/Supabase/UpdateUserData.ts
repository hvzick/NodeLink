import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);
if (process.env.EXPO_PUBLIC_SUPABASE_URL! || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!) {
  console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

interface UserProfileUpdate {
  name?: string;
  username?: string;
  bio?: string;
  avatar?: string;
}

export const updateSupabaseUser = async (walletAddress: string, updates: UserProfileUpdate) => {
  if (!walletAddress) {
    console.error('Wallet address is required to update user profile in Supabase.');
    return { data: null, error: { message: 'Wallet address is missing.' } };
  }

  const { data, error } = await supabase
    .from('profiles') // Your table name
    .update(updates)
    .eq('wallet_address', walletAddress)
    .select(); // Optional: returns the updated row(s)

  if (error) {
    console.error('❌ Supabase Update Error:', error.message);
  } else {
    console.log('✅ Supabase User Updated:', data);
  }
  return { data, error };
};