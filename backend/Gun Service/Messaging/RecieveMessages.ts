// backend/Gun Service/Messaging/RecieveMessages.ts

import { gun } from '../GunState';
import { Message } from '../../Local database/MessageStructure';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function listenForMessages(
  onMessageReceived: (msg: Message) => void
): Promise<() => void> {
  const myWalletAddress = await AsyncStorage.getItem('walletAddress');
  if (!myWalletAddress) {
    console.warn('❌ Cannot listen for messages: walletAddress not found.');
    return () => {};
  }

  const listenPath = `nodelink/${myWalletAddress}`;
  const chatRef = gun.get(listenPath);

  console.log(`📡 Listening for messages at: ${listenPath}`);

  const handler = chatRef.map().on((data: any, key: string) => {
    if (!data || typeof data !== 'object') {
      // console.warn(`⚠️ Skipped invalid data for key ${key}:`, data);
      return;
    }

    const senderAddress = data.sender;
    const timestamp = data.timestamp ? parseInt(data.timestamp, 10) : Date.now();

    const message: Message = {
      id: key,
      conversationId: `convo_${senderAddress}`,
      sender: senderAddress,
      receiver: data.receiver,
      text: data.text || '',
      timestamp: data.timestamp || timestamp.toString(),
      createdAt: timestamp,
      imageUrl: data.imageUrl || '',
      videoUrl: data.videoUrl || '',
      audioUrl: data.audioUrl || '',
      fileName: data.fileName || '',
      fileSize: data.fileSize || '',
      replyTo: data.replyTo || undefined,

      // 🔐 Encrypted message fields
      encrypted: data.encrypted,
      decrypted: false, // Will be updated after decryption
      encryptedContent: data.encryptedContent || '',
      iv: data.iv || '',

      status: 'delivered',
    };

    console.log('📥 Message received from GUN:', message);
    onMessageReceived(message);
  });

  return () => {
    chatRef.off();
    console.log(`🛑 Stopped listening for messages at: ${listenPath}`);
  };
}
