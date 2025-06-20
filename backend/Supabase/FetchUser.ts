import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config(); // Load .env variables

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const fetchUser = async (input: string) => {
  let query;

  if (input.startsWith('@')) {
    // Search by username (remove the '@')
    const username = input.slice(1);
    query = supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single(); // Expect exactly one match
  } else {
    // Search by wallet address
    query = supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', input)
      .single();
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Fetch error:', error.message);
  } else {
    console.log('✅ User found:', data);
  }
};

// 👇 Test with wallet address or @username
fetchUser('0xabc123...');
fetchUser('@al1232332ce123');
