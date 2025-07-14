// utils/ProfileUtils/HandleConnect.ts

import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deriveSharedKeyWithUser } from '../../backend/Encryption/SharedKey';

// In-memory session key cache
const sessionKeys = new Map<string, string>();

/**
 * Establishes a secure session by retrieving or deriving a shared key.
 * @param recipientAddress The wallet address of the user to connect with.
 * @returns True if connection and key derivation succeeded.
 */
export async function handleConnect(recipientAddress: string): Promise<boolean> {
  console.log(`🤝 Initiating connection with ${recipientAddress}...`);

  const storageKey = `shared_key_${recipientAddress}`;

  try {
    // 1. Try to load from AsyncStorage
    let sharedKey = await AsyncStorage.getItem(storageKey);

    console.log('Shared Key with ', recipientAddress, ' = ', sharedKey);

    if (sharedKey) {
      console.log(`📦 Loaded shared key from AsyncStorage: ${sharedKey}`);
    } else {
      // 2. If not found, derive and save it
      sharedKey = await deriveSharedKeyWithUser(recipientAddress);
      if (!sharedKey) throw new Error("Key derivation failed.");
    }

    // 3. Cache it in memory
    sessionKeys.set(recipientAddress, sharedKey);
    console.log(`✅ Shared key stored in memory for ${recipientAddress}`);
    return true;

  } catch (err) {
    console.error(`❌ Connection failed with ${recipientAddress}:`, err);
    Alert.alert('Connection Failed', 'Could not establish a secure session. Please try again.');
    return false;
  }
}

/**
 * Retrieve the shared key string for a specific recipient.
 * @param recipientAddress The wallet address of the user.
 * @returns The shared key (hex string) or undefined.
 */
export function getSharedKeyForUser(recipientAddress: string): string | undefined {
  return sessionKeys.get(recipientAddress);
}
