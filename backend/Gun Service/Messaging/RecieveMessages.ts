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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handler = chatRef.map().on((data: any, key: string) => {
    if (!data || typeof data !== 'object') {
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
      replyTo: data.replyTo || null,

      encrypted: data.encrypted,
      decrypted: false,
      encryptedContent: data.encryptedContent || '',
      iv: data.iv || '',

      status: data.status || 'delivered',
      receivedAt: null, // Will be set in listener/handler on device receive
      encryptionVersion: data.encryptionVersion || "AES-256-GCM",
      readAt: typeof data.readAt === "number" ? data.readAt : null,
    };

    console.log('📥 Message received from GUN:', message);
    onMessageReceived(message);
  });

  return () => {
    chatRef.off();
    console.log(`🛑 Stopped listening for messages at: ${listenPath}`);
  };
}
