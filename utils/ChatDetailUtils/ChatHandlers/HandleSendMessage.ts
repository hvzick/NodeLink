import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../../../backend/Local database/MessageStructure';
import { insertMessage } from '../../../backend/Local database/MessageIndex'; // 💾 For local DB
import { triggerTapHapticFeedback } from '../../GlobalUtils/TapHapticFeedback';
import { ChatItemType } from '../../ChatUtils/ChatItemsTypes';
import { ChatDetailHandlerDependencies } from './HandleDependencies';
import { sendMessage } from '../../../backend/Gun Service/Messaging/SendMessage'; // 🌐 Gun

export const handleSendMessage = async (
  dependencies: ChatDetailHandlerDependencies,
) => {
  const {
    conversationId, name, avatar, addOrUpdateChat,
    setMessages, setNewMessage, setAttachment, setReplyMessage,
    replyMessage, newMessage, attachment,
    flatListRef,
    receiverAddress,
  } = dependencies;

  if (!newMessage.trim() && !attachment) return;

  // ✅ Fetch the real sender address from AsyncStorage
  const userAddress = await AsyncStorage.getItem('walletAddress');
  if (!userAddress) {
    Alert.alert("Error", "Wallet address not found");
    return;
  }

  const now = Date.now();
  const timestamp = new Date(now).toISOString();

  const tempMsg: Message = {
    id: now.toString(),
    conversationId,
    sender: userAddress,
    receiver: receiverAddress,
    timestamp,
    createdAt: now,
    ...(newMessage.trim() && { text: newMessage.trim() }),
    ...(attachment && {
      imageUrl: attachment.imageUrl,
      videoUrl: attachment.videoUrl,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
    }),
    ...(replyMessage && { replyTo: replyMessage }),
    encrypted: false,
    decrypted: true,
    status: 'sending',
  };

  // 1️⃣ Optimistic UI update
  setMessages(prev =>
    [...prev, tempMsg].sort((a, b) => (a.createdAt || parseInt(a.id, 10)) - (b.createdAt || parseInt(b.id, 10)))
  );

  // 2️⃣ Reset UI inputs
  setNewMessage('');
  setAttachment(null);
  setReplyMessage(null);
  triggerTapHapticFeedback();

  try {
    // 3️⃣ Save to GUN (remote DB)
    await sendMessage({
      text: newMessage.trim(),
      receiver: receiverAddress,
      conversationId,
      sender: userAddress,
    });

    console.log("📤 Temp message sender:", tempMsg.sender);

    // 4️⃣ Save to Local DB (SQLite, MMKV, etc.)
    await insertMessage(tempMsg); // 💾 Store locally
    console.log("✅ Message saved to local DB");

  } catch (e) {
    console.error('Send error:', e);
    Alert.alert('Error', 'Could not send message.');
  }

  // 5️⃣ Update chat preview
  const previewMessageContent =
    tempMsg.text || (tempMsg.imageUrl ? 'Image' : tempMsg.videoUrl ? 'Video' : 'Attachment');

  const updatedChatItem: ChatItemType = {
    id: conversationId,
    name,
    message: previewMessageContent,
    time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    avatar,
  };

  addOrUpdateChat(updatedChatItem);

  // 6️⃣ Scroll to bottom
  flatListRef.current?.scrollToEnd({ animated: true });
};
