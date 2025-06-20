import { supabase } from './Supabase';

/**
 * Search for a user by username (prefixed with '@') or wallet address.
 * Returns user data if found, otherwise returns null.
 */
export const searchUser = async (input: string) => {
  try {
    let query;

    if (input.startsWith('@')) {
      // Case-insensitive username search (strip '@' and convert to lowercase)
      const username = input.slice(1).toLowerCase();
      query = supabase
        .from('profiles')
        .select('*')
        .ilike('username', username) // case-insensitive match
        .single();
    } else {
      // Exact match on wallet address
      query = supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', input)
        .single();
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('❌ User not found or error:', error?.message);
      return null;
    }

    console.log('✅ User found:', data);
    return data;

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return null;
  }
};
