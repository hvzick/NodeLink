import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deriveSharedKeyWithUser } from "../../../backend/Encryption/SharedKey";

export function useUserAddressAndKeySync(
  receiverAddress: string,
  setUserAddress: (address: string | null) => void
) {
  useEffect(() => {
    const fetchUserAddress = async () => {
      const address = await AsyncStorage.getItem("walletAddress");
      setUserAddress(address ?? null);
      // Compare old and current private key
      if (address) {
        const raw = await AsyncStorage.getItem(`crypto_key_pair_${address}`);
        const old = await AsyncStorage.getItem(`old_private_key_${address}`);
        if (raw) {
          const keyPair = JSON.parse(raw);
          if (old && old !== keyPair.privateKey) {
            // Private key changed, re-derive shared secret
            const newSharedKey = await deriveSharedKeyWithUser(receiverAddress);
            if (newSharedKey) {
              await AsyncStorage.setItem(
                `shared_key_${receiverAddress}`,
                newSharedKey
              );
              console.log("🔑 Re-derived shared key after private key change");
            }
            // Optionally, remove the old key after use
            await AsyncStorage.removeItem(`old_private_key_${address}`);
          }
        }
      }
    };
    fetchUserAddress();
  }, [receiverAddress, setUserAddress]);
}
