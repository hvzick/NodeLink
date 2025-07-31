// utils/MessageSigning/SignMessages.ts

import { randomBytes, bytesToHex } from "@noble/hashes/utils";
import { sha256 } from "@noble/hashes/sha2";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { base64 } from "@scure/base";
import { p256 } from "@noble/curves/p256";

export interface SignedMessage {
  message: string;
  signature: string;
  timestamp: number;
  nonce: string;
  signer: string;
}

export interface SignatureData {
  originalMessage: string;
  timestamp: number;
  nonce: string;
  signer: string;
  receiver: string;
  messageId: string;
}

export class MessageSigner {
  // Helper: Convert Uint8Array to hex string for logging
  private static toHex = (bytes: Uint8Array): string =>
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  /**
   * Load private key from crypto key pair storage
   */
  private static async loadPrivateKey(): Promise<Uint8Array> {
    const ownAddress = await AsyncStorage.getItem("walletAddress");
    if (!ownAddress) throw new Error("Wallet address not found");

    const keyPairData = await AsyncStorage.getItem(
      `crypto_key_pair_${ownAddress}`
    );
    if (!keyPairData) throw new Error("Key pair not found");

    const keyPair = JSON.parse(keyPairData);
    const privateKeyBytes = base64.decode(keyPair.privateKey);

    console.log("Private key loaded successfully");
    console.log("Private key length (bytes):", privateKeyBytes.length);
    console.log("Private key (hex):", this.toHex(privateKeyBytes));

    return privateKeyBytes;
  }

  /**
   * Sign message with ECDSA - Fixed Implementation
   */
  static async signMessage(
    message: string,
    messageId: string,
    senderAddress: string,
    receiverAddress: string
  ): Promise<SignedMessage> {
    console.log("🚀 Starting ECDSA signing process...");

    const timestamp = Date.now();
    const nonce = bytesToHex(randomBytes(16));

    const signatureData: SignatureData = {
      originalMessage: message,
      timestamp,
      nonce,
      signer: senderAddress,
      receiver: receiverAddress,
      messageId,
    };

    const messageToSign = this.createSignaturePayload(signatureData);
    console.log("📄 Message payload to sign:", messageToSign);

    const privateKeyBytes = await this.loadPrivateKey();

    // Hash the message
    const messageHash = sha256(new TextEncoder().encode(messageToSign));
    console.log("Message hash (hex):", this.toHex(messageHash));

    try {
      // Generate ECDSA signature using P256 curve
      console.log("Generating ECDSA signature...");
      const signature = p256.sign(messageHash, privateKeyBytes);

      // Convert to compact hex format - THIS IS THE KEY FIX
      const signatureHex = signature.toCompactHex();

      // Detailed signature logging
      console.log("=== SIGNATURE DETAILS ===");
      console.log("Full signature:", signatureHex);
      console.log("Expected length (128):", signatureHex.length === 128);

      // Validate the signature object
      console.log("Signature object type:", typeof signature);
      console.log("Signature object:", signature);

      if (signatureHex.length !== 128) {
        console.error("CRITICAL: Signature length is not 128 characters!");
        console.error(
          "This indicates a problem with ECDSA signature generation"
        );

        // Try alternative signature format
        try {
          const altSignature = signature.toDERHex();
          console.log("Alternative DER format length:", altSignature.length);
          console.log("Alternative DER signature:", altSignature);
        } catch (derError) {
          console.error("DER conversion also failed:", derError);
        }
      }

      console.log("=== END SIGNATURE DETAILS ===");

      return {
        message,
        signature: signatureHex,
        timestamp,
        nonce,
        signer: senderAddress,
      };
    } catch (error) {
      console.error("ECDSA signing failed:", error);
      throw new Error(
        `ECDSA signing failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Create signature payload string
   */
  static createSignaturePayload(data: SignatureData): string {
    return [
      data.originalMessage,
      data.timestamp.toString(),
      data.nonce,
      data.signer,
      data.receiver,
      data.messageId,
    ].join("|");
  }

  /**
   * Generate message hash for integrity checking
   */
  static generateMessageHash(message: string): string {
    return bytesToHex(sha256(new TextEncoder().encode(message)));
  }
}
