// backend/Gun Service/Messaging/ListenForMessages.ts

import { gun } from '../GunState';
import { Message } from '../../Local database/MessageStructure';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Listen for incoming messages addressed to the current user.
 * This will watch GunDB at path `nodelink/convo_<myWalletAddress>`.
 */
export async function listenForMessages(
  onMessageReceived: (msg: Message) => void
): Promise<() => void> {
  // Get current user's wallet address from storage
  const myWalletAddress = await AsyncStorage.getItem('walletAddress');
  if (!myWalletAddress) {
    console.warn('❌ Cannot listen for messages: walletAddress not found in AsyncStorage.');
    return () => {};
  }

  const conversationId = `convo_${myWalletAddress}`;
  const chatRef = gun.get(`nodelink/${conversationId}`);

  const handler = chatRef.map().on(
    (
      data: {
        sender: any;
        receiver: any;
        text: any;
        imageUrl: any;
        videoUrl: any;
        timestamp: string;
      },
      key: any
    ) => {
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
    }
  );

  // Cleanup function
  return () => {
    chatRef.off();
  };
}
