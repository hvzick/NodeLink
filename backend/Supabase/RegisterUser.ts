import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const registerUser = async () => {
  const { data, error } = await supabase
    .from('profiles') 
    .insert([
      {
        wallet_address: '0x122abc...',
        name: 'HAzik',
        username: '@edkf',
        bio: 'I\'m using Nodelink',
        avatar: '',
      },
    ]);

  if (error) {
    console.error('❌ Insert error (full):', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ User registered:', data);
  }
};

registerUser();
