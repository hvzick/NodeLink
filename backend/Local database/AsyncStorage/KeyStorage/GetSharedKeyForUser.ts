import { SessionKeyStore } from "./SessionKeyStore";

/**
 * Retrieves the shared key from the in-memory session cache.
 *
 * @param recipientAddress Wallet address of the recipient
 * @returns The shared (hex) key, or `undefined` if not found
 */
export function getSharedKeyForUser(
  recipientAddress: string
): string | undefined {
  return SessionKeyStore.get(recipientAddress);
}
