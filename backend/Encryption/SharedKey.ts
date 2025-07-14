import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../Supabase/Supabase';
import { p256 } from '@noble/curves/p256';
import { base64 } from '@scure/base';
import { bytesToHex } from '@noble/curves/abstract/utils';

// Helper: Convert Uint8Array to hex string
const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

export async function deriveSharedKeyWithUser(
  recipientAddress: string
): Promise<string | null> {
  try {
    console.log(`🤝 Initiating connection with ${recipientAddress}...`);
    console.log('trbycenxd');

    // 1. Load your own wallet address
    const ownAddress = await AsyncStorage.getItem('walletAddress');
    if (!ownAddress) throw new Error("Current user's wallet address not found.");

    // 2. Load own key pair from storage
    const ownKeyPairStored = await AsyncStorage.getItem(`crypto_key_pair_${ownAddress}`);
    if (!ownKeyPairStored) throw new Error("Could not find own key pair in local storage.");
    const ownKeyPairParsed = JSON.parse(ownKeyPairStored);
    const ownPrivateKeyBytes = base64.decode(ownKeyPairParsed.privateKey);

    console.log("📦 Private key length:", ownPrivateKeyBytes.length);
    console.log("🔐 Private key (hex):", toHex(ownPrivateKeyBytes));

    // 3. Fetch recipient public key from Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('public_key')
      .eq('wallet_address', recipientAddress)
      .single();

    if (error || !data?.public_key) {
      throw new Error(`Could not fetch public key for ${recipientAddress}.`);
    }

    const theirPublicKeyUncompressed = base64.decode(data.public_key);
    console.log("📦 Public key length:", theirPublicKeyUncompressed.length);
    console.log("🔐 Public key (hex):", toHex(theirPublicKeyUncompressed));
    console.log("🔐 Public key first byte (should be 0x04):", theirPublicKeyUncompressed[0]);

    // 4. Validate public key is on curve
    console.log("🔬 Validating public key on curve...");
    const point = p256.ProjectivePoint.fromHex(theirPublicKeyUncompressed);
    console.log("✅ Public key is valid on the curve.");

    // 5. Compress it for shared secret derivation
    const theirPublicKeyCompressed = point.toRawBytes(true);
    console.log("📎 Compressed public key byte 0 (should be 0x02 or 0x03):", theirPublicKeyCompressed[0]);

    const fullSharedSecret = p256.getSharedSecret(ownPrivateKeyBytes, theirPublicKeyCompressed);
    console.log("🔑 Full shared secret:", toHex(fullSharedSecret));

    const sharedSecret = fullSharedSecret.slice(1); // drop prefix
    const sharedSecretHex = toHex(sharedSecret);
    console.log("✨ Final shared secret (x-only):", sharedSecretHex);

    return sharedSecretHex;

  } catch (error) {
    console.error("❌ Error in deriveAndStoreSharedKey:", error);
    return null;
  }
}