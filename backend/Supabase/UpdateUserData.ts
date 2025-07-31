import { supabase } from "./Supabase";

interface UserProfileUpdate {
  name?: string;
  username?: string;
  bio?: string;
  avatar?: string;
}

export const updateSupabaseUser = async (
  walletAddress: string,
  updates: UserProfileUpdate
) => {
  if (!walletAddress) {
    console.error(
      "Wallet address is required to update user profile in Supabase."
    );
    return { data: null, error: { message: "Wallet address is missing." } };
  }

  const { data, error } = await supabase
    .from("profiles") // Your table name
    .update(updates)
    .eq("wallet_address", walletAddress)
    .select(); // Optional: returns the updated row(s)

  if (error) {
    console.error("❌ Supabase Update Error:", error.message);
  } else {
    console.log("Supabase User Updated");
  }
  return { data, error };
};
