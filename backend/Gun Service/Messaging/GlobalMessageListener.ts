import { useEffect } from 'react';
import { Message } from '../../../backend/Local database/MessageStructure';
import { insertMessage } from '../../../backend/Local database/InsertMessage';
import { useChat, EventBus } from '../../../utils/ChatUtils/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAndCacheUserProfile } from '../../../backend/Supabase/FetchAvatarAndName';
import { listenForMessages } from './RecieveMessages';
import { gun } from '../GunState';
import { decryptMessage } from '../../../backend/Encryption/Decrypt';

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
        // console.log('📥 Received via listener:', msg);

        // 💬 Safety guards
        if (!msg.id || !msg.sender) {
          console.warn('⚠️ Invalid message, missing id or sender. Skipping.');
          return;
        }

        msg.conversationId = msg.conversationId || `convo_${msg.sender}`;
        msg.createdAt = msg.createdAt || (msg.timestamp ? parseInt(msg.timestamp, 10) : Date.now());

        // 🧩 Attempt to decrypt message
        const sharedKey = await AsyncStorage.getItem(`shared_key_${msg.sender}`);
        console.log('🔑 Shared key:', sharedKey);
        console.log('🔐 IV:', msg.iv);
        console.log('🔐 Encrypted Content:', msg.encryptedContent);

        try {
          if (!msg.encryptedContent || !msg.iv || !sharedKey) {
            throw new Error('Missing encrypted fields');
          }

          const decryptedText = decryptMessage(msg.encryptedContent, sharedKey, msg.iv);
          msg.text = decryptedText;
          msg.decrypted = true;
          console.log('✅ Decrypted message:', decryptedText);
        } catch (error) {
          msg.text = '[Unable to decrypt]';
          msg.decrypted = false;
          console.warn('❌ Failed to decrypt:', error);
        }

        // 💾 Save to local DB
        try {
          await insertMessage(msg);
          // console.log(`✅ Message ${msg.id} inserted locally.`);
        } catch (err) {
          console.warn('❌ DB insert failed:', err);
        }

        // 🗑️ Remove from Gun
        try {
          gun.get(`nodelink/${myWalletAddress}`).get(msg.id).put(null);
          console.log(`🗑️ Auto-deleted message ${msg.id} from GunDB.`);
        } catch (err) {
          console.warn('❌ Auto-delete failed:', err);
        }

        // 📣 Emit to chat detail screen
        EventBus.emit('new-message', msg);

        // 🧑 Fetch profile & update preview
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
          time: new Date(msg.createdAt).toLocaleTimeString([], {
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
