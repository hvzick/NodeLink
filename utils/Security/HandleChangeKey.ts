import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateAndStoreKeys } from "../../backend/E2E-Encryption/KeyGen";
import { handleAndPublishKeys } from "../../backend/E2E-Encryption/HandleKeys";
import { SetStateAction } from "react";

export async function handleChangeKey(
  walletAddress: string | null,
  setActionLoading: {
    (value: SetStateAction<boolean>): void;
    (arg0: boolean): void;
  },
  setChangeSuccess: {
    (value: SetStateAction<boolean>): void;
    (arg0: boolean): void;
  },
  refreshKeyData: { (): Promise<void>; (): any }
) {
  if (!walletAddress) return;
  // Store old private key for later comparison
  const oldRaw = await AsyncStorage.getItem(`crypto_key_pair_${walletAddress}`);
  if (oldRaw) {
    const oldKeyPair = JSON.parse(oldRaw);
    await AsyncStorage.setItem(
      `old_private_key_${walletAddress}`,
      oldKeyPair.privateKey
    );
  }
  setActionLoading(true);
  setChangeSuccess(false);
  await generateAndStoreKeys(walletAddress); // always generate new key pair
  await handleAndPublishKeys(walletAddress); // upload new public key
  await refreshKeyData(); // refresh UI with new keys
  setActionLoading(false);
  setChangeSuccess(true);
}
