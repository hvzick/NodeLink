// utils/Auth/generateKeys.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { p256 } from '@noble/curves/p256';
import { base64 } from '@scure/base';

/**
 * Generates an ECDH P-256 key pair and returns base64-encoded keys.
 */
const generateKeyPair = (): { publicKey: string; privateKey: string } => {
  const privateKeyBytes = p256.utils.randomPrivateKey(); // 32 bytes
  const publicKeyBytes = p256.getPublicKey(privateKeyBytes); // 65 bytes (uncompressed)

  const privateKey = base64.encode(privateKeyBytes);
  const publicKey = base64.encode(publicKeyBytes);

  return { publicKey, privateKey };
};

/**
 * Saves a key pair to AsyncStorage under a wallet address.
 */
const saveKeyPairToStorage = async (
  walletAddress: string,
  keyPair: { publicKey: string; privateKey: string }
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      `crypto_key_pair_${walletAddress}`,
      JSON.stringify(keyPair)
    );
    console.log(`✅ Key pair saved for ${walletAddress}`);
  } catch (error) {
    console.error("❌ Failed to save key pair:", error);
    throw new Error("Could not save keys to storage.");
  }
};

/**
 * Generates a key pair and stores it locally.
 */
export const generateAndStoreKeys = async (
  walletAddress: string
): Promise<{ publicKey: string; privateKey: string } | null> => {
  try {
    const keyPair = generateKeyPair();
    await saveKeyPairToStorage(walletAddress, keyPair);
    return keyPair;
  } catch (error) {
    console.error("❌ Failed to generate/store key pair:", error);
    return null;
  }
};
