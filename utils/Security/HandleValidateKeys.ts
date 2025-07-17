import AsyncStorage from "@react-native-async-storage/async-storage";
import { validateKeyPair } from "../../backend/Encryption/KeyGen";

export async function handleValidateKeys(walletAddress, setKeysValid) {
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