// utils/ChatDetailUtils/ChatHandlers/handleSendMessage.ts

import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message } from "../../../backend/Local database/SQLite/MessageStructure";
import { insertMessage } from "../../../backend/Local database/SQLite/MessageIndex";
import { triggerTapHapticFeedback } from "../../GlobalUtils/TapHapticFeedback";
import { ChatItemType } from "../../ChatUtils/ChatItemsTypes";
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

  console.log("📬 User Address:", userAddress);
  console.log("🔑 Shared Key:", sharedKey);
  console.log("🎯 Receiver Address:", receiverAddress);

  if (!userAddress || !sharedKey) {
    Alert.alert("Error", "Missing wallet or shared encryption key");
    console.warn("❌ Missing userAddress or sharedKey");
    return;
  }

  const createdAt = Date.now();
  const id = createdAt.toString();
  const timestamp = new Date(createdAt).toISOString();
  const conversationId = `convo_${receiverAddress}`;

  console.log("🕒 Timestamp:", timestamp);
  console.log("🆔 Message ID:", id);
  console.log("📡 Conversation ID:", conversationId);

  const ivBytes = randomBytes(12);
  const ivHex = bytesToHex(ivBytes);
  console.log("🔐 IV:", ivHex);

  // Sign the message before encryption
  let signedMessage;
  let messageHash = "";
  try {
    if (plainText) {
      console.log("✍️ Signing message:", plainText);
      signedMessage = await MessageSigner.signMessage(
        plainText,
        id,
        userAddress,
        receiverAddress
      );
      messageHash = MessageSigner.generateMessageHash(plainText);
      console.log("✅ Message signed successfully");
      console.log("🔏 Signature:", signedMessage.signature);
      console.log("🧮 Message hash:", messageHash);
    }
  } catch (error) {
    console.error("❌ Message signing error:", error);
    Alert.alert("Signing Error", "Failed to sign the message.");
    return;
  }

  // Encrypt the message
  let encryptedText = "";
  try {
    if (plainText) {
      console.log("🛡️ Encrypting:", plainText);
      encryptedText = encryptMessage(plainText, sharedKey, ivHex);
      console.log("🔒 Encrypted Message:", encryptedText);
    }
  } catch (error) {
    console.error("❌ Encryption error:", error);
    Alert.alert("Encryption Error", "Failed to encrypt the message.");
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
    readAt: null,
    // Add signature fields
    signature: signedMessage?.signature || "",
    signatureNonce: signedMessage?.nonce || "",
    signatureTimestamp: signedMessage?.timestamp || createdAt,
    messageHash,
    signatureVerified: true, // We just signed it, so it's verified
  };

  // console.log("📨 Prepared Message:", tempMsg);

  setMessages((prev) =>
    [...prev, tempMsg].sort(
      (a, b) =>
        (a.createdAt || parseInt(a.id, 10)) -
        (b.createdAt || parseInt(b.id, 10))
    )
  );
  setNewMessage("");
  setAttachment(null);
  setReplyMessage(null);
  triggerTapHapticFeedback();
  console.log("✅ UI updated and inputs reset");

  try {
    console.log("📤 Sending to GunDB...");
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
      readAt: null,
      // Include signature data
      signature: signedMessage?.signature || "",
      signatureNonce: signedMessage?.nonce || "",
      signatureTimestamp: signedMessage?.timestamp || createdAt,
      messageHash,
    });
    console.log("✅ Sent to GunDB");

    await insertMessage(tempMsg);
    console.log("💾 Saved to local DB");
  } catch (e) {
    console.error("❌ Send or Save error:", e);
    Alert.alert("Send Error", "Message could not be delivered.");
    return;
  }

  const previewText =
    plainText ||
    (tempMsg.imageUrl ? "Image" : tempMsg.videoUrl ? "Video" : "Attachment");
  formatTimeForUser(createdAt).then((formattedTime) => {
    const chatPreview: ChatItemType = {
      id: conversationId,
      name,
      message: previewText,
      time: formattedTime,
      avatar,
    };
    addOrUpdateChat(chatPreview);
  });
  flatListRef.current?.scrollToEnd({ animated: true });
  console.log("🔽 Chat scrolled to bottom");
};
