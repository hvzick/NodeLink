import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../../../backend/Local database/MessageStructure';
import { insertMessage } from '../../../backend/Local database/MessageIndex';
import { triggerTapHapticFeedback } from '../../GlobalUtils/TapHapticFeedback';
import { ChatItemType } from '../../ChatUtils/ChatItemsTypes';
import { ChatDetailHandlerDependencies } from './HandleDependencies';
import { sendMessage } from '../../../backend/Gun Service/Messaging/SendMessage';

export const handleSendMessage = async (
  dependencies: ChatDetailHandlerDependencies,
) => {
  const {
    name, avatar, addOrUpdateChat,
    setMessages, setNewMessage, setAttachment, setReplyMessage,
    replyMessage, newMessage, attachment,
    flatListRef,
    receiverAddress,
  } = dependencies;

  if (!newMessage.trim() && !attachment) return;

  const userAddress = await AsyncStorage.getItem('walletAddress');
  if (!userAddress) {
    Alert.alert("Error", "Wallet address not found");
    return;
  }

  const now = Date.now();
  const timestamp = new Date(now).toISOString();

  // 🔁 Use consistent format
  const finalConversationId = `convo_${receiverAddress}`;

  const tempMsg: Message = {
    id: now.toString(),
    conversationId: finalConversationId,
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

  setMessages(prev =>
    [...prev, tempMsg].sort((a, b) => (a.createdAt || parseInt(a.id, 10)) - (b.createdAt || parseInt(b.id, 10)))
  );

  setNewMessage('');
  setAttachment(null);
  setReplyMessage(null);
  triggerTapHapticFeedback();

  try {
    await sendMessage({
      text: newMessage.trim(),
      receiver: receiverAddress,
      sender: userAddress,
    });

    await insertMessage(tempMsg);
    console.log("✅ Message saved to local DB");
  } catch (e) {
    console.error('Send error:', e);
    Alert.alert('Error', 'Could not send message.');
  }

  const previewMessageContent =
    tempMsg.text || (tempMsg.imageUrl ? 'Image' : tempMsg.videoUrl ? 'Video' : 'Attachment');

  const updatedChatItem: ChatItemType = {
    id: finalConversationId,
    name,
    message: previewMessageContent,
    time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    avatar,
  };

  addOrUpdateChat(updatedChatItem);
  flatListRef.current?.scrollToEnd({ animated: true });
};
