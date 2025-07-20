// backend/Encryption/VerifyMessageSignature.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message } from "../Local database/SQLite/MessageStructure";
import { SignatureData, MessageSigner } from "./SignMessages";
import { supabase } from "../Supabase/Supabase";
import { p256 } from '@noble/curves/p256';
import { base64 } from '@scure/base';
import { hexToBytes } from '@noble/hashes/utils';
import { sha256 } from "@noble/hashes/sha256";

export class MessageVerifier {
  // Helper: Convert Uint8Array to hex string (same as your shared key code)
  private static toHex = (bytes: Uint8Array): string =>
    Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

  /**
   * Get compressed public key using EXACT same logic as your shared key code
   */
  private static async getCompressedPublicKey(userAddress: string): Promise<string | null> {
    try {
      const ownAddress = await AsyncStorage.getItem('walletAddress');
      
      if (userAddress === ownAddress) {
        // For own messages, load from local crypto key pair
        console.log("🔍 Loading own public key from local storage");
        const ownKeyPairStored = await AsyncStorage.getItem(`crypto_key_pair_${ownAddress}`);
        if (!ownKeyPairStored) return null;

        const ownKeyPairParsed = JSON.parse(ownKeyPairStored);
        if (!ownKeyPairParsed.publicKey) return null;

        // Use your getCompressedPublicKey function directly
        return this.compressPublicKey(ownKeyPairParsed.publicKey);
      } else {
        // For other users, check cache first
        const cachedKey = await AsyncStorage.getItem(`compressed_key_${userAddress}`);
        if (cachedKey) {
          console.log("🔓 Using cached compressed key");
          return cachedKey;
        }

        // Fetch raw public key from Supabase (same as your shared key code step 3)
        console.log(`🔍 Fetching raw public key for ${userAddress} from Supabase`);
        const { data, error } = await supabase
          .from('profiles')
          .select('public_key')
          .eq('wallet_address', userAddress)
          .single();

        if (error || !data?.public_key) {
          console.warn(`❌ Could not fetch public key for ${userAddress}`);
          return null;
        }

        console.log("📦 Raw public key fetched from Supabase");

        // Compress using your exact logic
        const compressedKey = this.compressPublicKey(data.public_key);
        if (!compressedKey) return null;

        // Cache the compressed key
        await AsyncStorage.setItem(`compressed_key_${userAddress}`, compressedKey);
        console.log("✅ Compressed and cached public key for verification");
        
        return compressedKey;
      }
    } catch (error) {
      console.error("❌ Error getting compressed public key:", error);
      return null;
    }
  }

  /**
   * Compress public key using EXACT same logic as your getCompressedPublicKey function
   */
  private static compressPublicKey(publicKeyB64: string): string | null {
    try {
      if (typeof publicKeyB64 !== 'string' || !publicKeyB64) return null;
      
      // Decode the raw public key (same as your code)
      const publicKeyBytes = base64.decode(publicKeyB64);
      console.log("📦 Public key length:", publicKeyBytes.length);
      console.log("🔐 Public key first byte (should be 0x04):", publicKeyBytes[0]);
      
      // Validate and get point (same as your shared key code step 4)
      const point = p256.Point.fromHex(publicKeyBytes);
      console.log("✅ Public key is valid on the curve");
      
      // Compress it (same as your shared key code step 5)
      const compressedHex = point.toHex(true); // compressed hex
      const compressedBytes = hexToBytes(compressedHex);
      console.log("📎 Compressed public key byte 0 (should be 0x02 or 0x03):", compressedBytes[0]);
      
      // Return base64 encoded compressed key (same as your getCompressedPublicKey)
      return base64.encode(compressedBytes);
    } catch (e) {
      console.error('❌ Compress error:', e);
      return null;
    }
  }

  /**
   * Verify ECDSA signature using compressed public key
   */
  static async verifyReceivedMessage(message: Message): Promise<boolean> {
    try {
      if (!message.signature || !message.signatureNonce || !message.signatureTimestamp) {
        console.log("ℹ️ Message missing signature data");
        return false;
      }

      // Validate signature format
      if (message.signature.length !== 128) {
        console.warn("❌ Invalid signature length, expected 128, got:", message.signature.length);
        return false;
      }

      console.log("🔍 Verifying ECDSA signature using compressed public key...");

      // Get compressed public key using your exact compression logic
      const compressedKeyBase64 = await this.getCompressedPublicKey(message.sender);
      if (!compressedKeyBase64) {
        console.warn("❌ Could not get compressed public key");
        return false;
      }

      console.log("🔑 Using compressed public key for verification");

      // Convert compressed key from base64 to bytes for ECDSA verification
      const compressedKeyBytes = base64.decode(compressedKeyBase64);
      console.log("📦 Compressed key length:", compressedKeyBytes.length, "bytes");

      // Recreate the signature payload
      const signatureData: SignatureData = {
        originalMessage: message.text,
        timestamp: message.signatureTimestamp,
        nonce: message.signatureNonce,
        signer: message.sender,
        receiver: message.receiver,
        messageId: message.id,
      };

      const messageToVerify = MessageSigner.createSignaturePayload(signatureData);
      const messageHash = sha256(new TextEncoder().encode(messageToVerify));

      // Verify ECDSA signature using compressed public key bytes
      const isValid = p256.verify(message.signature, messageHash, compressedKeyBytes);
      
      console.log(`🔍 ECDSA signature verification: ${isValid ? "✅ Valid" : "❌ Invalid"}`);
      
      return isValid;

    } catch (error) {
      console.error("❌ ECDSA verification error:", error);
      return false;
    }
  }

  /**
   * Verify message integrity
   */
  static verifyMessageIntegrity(message: Message): boolean {
    if (!message.messageHash) return true;
    
    const calculatedHash = MessageSigner.generateMessageHash(message.text);
    const isValid = calculatedHash === message.messageHash;
    
    console.log(`🧮 Message integrity check: ${isValid ? "✅ Valid" : "❌ Invalid"}`);
    return isValid;
  }

  /**
   * Get verification status
   */
  static async getVerificationStatus(message: Message): Promise<{
    signatureValid: boolean;
    integrityValid: boolean;
    details: string;
  }> {
    const signatureValid = await this.verifyReceivedMessage(message);
    const integrityValid = this.verifyMessageIntegrity(message);

    let details = "Message verified successfully with ECDSA";
    if (!signatureValid) details = "Invalid ECDSA signature";
    if (!integrityValid) details = "Message integrity compromised";

    return { signatureValid, integrityValid, details };
  }
}
