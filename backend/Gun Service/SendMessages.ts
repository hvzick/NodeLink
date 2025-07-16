import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGunInstance } from './GunIndex';

/**
 * A simple function to send a plaintext (unencrypted) message via Gun.js.
 *
 * @param recipientAddress The wallet address of the recipient.
 * @param content The plaintext message content.
 * @returns A promise that resolves to true on success, false on failure.
 */
export async function sendMessage(
  recipientAddress: string,
  content: string
): Promise<boolean> {
  try {
    const gun = getGunInstance();
    if (!gun) {
      throw new Error("Gun.js is not connected.");
    }

    const senderAddress = await AsyncStorage.getItem('walletAddress');
    if (!senderAddress) {
      throw new Error("Sender address not found.");
    }

    // 1. Prepare the plaintext network payload
    const messageId = crypto.randomUUID();
    const networkMessage = {
      id: messageId,
      sender: senderAddress,
      timestamp: Date.now(),
      content: content, // The message is sent as plain text
    };

    // 2. Send the payload over the Gun.js network
    console.log(`🚀 Sending unencrypted message ${messageId} to ${recipientAddress}...`);
    gun.get('messages').get(recipientAddress).get(messageId).put(networkMessage);

    console.log("✅ Unencrypted message sent successfully.");
    return true;

  } catch (error) {
    console.error("❌ Failed to send unencrypted message:", error);
    return false;
  }
}
