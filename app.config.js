import 'dotenv/config';

export default {
  expo: {
    name: 'NodeLink',
    slug: 'NodeLink',
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },
};
