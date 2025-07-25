/* eslint-disable @typescript-eslint/no-unused-vars */
import { getGunInstance } from "../../../backend/Gun Service/GunIndex";
import { insertMessage } from "../../../backend/Local database/SQLite/MessageIndex";
import { Message } from "../../../backend/Local database/SQLite/MessageStructure";

/**
 * Listens for incoming unencrypted messages for the current user.
 *
 * @param userAddress The wallet address of the current user.
 * @param onMessageReceived A callback function that is called with the new message.
 * @returns A cleanup function to stop the listener.
 */
export function listenForMessages(
  userAddress: string,
  onMessageReceived: (message: Message) => void
): () => void {
  const gun = getGunInstance();
  if (!gun) {
    console.error("Cannot listen for messages: Gun.js is not connected.");
    return () => {}; // Return an empty cleanup function
  }

  console.log(`👂 Listening for messages for user: ${userAddress}...`);

  // Access the user's message "inbox" and listen for any new messages.
  const listener = gun
    .get("messages")
    .get(userAddress)
    .map()
    .on(async (data: Message | null) => {
      // Validate the incoming data
      if (data && data.id && data.sender && data.createdAt) {
        console.log("📩 Received network message:", data);

        // Prepare the message object for the local database, matching the Message type
        const incomingMessage: Message = {
          ...data,
          conversationId: data.sender, // The conversation is with the person who sent it
        };

        try {
          // Save the incoming message to the local database
          await insertMessage(incomingMessage);
          console.log(
            `💾 Saved incoming message ${incomingMessage.id} to local DB.`
          );

          // Notify the UI to update with the newly saved message
          onMessageReceived(incomingMessage);
        } catch (error) {
          // This can happen if a message is received more than once.
          console.warn(
            `Could not save incoming message ${incomingMessage.id} (it might already exist).`
          );
        }
      }
    });

  // Return a cleanup function to prevent memory leaks
  return () => {
    console.log(`🛑 Stopped listening for messages for ${userAddress}.`);
    if (listener) {
      listener.off();
    }
  };
}
