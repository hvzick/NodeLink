// backend/Gun Service/Messaging/GlobalMessageListener.ts

import { useEffect } from 'react';
import { Message } from '../../../backend/Local database/MessageStructure';
import { insertMessage } from '../../../backend/Local database/InsertMessage';
import { useChat, EventBus } from '../../../utils/ChatUtils/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAndCacheUserProfile } from '../../../backend/Supabase/FetchAvatarAndName';
import { listenForMessages } from './RecieveMessages';
import { gun } from '../GunState';

const GlobalMessageListener = () => {
  const { addOrUpdateChat } = useChat();

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const startListener = async () => {
      const myWalletAddress = await AsyncStorage.getItem('walletAddress');
      if (!myWalletAddress) {
        console.warn('❌ Cannot start listener: wallet address not found.');
        return;
      }

      cleanup = await listenForMessages(async (msg: Message) => {
        console.log('📥 Received via listener:', msg);

        // 1️⃣ Save to local DB
        try {
          await insertMessage(msg);
          console.log(`✅ Message ${msg.id} inserted locally.`);
        } catch (err) {
          console.warn('❌ DB insert failed:', err);
        }

        // 2️⃣ Remove from GunDB (auto-delete after receiving)
        try {
          gun.get(`nodelink/${myWalletAddress}`).get(msg.id).put(null);
          console.log(`🗑️ Auto-deleted message ${msg.id} from GunDB.`);
        } catch (err) {
          console.warn('❌ Auto-delete failed:', err);
        }

        // 3️⃣ Emit globally
        EventBus.emit('new-message', msg);

        // 4️⃣ Chat preview
        const profile = await fetchAndCacheUserProfile(msg.conversationId);
        if (!profile) {
          console.warn(`⚠️ No profile found for ${msg.sender}`);
          return;
        }

        const preview =
          msg.text || (msg.imageUrl ? 'Image' : msg.videoUrl ? 'Video' : 'Attachment');

        addOrUpdateChat({
          id: msg.conversationId,
          name: profile.name,
          avatar: profile.avatar
            ? { uri: profile.avatar }
            : require('../../../assets/images/default-user-avatar.jpg'),
          message: preview,
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
      });
    };

    startListener();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return null;
};

export default GlobalMessageListener;
