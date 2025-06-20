import { supabase } from './Supabase';

const deleteUserByWallet = async (walletAddress: string) => {
  // Step 1: Fetch the user's avatar path from the DB
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('avatar')
    .eq('wallet_address', walletAddress)
    .single();

  if (fetchError || !profile) {
    console.error('❌ User not found or fetch error:', fetchError?.message);
    return;
  }

  // Step 2: Extract the file name from the avatar URL (if present)
  const avatarUrl: string = profile.avatar;
  const avatarPath = avatarUrl?.split('/storage/v1/object/public/avatars/')[1];

  if (avatarPath) {
    const { error: deleteImageError } = await supabase
      .storage
      .from('avatars')
      .remove([avatarPath]);

    if (deleteImageError) {
      console.warn('⚠️ Failed to delete avatar image:', deleteImageError.message);
    } else {
      console.log('🗑️ Avatar image deleted');
    }
  }

  // Step 3: Delete the profile from the database
  const { error: deleteUserError } = await supabase
    .from('profiles')
    .delete()
    .eq('wallet_address', walletAddress);

  if (deleteUserError) {
    console.error('❌ Failed to delete user profile:', deleteUserError.message);
  } else {
    console.log('✅ User profile deleted successfully');
  }
};

// 🔁 Replace with the wallet address you want to delete
deleteUserByWallet('0xabc123...');
