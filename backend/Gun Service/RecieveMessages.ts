import { getGunInstance } from "../Gun Service/GunIndex";

/**
 * Defines the structure of a simple, unencrypted message object.
 */
export interface UnencryptedMessage {
  id: string;
  sender: string;
  timestamp: number;
  content: string;
}

/**
 * Listens for incoming unencrypted messages for a specific user.
 *
 * @param userAddress The wallet address of the user to listen for messages for (i.e., the current user).
 * @param onMessageReceived A callback function that will be invoked with each new message.
 * @returns A cleanup function that can be called to stop listening for messages.
 */
export function listenForMessages(
  userAddress: string,
  onMessageReceived: (message: UnencryptedMessage) => void
): () => void {
  const gun = getGunInstance();
  if (!gun) {
    console.error("Cannot listen for messages: Gun.js is not connected.");
    // Return an empty function so the app doesn't crash
    return () => {};
  }

  console.log(`Listening for messages for user: ${userAddress}...`);

  // Access the user's message inbox, iterate over each message, and listen for updates.
  const listener = gun
    .get("messages")
    .get(userAddress)
    .map()
    .on((data: UnencryptedMessage | null) => {
      // Gun.js can sometimes return null or incomplete data, so we must validate it.
      if (data && data.id && data.sender && data.content) {
        console.log("Received new message:", data);
        onMessageReceived(data);
      }
    });

  // Return a cleanup function that will stop the listener to prevent memory leaks.
  return () => {
    console.log(`🛑 Stopped listening for messages for ${userAddress}.`);
    if (listener) {
      listener.off();
    }
  };
}
