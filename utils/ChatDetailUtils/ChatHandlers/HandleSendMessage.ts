// utils/ChatDetailUtils/ChatHandlers/handleSendMessage.ts

import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../../../backend/Local database/MessageStructure';
import { insertMessage } from '../../../backend/Local database/MessageIndex';
import { triggerTapHapticFeedback } from '../../GlobalUtils/TapHapticFeedback';
import { ChatItemType } from '../../ChatUtils/ChatItemsTypes';
import { ChatDetailHandlerDependencies } from './HandleDependencies';
import { sendMessage } from '../../../backend/Gun Service/Messaging/SendMessage';
import { encryptMessage } from '../../../backend/Encryption/Encrypt';
import { randomBytes } from '@noble/hashes/utils';
import { bytesToHex } from '@noble/ciphers/utils';

export const handleSendMessage = async (
  dependencies: ChatDetailHandlerDependencies,
) => {
  console.log('🟢 handleSendMessage triggered');

  const {
    name, avatar, addOrUpdateChat,
    setMessages, setNewMessage, setAttachment, setReplyMessage,
    replyMessage, newMessage, attachment,
    flatListRef,
    receiverAddress,
  } = dependencies;

  const plainText = newMessage.trim();
  if (!plainText && !attachment) {
    console.warn('⚠️ No message or attachment to send');
    return;
  }

  const userAddress = await AsyncStorage.getItem('walletAddress');
  const sharedKey = await AsyncStorage.getItem(`shared_key_${receiverAddress}`);

  console.log('📬 User Address:', userAddress);
  console.log('🔑 Shared Key:', sharedKey);
  console.log('🎯 Receiver Address:', receiverAddress);

  if (!userAddress || !sharedKey) {
    Alert.alert("Error", "Missing wallet or shared encryption key");
    console.warn('❌ Missing userAddress or sharedKey');
    return;
  }

  // Timestamp & ID
  const createdAt = Date.now();
  const id = createdAt.toString();
  const timestamp = new Date(createdAt).toISOString();
  const conversationId = `convo_${receiverAddress}`;

  console.log('🕒 Timestamp:', timestamp);
  console.log('🆔 Message ID:', id);
  console.log('📡 Conversation ID:', conversationId);

  // Encrypt message
  const ivBytes = randomBytes(12); // 96-bit IV for AES-GCM
  const ivHex = bytesToHex(ivBytes);
  console.log('🔐 IV:', ivHex);

  let encryptedText = '';
  try {
    if (plainText) {
      console.log('🛡️ Encrypting:', plainText);
      encryptedText = encryptMessage(plainText, sharedKey, ivHex);
      console.log('🔒 Encrypted Message:', encryptedText);
    }
  } catch (error) {
    console.error('❌ Encryption error:', error);
    Alert.alert('Encryption Error', 'Failed to encrypt the message.');
    return;
  }

  // Build temp message for local use & UI
  const tempMsg: Message = {
    id,
    conversationId,
    sender: userAddress,
    receiver: receiverAddress,
    timestamp,
    createdAt,
    text: plainText || '',
    encryptedContent: encryptedText,
    iv: ivHex,
    encrypted: !!plainText,
    decrypted: !!plainText,
    status: 'sending',
    ...(attachment && {
      imageUrl: attachment.imageUrl,
      videoUrl: attachment.videoUrl,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
    }),
    ...(replyMessage && { replyTo: replyMessage }),
  };

  console.log('📨 Prepared Message:', tempMsg);

  // Optimistic UI update
  setMessages(prev =>
    [...prev, tempMsg].sort((a, b) => (a.createdAt || parseInt(a.id, 10)) - (b.createdAt || parseInt(b.id, 10)))
  );
  setNewMessage('');
  setAttachment(null);
  setReplyMessage(null);
  triggerTapHapticFeedback();
  console.log('✅ UI updated and inputs reset');

  try {
    console.log('📤 Sending to GunDB...');
    await sendMessage({
      id,
      text: '', // blank if encrypted
      encrypted: true,
      sender: userAddress,
      receiver: receiverAddress,
      encryptedContent: encryptedText,
      iv: ivHex,
    });
    console.log('✅ Sent to GunDB');

    await insertMessage(tempMsg);
    console.log('💾 Saved to local DB');
  } catch (e) {
    console.error('❌ Send or Save error:', e);
    Alert.alert('Send Error', 'Message could not be delivered.');
    return;
  }

  // Chat preview
  const previewText = plainText || (tempMsg.imageUrl ? 'Image' : tempMsg.videoUrl ? 'Video' : 'Attachment');
  const chatPreview: ChatItemType = {
    id: conversationId,
    name,
    message: previewText,
    time: new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    avatar,
  };

  addOrUpdateChat(chatPreview);
  flatListRef.current?.scrollToEnd({ animated: true });
  console.log('🔽 Chat scrolled to bottom');
};
