import AsyncStorage from "@react-native-async-storage/async-storage";
import { base64 } from "@scure/base";
import { p256 } from "@noble/curves/p256";
import { supabase } from "../Supabase/Supabase";
import { generateAndStoreKeys } from "./KeyGen";

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

/**
 * Load key pair from AsyncStorage.
 */
export const loadKeyPairFromStorage = async (
  walletAddress: string
): Promise<{ publicKey: string; privateKey: string } | null> => {
  try {
    const raw = await AsyncStorage.getItem(`crypto_key_pair_${walletAddress}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("❌ Failed to load key pair:", e);
    return null;
  }
};

/**
 * Validate that the public key matches the private key.
 * Compares uncompressed derived public key to stored key.
 */
export const isValidECDHKeyPair = (
  publicKeyB64: string,
  privateKeyB64: string
): boolean => {
  try {
    const privateKeyBytes = base64.decode(privateKeyB64);
    const publicKeyBytes = base64.decode(publicKeyB64);

    const derivedPublicKey = p256.getPublicKey(privateKeyBytes, false); // 🔓 Uncompressed

    console.log("Stored public key (hex):", toHex(publicKeyBytes));
    console.log("Derived public key (hex):", toHex(derivedPublicKey));

    if (publicKeyBytes.length !== derivedPublicKey.length) return false;

    for (let i = 0; i < publicKeyBytes.length; i++) {
      if (publicKeyBytes[i] !== derivedPublicKey[i]) return false;
    }

    return true;
  } catch (e) {
    console.error("❌ Invalid key pair format:", e);
    return false;
  }
};

/**
 * Ensures the user has a valid key pair and uploads the public key to Supabase.
 */
export const handleAndPublishKeys = async (
  walletAddress: string
): Promise<boolean> => {
  try {
    if (!walletAddress) throw new Error("Wallet address is required.");

    let keyPair = await loadKeyPairFromStorage(walletAddress);

    if (keyPair) {
      console.log("Key pair found in local storage for:", walletAddress);
    } else {
      console.log("No local keys found. Generating new key pair...");
      keyPair = await generateAndStoreKeys(walletAddress);
      if (keyPair) console.log("New key pair generated.");
      else console.log("❌ Key generation failed.");
    }

    if (!keyPair) throw new Error("Failed to generate or retrieve key pair.");

    const isValid = isValidECDHKeyPair(keyPair.publicKey, keyPair.privateKey);
    if (!isValid) throw new Error("Key pair is invalid or mismatched.");

    console.log("Valid public key to upload:", keyPair.publicKey);

    const { error } = await supabase.from("profiles").upsert(
      {
        wallet_address: walletAddress,
        public_key: keyPair.publicKey,
      },
      { onConflict: "wallet_address" }
    );

    if (error) throw error;

    console.log("Public key uploaded successfully.");
    return true;
  } catch (error) {
    console.error("❌ handleAndPublishKeys error:", error);
    return false;
  }
};

/**
 * One-time repair: re-derive and re-upload uncompressed public key.
 */
export const fixKeyPair = async (walletAddress: string) => {
  try {
    const raw = await AsyncStorage.getItem(`crypto_key_pair_${walletAddress}`);
    if (!raw) throw new Error("Key pair not found in storage.");

    const keyPair = JSON.parse(raw);
    const privateKeyBytes = base64.decode(keyPair.privateKey);
    const publicKeyBytes = p256.getPublicKey(privateKeyBytes, false); // ensure uncompressed
    const publicKey = base64.encode(publicKeyBytes);

    keyPair.publicKey = publicKey;

    await AsyncStorage.setItem(
      `crypto_key_pair_${walletAddress}`,
      JSON.stringify(keyPair)
    );

    const { error } = await supabase.from("profiles").upsert(
      {
        wallet_address: walletAddress,
        public_key: publicKey,
      },
      { onConflict: "wallet_address" }
    );

    if (error) throw error;

    console.log("Fixed and re-uploaded public key for:", walletAddress);
  } catch (e) {
    console.error("❌ Failed to fix key pair:", e);
  }
};

export { generateAndStoreKeys } from "./KeyGen";
