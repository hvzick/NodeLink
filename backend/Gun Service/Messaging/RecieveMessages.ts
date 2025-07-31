/* eslint-disable @typescript-eslint/no-unused-vars */
// backend/Gun Service/Messaging/RecieveMessages.ts

import { gun } from "../GunState";
import { Message } from "../../Local database/SQLite/MessageStructure";
import AsyncStorage from "@react-native-async-storage/async-storage";

type TimeoutId = ReturnType<typeof setTimeout>;

const messageBuffer = new Map<string, any>();
const messageTimeouts = new Map<string, TimeoutId>();

// Timeout duration for incomplete messages (5 seconds)
const MESSAGE_TIMEOUT = 5000;

export async function listenForMessages(
  onMessageReceived: (msg: Message) => void
): Promise<() => void> {
  const myWalletAddress = await AsyncStorage.getItem("walletAddress");
  if (!myWalletAddress) {
    console.warn("❌ Cannot listen for messages: walletAddress not found.");
    return () => {};
  }

  const listenPath = `nodelink/${myWalletAddress}`;
  const chatRef = gun.get(listenPath);

  console.log(`Listening for messages at: ${listenPath}`);

  // Function to check if a message is complete
  const isMessageComplete = (data: any): boolean => {
    const hasEssentialFields = !!(
      data.sender &&
      data.sender.trim() &&
      data.iv &&
      data.iv.trim() &&
      data.encryptedContent &&
      data.encryptedContent.trim()
    );

    if (!hasEssentialFields) {
      console.log(`❌ Missing essential fields for message`);
      return false;
    }

    // Since sender always sends signature data, make it mandatory
    const hasCompleteSignatureData = !!(
      (
        data.signature &&
        data.signature.trim() &&
        data.signature.length === 128 && // ECDSA signature is exactly 128 hex chars
        data.signatureNonce &&
        data.signatureNonce.trim() &&
        data.signatureNonce.length === 32 && // Nonce is 32 hex chars
        data.signatureTimestamp &&
        data.messageHash &&
        data.messageHash.trim() &&
        data.messageHash.length === 64
      ) // SHA-256 hash is 64 hex chars
    );

    console.log(`Signature completeness check for ${data.id || "unknown"}:`, {
      hasSignature: !!(data.signature && data.signature.length === 128),
      hasNonce: !!(data.signatureNonce && data.signatureNonce.length === 32),
      hasTimestamp: !!data.signatureTimestamp,
      hasMessageHash: !!(data.messageHash && data.messageHash.length === 64),
      isComplete: hasCompleteSignatureData,
      signatureLength: data.signature ? data.signature.length : 0,
      nonceLength: data.signatureNonce ? data.signatureNonce.length : 0,
      hashLength: data.messageHash ? data.messageHash.length : 0,
    });

    return hasCompleteSignatureData;
  };

  // Function to process and forward a complete message
  const processCompleteMessage = (key: string, data: any) => {
    console.log(`Processing complete SIGNED message ${key}`);

    const senderAddress = data.sender;
    const timestamp = data.timestamp
      ? parseInt(data.timestamp, 10)
      : Date.now();

    const message: Message = {
      id: key,
      conversationId: data.conversationId || `convo_${senderAddress}`,
      sender: senderAddress,
      receiver: data.receiver,
      text: data.text || "",
      timestamp: data.timestamp || timestamp.toString(),
      createdAt: data.createdAt || timestamp,
      imageUrl: data.imageUrl || "",
      videoUrl: data.videoUrl || "",
      audioUrl: data.audioUrl || "",
      fileName: data.fileName || "",
      fileSize: data.fileSize || "",
      replyTo: data.replyTo || null,

      encrypted: data.encrypted !== undefined ? data.encrypted : true,
      decrypted: false,
      encryptedContent: data.encryptedContent || "",
      iv: data.iv || "",

      status: data.status || "delivered",
      receivedAt: null, // Will be set in GlobalMessageListener
      encryptionVersion: data.encryptionVersion || "AES-256-GCM",
      readAt: typeof data.readAt === "number" ? data.readAt : null,

      // All signature fields are guaranteed to be present due to completeness check
      signature: data.signature,
      signatureNonce: data.signatureNonce,
      signatureTimestamp: data.signatureTimestamp,
      messageHash: data.messageHash,
      signatureVerified: false, // Will be verified in GlobalMessageListener
    };

    // Clear timeout and buffer
    const existingTimeout = messageTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      messageTimeouts.delete(key);
    }
    messageBuffer.delete(key);

    onMessageReceived(message);
  };

  // Function to handle timeout for incomplete messages
  const handleMessageTimeout = (key: string) => {
    console.error(
      `❌ Message ${key} timed out waiting for signature data - DISCARDING`
    );

    const bufferedData = messageBuffer.get(key);
    if (bufferedData) {
      console.error(`Incomplete message ${key} discarded:`, {
        sender: bufferedData.sender || "missing",
        iv: bufferedData.iv || "missing",
        signature: bufferedData.signature
          ? `incomplete(${bufferedData.signature.length})`
          : "missing",
        signatureNonce: bufferedData.signatureNonce || "missing",
      });
    }

    // Remove from buffer without processing
    messageBuffer.delete(key);
    messageTimeouts.delete(key);
  };

  // Main GUN message handler
  const handler = chatRef.map().on((data: any, key: string) => {
    // 🔥 FIX: Filter out null data from GUN cleanup/deletion events
    if (
      !data ||
      typeof data !== "object" ||
      data === null ||
      Array.isArray(data)
    ) {
      return; // Silently skip invalid/null data
    }

    // Filter out GUN's internal metadata keys and deleted message events
    if (
      typeof key === "string" &&
      (key.startsWith("md5") || key.includes("function") || key.length < 10) // Too short to be a message ID
    ) {
      return; // Silently skip GUN metadata
    }

    // Validate key format (message IDs should be timestamps)
    const messageIdPattern = /^\d{13}$/; // 13-digit timestamp
    if (!messageIdPattern.test(key)) {
      return; // Skip non-message keys
    }

    // Basic message object validation
    if (
      !data.hasOwnProperty("sender") &&
      !data.hasOwnProperty("encryptedContent") &&
      !data.hasOwnProperty("iv")
    ) {
      return; // Skip objects that don't look like messages
    }

    console.log(`Valid GUN data for ${key}:`, {
      sender: data.sender || "undefined",
      iv: data.iv || "missing",
      signature: data.signature
        ? `present(${data.signature.length}/128)`
        : "missing",
      signatureNonce: data.signatureNonce
        ? `present(${data.signatureNonce.length}/32)`
        : "missing",
      messageHash: data.messageHash
        ? `present(${data.messageHash.length}/64)`
        : "missing",
      signatureTimestamp: data.signatureTimestamp || "missing",
      encryptedContent: data.encryptedContent ? "present" : "missing",
    });

    // Get existing buffered data
    const existingData = messageBuffer.get(key) || {};

    // Merge with priority to new data
    const mergedData = {
      ...existingData,
      ...data,
    };

    messageBuffer.set(key, mergedData);

    // Check completeness with strict signature requirements
    if (isMessageComplete(mergedData)) {
      console.log(
        `Message ${key} has ALL required signature data - processing immediately`
      );
      processCompleteMessage(key, mergedData);
    } else {
      console.log(`Message ${key} missing signature data - buffering...`);

      // Set timeout if not already set
      if (!messageTimeouts.has(key)) {
        const timeout: TimeoutId = setTimeout(
          () => handleMessageTimeout(key),
          MESSAGE_TIMEOUT
        );
        messageTimeouts.set(key, timeout);
        console.log(
          `Set ${MESSAGE_TIMEOUT}ms timeout for message ${key} (will discard if incomplete)`
        );
      }
    }
  });

  // Return cleanup function
  return () => {
    console.log(`Cleaning up message listener for ${listenPath}`);

    // Clean up all timeouts
    messageTimeouts.forEach((timeout, key) => {
      clearTimeout(timeout);
      console.log(`Cleared timeout for message ${key}`);
    });
    messageTimeouts.clear();

    // Clear message buffer
    const bufferedCount = messageBuffer.size;
    messageBuffer.clear();
    console.log(`Cleared ${bufferedCount} buffered messages`);

    // Stop listening to GUN
    chatRef.off();
    console.log(`🛑 Stopped listening for messages at: ${listenPath}`);
  };
}
