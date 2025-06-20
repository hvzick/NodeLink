// fetchProfiles.ts
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load variables from .env
config();

// Use environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const fetchProfiles = async () => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) console.error('❌ Error:', error.message);
  else console.log('✅ Profiles:', data);
};

fetchProfiles();
