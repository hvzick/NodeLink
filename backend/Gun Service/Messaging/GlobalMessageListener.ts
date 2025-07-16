// utils/GunUtils/GlobalMessageListener.tsx

import { useEffect } from 'react';
import { getGunInstance } from '../GunIndex';
import { Message } from '../../../backend/Local database/MessageStructure';
import { insertMessage } from '../../../backend/Local database/InsertMessage';
import { useChat, EventBus } from '../../../utils/ChatUtils/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GlobalMessageListener = () => {
  const { addOrUpdateChat } = useChat();

  useEffect(() => {
    const gun = getGunInstance();
    if (!gun) return;

    let userAddress: string | null = null;

    AsyncStorage.getItem('walletAddress').then(address => {
      userAddress = address;
    });

    const gunListener = gun.get('messages').map().on((data: { sender: string | null; timestamp: any; conversationId: any; receiver: any; text: any; imageUrl: any; videoUrl: any; fileName: any; fileSize: any; replyTo: any; }, key: any) => {
      if (!data || !data.sender || !data.timestamp) return;
      if (data.sender === userAddress) return; // skip self

      const msg: Message = {
        id: key,
        conversationId: data.conversationId,
        sender: data.sender,
        receiver: data.receiver,
        timestamp: data.timestamp,
        createdAt: Date.now(),
        text: data.text || '',
        imageUrl: data.imageUrl || null,
        videoUrl: data.videoUrl || null,
        fileName: data.fileName || null,
        fileSize: data.fileSize || null,
        replyTo: data.replyTo || null,
        encrypted: false,
        decrypted: true,
        status: 'delivered',
      };

      // Save locally and notify UI
      insertMessage(msg);
      EventBus.emit('new-message', msg);

      // Update chat preview
      const preview = msg.text || (msg.imageUrl ? 'Image' : msg.videoUrl ? 'Video' : 'Attachment');
      addOrUpdateChat({
        id: msg.conversationId,
        name: '', // will be refreshed later
        avatar: null,
        message: preview,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    });

    return () => {
      gun.get('messages').off();
    };
  }, []);

  return null;
};

export default GlobalMessageListener;
