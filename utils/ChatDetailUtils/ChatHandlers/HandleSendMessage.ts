// utils/ChatDetailUtils/ChatHandlers/handleSendMessage.ts

import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message } from "../../../backend/Local database/SQLite/MessageStructure";
import { insertMessage } from "../../../backend/Local database/SQLite/MessageIndex";
import { triggerTapHapticFeedback } from "../../GlobalUtils/TapHapticFeedback";
import { ChatDetailHandlerDependencies } from "./HandleDependencies";
import { sendMessage } from "../../../backend/Gun Service/Messaging/SendMessage";
import { encryptMessage } from "../../../backend/E2E-Encryption/Encrypt";
import { randomBytes } from "@noble/hashes/utils";
import { bytesToHex } from "@noble/ciphers/utils";
import { formatTimeForUser } from "../../GlobalUtils/FormatDate";
import { MessageSigner } from "../../../backend/E2E-Encryption/SignMessages";

export const handleSendMessage = async (
  dependencies: ChatDetailHandlerDependencies
) => {
  console.log("🟢 handleSendMessage triggered");

  const {
    name,
    avatar,
    addOrUpdateChat,
    setMessages,
    setNewMessage,
    setAttachment,
    setReplyMessage,
    replyMessage,
    newMessage,
    attachment,
    flatListRef,
    receiverAddress,
  } = dependencies;

  const plainText = newMessage.trim();
  if (!plainText && !attachment) {
    console.warn("⚠️ No message or attachment to send");
    return;
  }

  const userAddress = await AsyncStorage.getItem("walletAddress");
  const sharedKey = await AsyncStorage.getItem(`shared_key_${receiverAddress}`);
  if (!userAddress || !sharedKey) {
    Alert.alert("Error", "Missing wallet or shared encryption key");
    console.warn("❌ Missing userAddress or sharedKey");
    return;
  }

  const createdAt = Date.now();
  const id = createdAt.toString();
  const timestamp = new Date(createdAt).toISOString();
  const conversationId = `convo_${receiverAddress}`;

  const ivHex = bytesToHex(randomBytes(12));

  // Sign
  let signedMessage;
  let messageHash = "";
  try {
    if (plainText) {
      signedMessage = await MessageSigner.signMessage(
        plainText,
        id,
        userAddress,
        receiverAddress
      );
      messageHash = MessageSigner.generateMessageHash(plainText);
    }
  } catch (error) {
    console.error("❌ Message signing error:", error);
    Alert.alert("Signing Error", "Failed to sign the message.");
    return;
  }

  // Encrypt
  let encryptedText = "";
  try {
    if (plainText) {
      encryptedText = encryptMessage(plainText, sharedKey, ivHex);
    }
  } catch (error) {
    console.error("❌ Encryption error:", error);
    Alert.alert("Encryption Error", "Failed to encrypt the message.");
    return;
  }

  // Build temp message for UI (with readAt for local DB)
  const tempMsg: Message = {
    id,
    conversationId,
    sender: userAddress,
    receiver: receiverAddress,
    timestamp,
    createdAt,
    text: plainText || "",
    encryptedContent: encryptedText,
    iv: ivHex,
    encrypted: !!plainText,
    decrypted: !!plainText,
    status: "sending",
    imageUrl: attachment?.imageUrl ?? "",
    videoUrl: attachment?.videoUrl ?? "",
    fileName: attachment?.fileName ?? "",
    fileSize: attachment?.fileSize ?? "",
    audioUrl: attachment?.audioUrl ?? "",
    replyTo: replyMessage?.id || null,
    receivedAt: null,
    encryptionVersion: "AES-256-GCM",
    readAt: Date.now(), // Set current time for local DB
    signature: signedMessage?.signature || "",
    signatureNonce: signedMessage?.nonce || "",
    signatureTimestamp: signedMessage?.timestamp || createdAt,
    messageHash,
    signatureVerified: true,
  };

  // Prepend for inverted (newest-first) FlatList
  setMessages((prev) => [tempMsg, ...prev]);
  setNewMessage("");
  setAttachment(null);
  setReplyMessage(null);
  triggerTapHapticFeedback();
  console.log("UI updated and inputs reset");

  // Send & persist
  try {
    // Send to GunDB with readAt as null
    await sendMessage({
      id,
      text: "",
      encrypted: true,
      sender: userAddress,
      receiver: receiverAddress,
      encryptedContent: encryptedText,
      iv: ivHex,
      imageUrl: attachment?.imageUrl ?? "",
      videoUrl: attachment?.videoUrl ?? "",
      fileName: attachment?.fileName ?? "",
      fileSize: attachment?.fileSize ?? "",
      audioUrl: attachment?.audioUrl ?? "",
      replyTo: replyMessage?.id || null,
      status: "sending",
      createdAt,
      timestamp,
      decrypted: false,
      receivedAt: null,
      encryptionVersion: "AES-256-GCM",
      readAt: null, // Keep null for GunDB
      signature: signedMessage?.signature || "",
      signatureNonce: signedMessage?.nonce || "",
      signatureTimestamp: signedMessage?.timestamp || createdAt,
      messageHash,
    });

    // Save to local DB with readAt set to current time
    await insertMessage(tempMsg);
    console.log("Sent & saved to DB");
  } catch (e) {
    console.error("❌ Send or Save error:", e);
    Alert.alert("Send Error", "Message could not be delivered.");
    return;
  }

  // Update chat preview
  const previewText =
    plainText ||
    (tempMsg.imageUrl ? "Image" : tempMsg.videoUrl ? "Video" : "Attachment");
  formatTimeForUser(createdAt).then((formattedTime) => {
    addOrUpdateChat({
      id: conversationId,
      name,
      message: previewText,
      time: formattedTime,
      avatar,
    });
  });

  // Scroll to bottom (inverted FlatList: offset 0)
  flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  console.log("Chat scrolled to bottom");
};
