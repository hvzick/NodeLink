import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../../backend/Supabase/Supabase";
import {
  getCompressedPublicKey,
  deriveSharedKeyWithUser,
} from "../../../backend/Encryption/SharedKey";

export function useSyncPublicKey(receiverAddress: string) {
  useEffect(() => {
    const checkAndSyncPublicKey = async () => {
      try {
        // 1. Load local user profile for receiver
        const localProfileRaw = await AsyncStorage.getItem(
          `user_profile_${receiverAddress}`
        );
        let localPublicKey = null;
        if (localProfileRaw) {
          const localProfile = JSON.parse(localProfileRaw);
          // Use the correct property and compress it
          if (localProfile.public_key) {
            localPublicKey = getCompressedPublicKey(localProfile.public_key);
          } else if (localProfile.publicKey) {
            localPublicKey = getCompressedPublicKey(localProfile.publicKey);
          }
        }

        // 2. Fetch current public key from Supabase
        const { data, error } = await supabase
          .from("profiles")
          .select("public_key")
          .eq("wallet_address", receiverAddress)
          .single();
        if (error || !data?.public_key) {
          console.warn("Could not fetch public key from Supabase:", error);
          return;
        }
        // Compress the Supabase public key for comparison
        const supabasePublicKey = getCompressedPublicKey(data.public_key);

        // 3. Compare
        if (localPublicKey !== supabasePublicKey) {
          console.warn(
            "Public key mismatch detected. Reloading user data and re-deriving shared key."
          );
          // Reload user data and update local cache
          const { data: userData, error: userError } = await supabase
            .from("profiles")
            .select("*")
            .eq("wallet_address", receiverAddress)
            .single();
          if (!userError && userData) {
            await AsyncStorage.setItem(
              `user_profile_${receiverAddress}`,
              JSON.stringify(userData)
            );
          }
          // Re-derive and store the shared key
          const newSharedKey = await deriveSharedKeyWithUser(receiverAddress);
          if (newSharedKey) {
            await AsyncStorage.setItem(
              `shared_key_${receiverAddress}`,
              newSharedKey
            );
            console.log(
              "🔑 Re-derived and stored new shared key for",
              receiverAddress
            );
          }
        }
      } catch (err) {
        console.error("Error checking/syncing public key:", err);
      }
    };
    checkAndSyncPublicKey();
  }, [receiverAddress]);
}
