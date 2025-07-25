// backend/Gun Service/Messaging/SendMessage.ts

import { gun } from "../GunState";

interface SendMessageArgs {
  id: string;
  text: string;
  receiver: string;
  sender: string;
  encrypted?: boolean;
  encryptedContent?: string;
  iv?: string;
  imageUrl?: string;
  videoUrl?: string;
  fileName?: string;
  fileSize?: string;
  audioUrl?: string;
  replyTo?: any | null;
  status?: string;
  createdAt?: number;
  timestamp?: string;
  decrypted?: boolean;
  receivedAt?: number | null;
  encryptionVersion?: string;
  readAt?: number | null;
  // Add signature-related properties
  signature?: string;
  signatureNonce?: string;
  signatureTimestamp?: number;
  messageHash?: string;
}

export async function sendMessage({
  id,
  text,
  receiver,
  sender,
  encrypted = true,
  encryptedContent,
  iv,
  imageUrl = "",
  videoUrl = "",
  fileName = "",
  fileSize = "",
  audioUrl = "",
  replyTo = null,
  status = "delivered",
  createdAt,
  timestamp,
  decrypted = false,
  receivedAt = null,
  encryptionVersion = "AES-256-GCM",
  readAt = null,
  // Add signature parameters with default values
  signature = "",
  signatureNonce = "",
  signatureTimestamp,
  messageHash = "",
}: SendMessageArgs): Promise<void> {
  const now = Date.now();

  const message = {
    id,
    sender,
    receiver,
    text: encrypted ? "" : text,
    timestamp: timestamp || new Date(now).toISOString(),
    createdAt: createdAt || now,
    encrypted,
    encryptedContent: encryptedContent || "",
    iv: iv || "",
    imageUrl,
    videoUrl,
    fileName,
    fileSize,
    audioUrl,
    replyTo,
    status,
    decrypted,
    receivedAt,
    encryptionVersion,
    readAt,
    signature,
    signatureNonce,
    signatureTimestamp: signatureTimestamp || now,
    messageHash,
  };

  console.log("-------------Message content to send----------:", message);
  console.log(`-------------Target path: nodelink/${receiver}`);
  console.log("-------------Message signature included:", !!signature);
  console.log("-------------Message hash included:", !!messageHash);

  try {
    const chatRef = gun.get(`nodelink/${receiver}`);
    chatRef.get(id).put(message);
    console.log("Message with signature sent to GunDB successfully");
  } catch (error) {
    console.error("❌ Failed to send message to GunDB:", error);
    throw error;
  }
}
