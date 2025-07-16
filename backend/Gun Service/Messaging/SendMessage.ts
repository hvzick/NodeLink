// backend\Gun Service\Messaging\SendMessage.ts

import { gun } from '../GunState';

interface SendMessageParams {
  text: string;
  receiver: string;
  sender: string;
}

export async function sendMessage({
  text,
  receiver,
  sender,
}: SendMessageParams): Promise<void> {
  const timestamp = Date.now().toString();

  const message = {
    id: timestamp,
    sender,
    receiver,
    text,
    timestamp,
  };

  console.log('📨 Message content:', message);
  console.log(`📡 Target path: nodelink/${receiver}`);

  try {
    const chatRef = gun.get(`nodelink/${receiver}`);
    chatRef.set(message); // Set to their inbox only
    console.log('✅ Message sent to GunDB.');
  } catch (error) {
    console.error('❌ Failed to send message to GunDB:', error);
    throw error;
  }
}
