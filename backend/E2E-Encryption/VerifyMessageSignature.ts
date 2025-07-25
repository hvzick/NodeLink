// backend/Encryption/VerifyMessageSignature.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { Message } from "../Local database/SQLite/MessageStructure";
import { SignatureData, MessageSigner } from "./SignMessages";
import { UserData } from "../Supabase/RegisterUser";
import { supabase } from "../Supabase/Supabase";
import { p256 } from "@noble/curves/p256";
import { base64 } from "@scure/base";
import { hexToBytes } from "@noble/hashes/utils";
import { sha256 } from "@noble/hashes/sha2";

export class MessageVerifier {
  /**
   * Compress public key with detailed logging
   */
  private static compressPublicKey(publicKeyB64: string): string | null {
    try {
      console.log("🔧 === COMPRESSION DEBUG ===");
      console.log("📱 Platform:", Platform.OS);
      console.log(
        "🔧 Input public key length:",
        publicKeyB64?.length || "undefined"
      );
      console.log(
        "🔧 Input public key (first 50 chars):",
        publicKeyB64?.substring(0, 50) + "..."
      );

      if (!publicKeyB64 || typeof publicKeyB64 !== "string") {
        console.error("❌ Invalid public key input");
        return null;
      }

      // Validate base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(publicKeyB64)) {
        console.error("❌ Invalid base64 format");
        return null;
      }

      const publicKeyBytes = base64.decode(publicKeyB64);
      console.log("🔧 Decoded bytes length:", publicKeyBytes.length);
      console.log("🔧 Expected length: 65 bytes");
      console.log(
        "🔧 First byte (should be 0x04):",
        "0x" + publicKeyBytes[0]?.toString(16)
      );
      console.log(
        "🔧 First 10 bytes:",
        Array.from(publicKeyBytes.slice(0, 10))
          .map((b) => "0x" + b.toString(16))
          .join(", ")
      );

      // Validate key length
      if (publicKeyBytes.length !== 65) {
        console.error(
          `❌ Invalid key length: ${publicKeyBytes.length}, expected 65`
        );
        return null;
      }

      // Validate uncompressed format
      if (publicKeyBytes[0] !== 0x04) {
        console.error(
          `❌ Invalid key format: first byte is 0x${publicKeyBytes[0].toString(
            16
          )}, expected 0x04`
        );
        return null;
      }

      const point = p256.Point.fromHex(publicKeyBytes);
      console.log("🔧 Point creation: ✅ SUCCESS");

      const compressedHex = point.toHex(true);
      console.log("🔧 Compressed hex length:", compressedHex.length);
      console.log(
        "🔧 Compressed hex (first 20 chars):",
        compressedHex.substring(0, 20)
      );

      const compressedBytes = hexToBytes(compressedHex);
      console.log("🔧 Compressed bytes length:", compressedBytes.length);
      console.log(
        "🔧 Compressed first byte (0x02 or 0x03):",
        "0x" + compressedBytes[0]?.toString(16)
      );

      const result = base64.encode(compressedBytes);
      console.log("🔧 Final compressed base64 length:", result.length);
      console.log(
        "🔧 Final compressed base64 (first 30 chars):",
        result.substring(0, 30) + "..."
      );
      console.log("🔧 === END COMPRESSION DEBUG ===");

      return result;
    } catch (error) {
      console.error("❌ === COMPRESSION ERROR ===");
      console.error("📱 Platform:", Platform.OS);
      console.error("❌ Error message:", error);
      console.error("❌ Error stack:", error);
      console.error(
        "❌ Input that failed (first 100 chars):",
        publicKeyB64?.substring(0, 100) + "..."
      );
      console.error("❌ === END COMPRESSION ERROR ===");
      return null;
    }
  }

  /**
   * Get compressed public key - NO CACHING, load fresh from UserData each time
   */
  private static async getCompressedPublicKey(
    userAddress: string
  ): Promise<string | null> {
    try {
      console.log("🔍 === PUBLIC KEY RETRIEVAL DEBUG (NO CACHE) ===");
      console.log("📱 Platform:", Platform.OS);
      console.log("🔍 Requested user address:", userAddress);

      const ownAddress = await AsyncStorage.getItem("walletAddress");
      console.log("🔍 Own address:", ownAddress);

      // For own messages - load from crypto key pair
      if (userAddress === ownAddress) {
        console.log("🔍 Loading own public key from crypto key pair");
        const keyPair = await AsyncStorage.getItem(
          `crypto_key_pair_${ownAddress}`
        );
        if (!keyPair) {
          console.error("❌ No crypto key pair found");
          return null;
        }
        const { publicKey } = JSON.parse(keyPair);
        console.log("🔍 Own public key length:", publicKey?.length);
        console.log(
          "🔍 Own public key preview:",
          publicKey?.substring(0, 50) + "..."
        );
        return this.compressPublicKey(publicKey);
      }

      // Load directly from UserData (NO CACHE CHECK)
      console.log("🔍 Loading fresh from UserData (no cache)");
      try {
        const userData = await AsyncStorage.getItem("userData");
        console.log("🔍 UserData exists:", !!userData);

        if (userData) {
          const parsedUserData: UserData = JSON.parse(userData);
          console.log(
            "🔍 UserData wallet address:",
            parsedUserData.walletAddress
          );
          console.log("🔍 UserData has publicKey:", !!parsedUserData.publicKey);
          console.log(
            "🔍 Addresses match:",
            parsedUserData.walletAddress === userAddress
          );

          if (
            parsedUserData.walletAddress === userAddress &&
            parsedUserData.publicKey
          ) {
            console.log("✅ Found public key in UserData");
            console.log("📱 Current platform:", Platform.OS);
            console.log(
              "🔑 UserData raw public key length:",
              parsedUserData.publicKey.length
            );
            console.log(
              "🔑 UserData raw public key (first 50 chars):",
              parsedUserData.publicKey.substring(0, 50) + "..."
            );
            console.log(
              "🔑 UserData raw public key (last 50 chars):",
              "..." +
                parsedUserData.publicKey.substring(
                  parsedUserData.publicKey.length - 50
                )
            );

            // Check if key looks like valid base64
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            const isValidBase64 = base64Regex.test(parsedUserData.publicKey);
            console.log("🔍 Key appears to be valid base64:", isValidBase64);

            if (!isValidBase64) {
              console.error(
                "❌ UserData public key is not valid base64 format"
              );
              console.error("❌ Key contains invalid characters");
            }

            // Compress the key fresh each time (NO CACHING)
            const compressedKey = this.compressPublicKey(
              parsedUserData.publicKey
            );
            if (compressedKey) {
              console.log(
                "✅ Successfully compressed UserData public key (fresh, no cache)"
              );
              console.log("🔍 === END PUBLIC KEY RETRIEVAL DEBUG ===");
              return compressedKey;
            } else {
              console.error("❌ Failed to compress UserData public key");
            }
          }
        }
      } catch (userDataError) {
        console.error("❌ === USERDATA ERROR ===");
        console.error("📱 Platform:", Platform.OS);
        console.error("❌ UserData error:", userDataError);
        console.error("❌ UserData error stack:", userDataError);
        console.error("❌ === END USERDATA ERROR ===");
        console.warn("⚠️ UserData error, falling back to Supabase");
      }

      // Fallback to Supabase (also NO CACHING)
      console.log("🔍 Falling back to Supabase (no cache)");
      console.log(`🌐 Fetching public key for ${userAddress} from Supabase`);
      const { data, error } = await supabase
        .from("profiles")
        .select("public_key")
        .eq("wallet_address", userAddress)
        .single();

      if (error) {
        console.error("❌ Supabase error:", error);
        return null;
      }

      if (!data?.public_key) {
        console.warn(`❌ No public key found in Supabase for ${userAddress}`);
        return null;
      }

      console.log("📦 Supabase public key found");
      console.log("📦 Supabase key length:", data.public_key.length);
      console.log(
        "📦 Supabase key preview:",
        data.public_key.substring(0, 50) + "..."
      );

      // Compress fresh from Supabase (NO CACHING)
      const compressedKey = this.compressPublicKey(data.public_key);
      if (compressedKey) {
        console.log(
          "✅ Successfully compressed Supabase public key (fresh, no cache)"
        );
      }

      console.log("🔍 === END PUBLIC KEY RETRIEVAL DEBUG ===");
      return compressedKey;
    } catch (error) {
      console.error("❌ === CRITICAL PUBLIC KEY ERROR ===");
      console.error("📱 Platform:", Platform.OS);
      console.error("❌ Error getting compressed public key:", error);
      console.error("❌ Error stack:", error);
      console.error("❌ === END CRITICAL ERROR ===");
      return null;
    }
  }

  /**
   * Verify ECDSA signature with debugging
   */
  static async verifyReceivedMessage(message: Message): Promise<boolean> {
    try {
      console.log("=== SIGNATURE VERIFICATION DEBUG ===");
      console.log("Platform:", Platform.OS);
      console.log("Message ID:", message.id);
      console.log("Sender:", message.sender);
      console.log("Receiver:", message.receiver);

      // Validate signature data
      if (
        !message.signature ||
        !message.signatureNonce ||
        !message.signatureTimestamp
      ) {
        console.log("Missing signature data:");
        console.log("   - signature:", !!message.signature);
        console.log("   - signatureNonce:", !!message.signatureNonce);
        console.log("   - signatureTimestamp:", !!message.signatureTimestamp);
        return false;
      }

      console.log("Signature length:", message.signature.length);
      console.log("Signature preview:", message.signature);
      console.log("Signature nonce:", message.signatureNonce);
      console.log("Signature timestamp:", message.signatureTimestamp);

      if (message.signature.length !== 128) {
        console.error(
          "❌ Invalid signature length:",
          message.signature.length,
          "expected 128"
        );
        return false;
      }

      // Get compressed public key (fresh, no cache)
      const compressedKeyBase64 = await this.getCompressedPublicKey(
        message.sender
      );
      if (!compressedKeyBase64) {
        console.error("Could not get compressed public key");
        return false;
      }

      // Recreate signature payload
      const signatureData: SignatureData = {
        originalMessage: message.text,
        timestamp: message.signatureTimestamp,
        nonce: message.signatureNonce,
        signer: message.sender,
        receiver: message.receiver,
        messageId: message.id,
      };

      const messageToVerify =
        MessageSigner.createSignaturePayload(signatureData);
      console.log("Message payload to verify:", messageToVerify);
      console.log("Message payload length:", messageToVerify.length);

      const messageHash = sha256(new TextEncoder().encode(messageToVerify));
      console.log("Message hash length:", messageHash.length);
      console.log(
        "Message hash (hex):",
        Array.from(messageHash)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );

      // Verify signature
      const compressedKeyBytes = base64.decode(compressedKeyBase64);
      console.log(
        "Using compressed key bytes length:",
        compressedKeyBytes.length
      );
      console.log(
        "Compressed key first byte:",
        "0x" + compressedKeyBytes[0]?.toString(16)
      );

      const isValid = p256.verify(
        message.signature,
        messageHash,
        compressedKeyBytes
      );

      console.log(
        `ECDSA verification result: ${isValid ? "VALID" : "INVALID"}`
      );
      console.log("=== END SIGNATURE VERIFICATION DEBUG ===");

      return isValid;
    } catch (error) {
      console.error("=== SIGNATURE VERIFICATION ERROR ===");
      console.error("Platform:", Platform.OS);
      console.error("Verification error:", error);
      console.error("Error stack:", error);
      console.error("=== END VERIFICATION ERROR ===");
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

    console.log(`Integrity check: ${isValid ? "Valid" : "Invalid"}`);
    console.log("Expected hash:", message.messageHash);
    console.log("Calculated hash:", calculatedHash);

    return isValid;
  }

  /**
   * Get complete verification status
   */
  static async getVerificationStatus(message: Message): Promise<{
    signatureValid: boolean;
    integrityValid: boolean;
    details: string;
  }> {
    console.log("=== VERIFICATION STATUS CHECK ===");
    console.log("Platform:", Platform.OS);

    const signatureValid = await this.verifyReceivedMessage(message);
    const integrityValid = this.verifyMessageIntegrity(message);

    let details = "Message verified successfully";
    if (!signatureValid) details = "Invalid signature";
    if (!integrityValid) details = "Message integrity compromised";
    if (!signatureValid && !integrityValid)
      details = "Both signature and integrity invalid";

    console.log("Final verification status:", {
      signatureValid,
      integrityValid,
      details,
    });
    console.log("=== END VERIFICATION STATUS CHECK ===");

    return { signatureValid, integrityValid, details };
  }
}
