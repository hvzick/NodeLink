import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCompressedPublicKey } from "../../backend/Encryption/SharedKey";

export async function refreshKeyData(setWalletAddress, setPublicKey, setPrivateKey, setCompressedPublicKey, setLoading) {
    try {
      const addr = await AsyncStorage.getItem('walletAddress');
      if (!addr) return;
      setWalletAddress((prev) => (prev !== addr ? addr : prev));
      const raw = await AsyncStorage.getItem(`crypto_key_pair_${addr}`);
      if (!raw) return;
      const keyPair = JSON.parse(raw);
      setPublicKey((prev) => (prev !== keyPair.publicKey ? keyPair.publicKey : prev));
      setPrivateKey((prev) => (prev !== keyPair.privateKey ? keyPair.privateKey : prev));
      const compressed = getCompressedPublicKey(keyPair.publicKey);
      setCompressedPublicKey((prev) => (prev !== compressed ? compressed : prev));
    } catch (e) {
      console.error('Key data error:', e);
    } finally {
      setLoading(false);
    }
  }
  