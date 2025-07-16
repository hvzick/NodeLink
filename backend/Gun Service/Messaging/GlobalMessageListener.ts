// utils/GunUtils/GlobalMessageListener.tsx

import { useEffect } from 'react';
import { getGunInstance } from '../GunIndex';
import { Message } from '../../../backend/Local database/MessageStructure';
import { insertMessage } from '../../../backend/Local database/InsertMessage';
import { useChat, EventBus } from '../../../utils/ChatUtils/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAndCacheUserProfile } from '../../../backend/Supabase/FetchAvatarAndName';

const GlobalMessageListener = () => {
  const { addOrUpdateChat } = useChat();

  useEffect(() => {
    const gun = getGunInstance();
    if (!gun) return;

    let userAddress: string | null = null;

    AsyncStorage.getItem('walletAddress').then(address => {
      userAddress = address;
    });

    const gunListener = gun.get('messages').map().on(async (data: { sender: string | null; timestamp: any; conversationId: any; receiver: any; text: any; imageUrl: any; videoUrl: any; fileName: any; fileSize: any; replyTo: any; }, key: any) => {
      if (!data || !data.sender || !data.timestamp) return;
      if (data.sender === userAddress) return; // skip self

      const msg: Message = {
        id: key,
        conversationId: data.conversationId,
        sender: data.sender,
        localSender: 'Other',
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

      // Fetch sender profile from Supabase
      const senderConversationId = `convo_${data.sender}`;
      const profile = await fetchAndCacheUserProfile(senderConversationId);
      if (!profile) {
        // If sender not found in Supabase, do not add chat item
        console.warn(`Sender ${data.sender} not found in Supabase, chat item not created.`);
        return;
      }
      const avatarSource = profile.avatar
        ? { uri: profile.avatar }
        : require('../../../assets/images/default-user-avatar.jpg');
      // Update chat preview only if sender exists in Supabase
      const preview = msg.text || (msg.imageUrl ? 'Image' : msg.videoUrl ? 'Video' : 'Attachment');
      addOrUpdateChat({
        id: msg.conversationId,
        name: profile.name,
        avatar: avatarSource,
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
