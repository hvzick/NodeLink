// backend/Gun Service/Messaging/SendMessage.ts

import { gun } from "../GunState";

export async function sendMessage({
  id,
  text,
  receiver,
  sender,
  encrypted = true,
  encryptedContent,
  iv,
}: {
  id: string; // ✅ Add this
  text: string;
  receiver: string;
  sender: string;
  encrypted?: boolean;
  encryptedContent?: string;
  iv?: string;
}): Promise<void> {
  const timestamp = Date.now();

  const conversationId = `convo_${receiver}`;

  const message = {
    id, // use passed id
    sender,
    receiver,
    text: encrypted ? '' : text,
    timestamp: timestamp.toString(),
    createdAt: timestamp,
    encrypted,
    encryptedContent: encryptedContent || '',
    iv: iv || '',
    imageUrl: '',
    videoUrl: '',
    audioUrl: '',
    status: 'delivered',
    decrypted: false,
    conversationId,
  };

  console.log('📨 Message content to send:', message);
  console.log(`📡 Target path: nodelink/${receiver}`);

  try {
    const chatRef = gun.get(`nodelink/${receiver}`);
    chatRef.get(id).put(message); // safer insert
    // console.log('✅ Message sent to GunDB.');
  } catch (error) {
    console.error('❌ Failed to send message to GunDB:', error);
    throw error;
  }
}
