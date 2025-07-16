// backend/Gun Service/Messaging/ListenForMessages.ts

import { gun } from '../GunState'; // Adjust path to your actual Gun instance
import { Message } from '../../Local database/MessageStructure';

export function listenForMessages(
  conversationId: string,
  onMessageReceived: (msg: Message) => void
): () => void {
  const chatRef = gun.get(`chat/${conversationId}`);

  const handler = chatRef.map().on((data: { sender: any; receiver: any; text: any; imageUrl: any; videoUrl: any; timestamp: string; }, key: any) => {
    if (!data || typeof data !== 'object') return;

    const message: Message = {
      id: key,
      conversationId,
      sender: data.sender,
      receiver: data.receiver,
      text: data.text || '',
      imageUrl: data.imageUrl || '',
      videoUrl: data.videoUrl || '',
      timestamp: data.timestamp,
      createdAt: data.timestamp ? parseInt(data.timestamp, 10) : Date.now(),
      encrypted: false,
      decrypted: true,
      status: 'delivered',
    };

    onMessageReceived(message);
  });

  // Return a cleanup function to stop listening
  return () => {
    chatRef.off();
  };
}
