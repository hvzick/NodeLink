import { sha256 } from '@noble/hashes/sha256';

/**
 * Returns a shared security code between two users.
 * This should be displayed to both users for comparison.
 *
 * @param myPublicKey Base64 or Hex encoded public key string
 * @param theirPublicKey Base64 or Hex encoded public key string
 * @returns Security code as a numeric string (e.g., like WhatsApp)
 */
export function generateSharedSecurityCode(myPublicKey: string, theirPublicKey: string): string {
  // Sort the keys lexicographically to ensure both users derive the same code
  const [key1, key2] = [myPublicKey, theirPublicKey].sort();

  // Combine the keys
  const combined = key1 + key2;

  // Hash using SHA-256
  const hash = sha256(new TextEncoder().encode(combined));

  // Convert first 30 bytes into decimal chunks
  const fingerprint = Array.from(hash.slice(0, 15))
    .map(byte => byte.toString().padStart(3, '0')) // zero-padded decimal
    .join(' ');

  return fingerprint; // Example: "072 155 201 009 038 145 ..."
}
