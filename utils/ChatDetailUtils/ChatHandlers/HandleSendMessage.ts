// utils/ChatDetailUtils/handleSendMessage.ts

import { Alert } from 'react-native';
import { Message } from '../../../backend/local database/MessageStructure';
import { insertMessage } from '../../../backend/local database/MessageIndex';
import { triggerTapHapticFeedback } from '../../GlobalUtils/TapHapticFeedback';
import { ChatItemType } from '../../ChatUtils/ChatItemsTypes';
import { ChatDetailHandlerDependencies } from './HandleDependencies';

export const handleSendMessage = async (
  dependencies: ChatDetailHandlerDependencies,
) => {
  const {
    conversationId, name, avatar, addOrUpdateChat,
    setMessages, setNewMessage, setAttachment, setReplyMessage,
    replyMessage, newMessage, attachment,
    flatListRef
  } = dependencies;

  if (!newMessage.trim() && !attachment) return;
  const now = Date.now();
  const timestamp = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const msg: Message = {
    id: now.toString(),
    conversationId,
    sender: 'Me',
    timestamp,
    createdAt: now,
    ...(newMessage.trim() && { text: newMessage.trim() }),
    ...(attachment && {
      imageUrl: attachment.imageUrl,
      videoUrl: attachment.videoUrl,
    }),
    ...(replyMessage && { replyTo: replyMessage }),
  };

  setMessages(prev => [...prev, msg].sort((a, b) => (a.createdAt || parseInt(a.id, 10)) - (b.createdAt || parseInt(b.id, 10))));
  setNewMessage('');
  setAttachment(null);
  setReplyMessage(null);
  triggerTapHapticFeedback();

  try {
    await insertMessage(msg);
  } catch (e) {
    console.error("Insert error:", e);
    Alert.alert("Error", "Could not send message.");
  }

  const previewMessageContent = msg.text || (msg.imageUrl ? 'Image' : msg.videoUrl ? 'Video' : 'Attachment');
  const updatedChatItem: ChatItemType = {
    id: conversationId,
    name,
    message: previewMessageContent,
    time: timestamp,
    avatar,
  };
  addOrUpdateChat(updatedChatItem);

  flatListRef.current?.scrollToEnd({ animated: true });
};