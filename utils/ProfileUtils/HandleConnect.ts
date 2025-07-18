// utils\ProfileUtils\HandleConnect.ts
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deriveSharedKeyWithUser } from "../../backend/Encryption/SharedKey";
import { SessionKeyStore } from "../../backend/Local database/AsyncStorage/KeyStorage/SessionKeyStore";

/**
 * Establishes a secure session by retrieving or deriving a shared key
 * with another user, and storing it in memory and persistent storage.
 *
 * @param recipientAddress Wallet address of the recipient
 * @returns true if the shared key was successfully retrieved or derived
 */
export async function handleConnect(
  recipientAddress: string
): Promise<boolean> {
  console.log(`🤝 Initiating connection with ${recipientAddress}...`);

  const storageKey = `shared_key_${recipientAddress}`;

  try {
    // Step 1: Try loading the shared key from AsyncStorage (persistent)
    let sharedKey = await AsyncStorage.getItem(storageKey);
    console.log(`Shared Key with ${recipientAddress} =`, sharedKey);

    // Step 2: If not found, derive a new shared key
    if (!sharedKey) {
      console.log(
        `Shared Key not found for ${recipientAddress}, deriving a new one...`
      );
      sharedKey = await deriveSharedKeyWithUser(recipientAddress);
      if (!sharedKey) throw new Error("Key derivation failed");

      await AsyncStorage.setItem(storageKey, sharedKey);
      console.log(`💾 Saved newly derived shared key to AsyncStorage.`);
    } else {
      console.log(`📦 Loaded shared key from AsyncStorage.`);
    }

    // Step 3: Save to shared session store
    SessionKeyStore.set(recipientAddress, sharedKey);
    console.log(`✅ Shared key cached in memory.`);

    return true;
  } catch (err) {
    console.error(`❌ Connection failed with ${recipientAddress}:`, err);
    Alert.alert(
      "Connection Failed",
      "Could not establish a secure session. The user's public key might be missing."
    );
    return false;
  }
}
