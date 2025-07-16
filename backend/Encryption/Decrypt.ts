import { gcm } from '@noble/ciphers/aes';
import { hexToBytes, bytesToUtf8 } from '@noble/ciphers/utils';

/**
 * Decrypts AES-GCM encrypted message.
 * @param encryptedHex - The encrypted message (as hex string).
 * @param keyHex - The shared key (hex-encoded, 32 bytes = 256-bit).
 * @param ivHex - The IV used during encryption (hex-encoded, 12 bytes = 96-bit).
 * @returns The decrypted plaintext string.
 */
export function decryptMessage(
  encryptedHex: string,
  keyHex: string,
  ivHex: string
): string {
  try {
    const key = hexToBytes(keyHex);
    const iv = hexToBytes(ivHex);
    const encryptedBytes = hexToBytes(encryptedHex);

    const cipher = gcm(key, iv);
    const decryptedBytes = cipher.decrypt(encryptedBytes);

    return bytesToUtf8(decryptedBytes);
  } catch (err) {
    console.error('❌ AES-GCM decryption failed:', err);
    return '[Failed to decrypt]';
  }
}
