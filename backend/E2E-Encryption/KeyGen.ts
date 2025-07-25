import AsyncStorage from "@react-native-async-storage/async-storage";
import { p256 } from "@noble/curves/p256";
import { base64 } from "@scure/base";

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

/**
 * Generates an ECDH P-256 key pair and returns base64-encoded keys.
 * Uses uncompressed public key (65 bytes, starts with 0x04)
 */
const generateKeyPair = (): { publicKey: string; privateKey: string } => {
  console.log("Generating new ECDH key pair...");
  const privateKeyBytes = p256.utils.randomPrivateKey(); // 32 bytes
  const publicKeyBytes = p256.getPublicKey(privateKeyBytes, false); // 👈 Uncompressed

  console.log("Raw private key:", toHex(privateKeyBytes));
  console.log("Raw public key (uncompressed):", toHex(publicKeyBytes));

  const privateKey = base64.encode(privateKeyBytes);
  const publicKey = base64.encode(publicKeyBytes);

  console.log("Encoded private key (b64):", privateKey);
  console.log("Encoded public key (b64):", publicKey);

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
    console.log(`Saving key pair to storage for wallet: ${walletAddress}`);
    await AsyncStorage.setItem(
      `crypto_key_pair_${walletAddress}`,
      JSON.stringify(keyPair)
    );
    console.log("Key pair saved to AsyncStorage.");
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
    console.log("Key generation and storage complete.");
    return keyPair;
  } catch (error) {
    console.error("❌ Failed to generate/store key pair:", error);
    return null;
  }
};

export function validateKeyPair(
  publicKeyB64: string,
  privateKeyB64: string
): boolean {
  try {
    const privateKeyBytes = base64.decode(privateKeyB64);
    const publicKeyBytes = base64.decode(publicKeyB64);
    const derivedPublicKey = p256.getPublicKey(privateKeyBytes, false); // uncompressed
    if (publicKeyBytes.length !== derivedPublicKey.length) return false;
    for (let i = 0; i < publicKeyBytes.length; i++) {
      if (publicKeyBytes[i] !== derivedPublicKey[i]) return false;
    }
    return true;
  } catch {
    return false;
  }
}
