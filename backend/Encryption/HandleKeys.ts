// utils/Auth/handleKeys.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../backend/Supabase/Supabase';
import { generateAndStoreKeys } from './KeyGen';

/**
 * Load the Base64-encoded key pair from local storage.
 */
const loadKeyPairFromStorage = async (walletAddress: string): Promise<{ publicKey: string; privateKey: string } | null> => {
  try {
    const stored = await AsyncStorage.getItem(`crypto_key_pair_${walletAddress}`);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("❌ Failed to load key pair:", e);
    return null;
  }
};

export const handleAndPublishKeys = async (walletAddress: string): Promise<boolean> => {
  try {
    if (!walletAddress) throw new Error("Wallet address is required.");

    let keyPair = await loadKeyPairFromStorage(walletAddress);
    if (!keyPair) {
      console.log("🔐 No local key found. Generating...");
      keyPair = await generateAndStoreKeys(walletAddress);
    }

    if (!keyPair) throw new Error("Key generation/storage failed.");

    console.log("✅ Public key ready to upload:", keyPair.publicKey);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        wallet_address: walletAddress,
        public_key: keyPair.publicKey,
      }, { onConflict: 'wallet_address' });

    if (error) throw error;

    console.log("✅ Public key uploaded.");
    return true;
  } catch (error) {
    console.error("❌ handleAndPublishKeys error:", error);
    return false;
  }
};
