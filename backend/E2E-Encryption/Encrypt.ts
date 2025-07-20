// utils/encryption.ts
import { gcm } from "@noble/ciphers/aes";
import { utf8ToBytes, hexToBytes, bytesToHex } from "@noble/ciphers/utils";

/**
 * Encrypt a message using AES-GCM.
 * @param text - The plaintext message.
 * @param keyHex - A 32-byte key (256-bit) in hex.
 * @param ivHex - A 12-byte IV (96-bit) in hex.
 * @returns Encrypted message as a hex string.
 */
export function encryptMessage(
  plainText: string,
  keyHex: string,
  ivHex: string
): string {
  const key = hexToBytes(keyHex); // 32 bytes for AES-256
  const iv = hexToBytes(ivHex); // 12 bytes recommended for GCM
  const plaintextBytes = utf8ToBytes(plainText);

  const cipher = gcm(key, iv);
  const encrypted = cipher.encrypt(plaintextBytes);
  return bytesToHex(encrypted);
}
