import AsyncStorage from "@react-native-async-storage/async-storage";
import { validateKeyPair } from "../../backend/E2E-Encryption/KeyGen";
import { SetStateAction } from "react";

export async function handleValidateKeys(
  walletAddress: string | null,
  setKeysValid: {
    (value: SetStateAction<boolean>): void;
    (arg0: boolean): void;
  }
) {
  if (!walletAddress) return;
  const raw = await AsyncStorage.getItem(`crypto_key_pair_${walletAddress}`);
  if (raw) {
    const keyPair = JSON.parse(raw);
    const valid = validateKeyPair(keyPair.publicKey, keyPair.privateKey);
    setKeysValid(valid);
  } else {
    setKeysValid(false);
  }
}
