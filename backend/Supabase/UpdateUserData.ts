import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config(); // Load environment variables from .env

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const updateUser = async () => {
  const walletAddress = '0xabc123...'; // 🔁 Replace with the actual wallet address

  const { data, error } = await supabase
    .from('profiles') // ✅ Your table name
    .update({
      bio: 'Blockchain queen 👑',
      avatar: 'https://example.com/new-avatar.png',
    })
    .eq('wallet_address', walletAddress)
    .select(); // 👈 Optional: returns the updated row(s)

  if (error) {
    console.error('❌ Update error:', error.message);
  } else {
    console.log('✅ Updated user:', data);
  }
};

updateUser();
