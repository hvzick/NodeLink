/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";
import { Message } from "../../Local database/SQLite/MessageStructure";
import { insertMessage } from "../../Local database/SQLite/InsertMessage";
import { useChat, EventBus } from "../../../utils/ChatUtils/ChatContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { gun } from "../GunState";
import { decryptMessage } from "../../../backend/E2E-Encryption/Decrypt";
import { deriveSharedKeyWithUser } from "../../../backend/E2E-Encryption/SharedKey";
import { formatTimeForUser } from "../../../utils/GlobalUtils/FormatDate";
import { listenForMessages } from "./RecieveMessages";
import { MessageVerifier } from "../../../backend/E2E-Encryption/VerifyMessageSignature";

const GlobalMessageListener = () => {
  const { addOrUpdateChat } = useChat();

  // Simple deduplication since RecieveMessages.ts now handles message completeness
  const processedMessageIds = useRef(new Set<string>());

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const startListener = async () => {
      const myWalletAddress = await AsyncStorage.getItem("walletAddress");
      if (!myWalletAddress) {
        console.warn("❌ Cannot start listener: wallet address not found.");
        return;
      }

      cleanup = await listenForMessages(async (msg: Message) => {
        console.log("Complete signed message received from RecieveMessages");

        // Basic validation (should always pass since RecieveMessages validates)
        if (
          !msg.id ||
          !msg.sender ||
          typeof msg.id !== "string" ||
          typeof msg.sender !== "string" ||
          msg.id.trim() === "" ||
          msg.sender.trim() === ""
        ) {
          console.log("❌ Invalid message data, skipping");
          return;
        }

        // Simple deduplication check
        if (processedMessageIds.current.has(msg.id)) {
          console.log(`Message ${msg.id} already processed, skipping`);
          return;
        }

        // Mark as processed immediately since we know it's complete
        processedMessageIds.current.add(msg.id);
        console.log(`Processing complete signed message ${msg.id}...`);

        // Ensure required fields are properly set
        msg.conversationId = msg.conversationId || `convo_${msg.sender}`;
        msg.receiver = msg.receiver || myWalletAddress;

        // Handle timestamp fields
        msg.timestamp = new Date(msg.createdAt || Date.now()).toISOString();
        msg.receivedAt = Date.now();
        msg.status = "received";
        msg.encryptionVersion = msg.encryptionVersion || "AES-256-GCM";
        msg.readAt = typeof msg.readAt === "number" ? msg.readAt : null;

        console.log(
          "Message received at:",
          new Date(msg.receivedAt).toISOString()
        );

        // Handle shared key derivation
        let sharedKey = await AsyncStorage.getItem(`shared_key_${msg.sender}`);
        if (!sharedKey) {
          console.log("No shared key found, deriving new one...");
          sharedKey = await deriveSharedKeyWithUser(msg.sender);
          if (sharedKey) {
            await AsyncStorage.setItem(`shared_key_${msg.sender}`, sharedKey);
            console.log("Derived and stored new shared key");
          } else {
            console.warn("❌ Could not derive shared key for", msg.sender);
            return;
          }
        }

        // Handle message decryption
        try {
          const decryptedText = decryptMessage(
            msg.encryptedContent,
            sharedKey,
            msg.iv
          );
          msg.text = decryptedText;
          msg.decrypted = true;
          msg.encrypted = true;
          console.log("Decrypted message:", decryptedText);
        } catch (error) {
          msg.text = "[Unable to decrypt, Keys might have changed in transit]";
          msg.decrypted = false;
          msg.encrypted = true;
          console.warn("❌ Failed to decrypt:", error);
        }

        // Verify message signature (guaranteed to have signature data)
        let signatureVerified = false;
        try {
          console.log("Verifying message signature...");

          const verificationStatus =
            await MessageVerifier.getVerificationStatus(msg);
          signatureVerified =
            verificationStatus.signatureValid &&
            verificationStatus.integrityValid;

          console.log(
            `Signature verification: ${signatureVerified ? "Valid" : "Invalid"}`
          );
          console.log(
            `Integrity check: ${
              verificationStatus.integrityValid ? "Valid" : "Invalid"
            }`
          );

          if (!signatureVerified) {
            console.warn("Message signature verification failed");
            msg.text = `[UNVERIFIED MESSAGE] ${msg.text}`;
          }
        } catch (error) {
          console.error("❌ Signature verification error:", error);
          signatureVerified = false;
        }

        // Update message with verification status
        msg.signatureVerified = signatureVerified;
        // Insert message into database
        try {
          console.log("Inserting message into database...");
          await insertMessage(msg);
          console.log(
            "Message inserted successfully - Signature verified:",
            signatureVerified
          );
        } catch (err) {
          console.warn("❌ DB insert failed:", err);
          processedMessageIds.current.delete(msg.id); // Allow retry
          return;
        }

        // Auto-delete message from GunDB
        try {
          gun.get(`nodelink/${myWalletAddress}`).get(msg.id).put(null);
          console.log(`Auto-deleted message ${msg.id} from GunDB`);
        } catch (err) {
          console.warn("❌ Auto-delete failed:", err);
        }

        // Emit new message event
        EventBus.emit("new-message", {
          ...msg,
          signatureVerified,
        });

        // Update chat UI
        const preview =
          msg.text ||
          (msg.imageUrl ? "Image" : msg.videoUrl ? "Video" : "Attachment");

        formatTimeForUser(msg.createdAt).then((formattedTime) => {
          const securityIndicator = signatureVerified ? "" : "🔓 ";

          addOrUpdateChat({
            id: msg.conversationId,
            name: `User ${msg.sender.slice(0, 6)}...`,
            avatar: require("../../../assets/images/default-user-avatar.jpg"),
            message: `${securityIndicator}${preview}`,
            time: formattedTime,
          });
        });
      });
    };

    startListener();
    return () => {
      if (cleanup) cleanup();
      processedMessageIds.current.clear();
    };
  }, [addOrUpdateChat]);

  return null;
};

export default GlobalMessageListener;
