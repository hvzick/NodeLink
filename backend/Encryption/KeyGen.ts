// utils/Auth/generateKeys.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { p256 } from '@noble/curves/p256';
import { base64 } from '@scure/base'; // for encoding

const generateKeyPair = async (): Promise<{ publicKey: string; privateKey: string }> => {
  try {
    const privateKeyBytes = p256.utils.randomPrivateKey(); // Uint8Array
    const publicKeyBytes = p256.getPublicKey(privateKeyBytes);

    const privateKey = base64.encode(privateKeyBytes);
    const publicKey = base64.encode(publicKeyBytes);

    return { publicKey, privateKey };
  } catch (error) {
    console.error("❌ Key pair generation failed:", error);
    throw new Error("Could not generate cryptographic keys.");
  }
};

const saveKeyPairToStorage = async (walletAddress: string, keyPair: { publicKey: string; privateKey: string }) => {
  try {
    await AsyncStorage.setItem(`crypto_key_pair_${walletAddress}`, JSON.stringify(keyPair));
    console.log(`✅ Key pair for ${walletAddress} saved.`);
  } catch (error) {
    console.error("❌ Failed to save key pair:", error);
    throw new Error("Could not save keys.");
  }
};

export const generateAndStoreKeys = async (walletAddress: string): Promise<{ publicKey: string; privateKey: string } | null> => {
  try {
    const keyPair = await generateKeyPair();
    await saveKeyPairToStorage(walletAddress, keyPair);
    return keyPair;
  } catch (error) {
    console.error("❌ Failed to generate/store keys:", error);
    return null;
  }
};
