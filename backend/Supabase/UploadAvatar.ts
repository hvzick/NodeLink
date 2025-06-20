import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const uploadImageAndUpdateUser = async () => {
  const wallet = '0xabc123...';

  // Path to image on disk
  const filePath = path.resolve(__dirname, 'avatar.JPG');
  const fileBuffer = fs.readFileSync(filePath);

  // Generate a unique filename
  const fileName = `${wallet}_${Date.now()}.jpg`;

  // Upload to Supabase Storage bucket 'avatars'
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) {
    console.error('❌ Upload error:', uploadError.message);
    return;
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  const avatarUrl = publicUrlData.publicUrl;

  // Update user's avatar URL in DB
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar: avatarUrl })
    .eq('wallet_address', wallet)
    .select();

  if (error) {
    console.error('❌ DB update error:', error.message);
  } else {
    console.log('✅ Avatar updated:', data);
  }
};

uploadImageAndUpdateUser();
