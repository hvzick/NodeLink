import { useEffect } from "react";
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

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const startListener = async () => {
      const myWalletAddress = await AsyncStorage.getItem("walletAddress");
      if (!myWalletAddress) {
        console.warn("❌ Cannot start listener: wallet address not found.");
        return;
      }

      cleanup = await listenForMessages(async (msg: Message) => {
        // Enhanced validation with detailed logging
        console.log(
          "📥 Message received from GUN:",
          JSON.stringify(msg, null, 2)
        );
        console.log("🔍 Message ID:", msg.id, "Sender:", msg.sender);
        console.log(
          "🔍 ID type:",
          typeof msg.id,
          "Sender type:",
          typeof msg.sender
        );

        // Improved validation to handle various edge cases
        if (
          !msg.id ||
          !msg.sender ||
          typeof msg.id !== "string" ||
          typeof msg.sender !== "string" ||
          msg.id.trim() === "" ||
          msg.sender.trim() === ""
        ) {
          return;
        }

        // Ensure required fields are properly set
        msg.conversationId = msg.conversationId || `convo_${msg.sender}`;

        // FIX: Properly handle timestamp conversion
        if (!msg.createdAt || msg.createdAt < 1000000000000) {
          if (msg.timestamp) {
            if (typeof msg.timestamp === "string") {
              msg.createdAt = new Date(msg.timestamp).getTime();
            } else if (typeof msg.timestamp === "number") {
              msg.createdAt = msg.timestamp;
            } else {
              msg.createdAt = Date.now();
            }
          } else {
            msg.createdAt = Date.now();
          }
        }

        // Set current time as receivedAt timestamp
        const currentTime = Date.now();
        msg.receivedAt = currentTime;
        console.log(
          "⏰ Message received at:",
          new Date(currentTime).toISOString()
        );

        // Change status to "received"
        msg.status = "received";

        msg.encryptionVersion = msg.encryptionVersion || "AES-256-GCM";
        msg.readAt = typeof msg.readAt === "number" ? msg.readAt : null;

        console.log("🔧 Message timing:", {
          createdAt: msg.createdAt,
          createdAtReadable: new Date(msg.createdAt).toISOString(),
          receivedAt: msg.receivedAt,
          receivedAtReadable: new Date(msg.receivedAt).toISOString(),
          timeDifference: `${(msg.receivedAt - msg.createdAt) / 1000}s`,
          status: msg.status,
        });

        // Handle shared key derivation
        let sharedKey = await AsyncStorage.getItem(`shared_key_${msg.sender}`);
        if (!sharedKey) {
          console.log("🔑 No shared key found, deriving new one...");
          sharedKey = await deriveSharedKeyWithUser(msg.sender);
          if (sharedKey) {
            await AsyncStorage.setItem(`shared_key_${msg.sender}`, sharedKey);
            console.log("🔑 Derived and stored new shared key:", sharedKey);
          } else {
            console.warn("❌ Could not derive shared key for", msg.sender);
          }
        } else {
          console.log("🔑 Using existing shared key:", sharedKey);
        }

        // Handle message decryption
        try {
          if (!msg.encryptedContent || !msg.iv || !sharedKey) {
            throw new Error("Missing encrypted fields");
          }

          const decryptedText = decryptMessage(
            msg.encryptedContent,
            sharedKey,
            msg.iv
          );
          msg.text = decryptedText;
          msg.decrypted = true;
          console.log("✅ Decrypted message:", decryptedText);
        } catch (error) {
          msg.text = "[Unable to decrypt, Keys might have changed in transit]";
          msg.decrypted = false;
          console.warn("❌ Failed to decrypt:", error);
        }

        // Verify message signature after decryption
        let signatureVerified = false;
        try {
          if (msg.signature && msg.signatureNonce && msg.signatureTimestamp) {
            console.log("🔍 Verifying message signature...");
            
            // Get detailed verification status (simplified version)
            const verificationStatus = await MessageVerifier.getVerificationStatus(msg);
            signatureVerified = verificationStatus.signatureValid && verificationStatus.integrityValid;
            
            console.log(`🔏 Signature verification: ${signatureVerified ? "✅ Valid" : "❌ Invalid"}`);
            console.log(`🧮 Integrity check: ${verificationStatus.integrityValid ? "✅ Valid" : "❌ Invalid"}`);
            console.log(`📝 Verification details: ${verificationStatus.details}`);

            // Log signature verification results
            if (!signatureVerified) {
              console.warn("⚠️ Message signature verification failed - potential security issue");
              // Optionally mark the message with a security warning
              if (!verificationStatus.signatureValid) {
                msg.text = `[⚠️ UNVERIFIED MESSAGE] ${msg.text}`;
              }
            }
          } else {
            console.log("ℹ️ Message received without signature data - treating as legacy message");
            signatureVerified = false; // Legacy messages without signatures
          }
        } catch (error) {
          console.error("❌ Signature verification error:", error);
          signatureVerified = false;
        }

        // Update message with verification status
        msg.signatureVerified = signatureVerified;

        // Insert message into database with signature verification status
        try {
          console.log("💾 Inserting message into database...");
          await insertMessage(msg);
          console.log(
            "✅ Message inserted successfully with status:",
            msg.status,
            "Signature verified:",
            signatureVerified
          );
        } catch (err) {
          console.warn("❌ DB insert failed:", err);
        }

        // Auto-delete message from GunDB
        try {
          gun.get(`nodelink/${myWalletAddress}`).get(msg.id).put(null);
          console.log(`🗑️ Auto-deleted message ${msg.id} from GunDB.`);
        } catch (err) {
          console.warn("❌ Auto-delete failed:", err);
        }

        // Emit new message event with signature verification status
        EventBus.emit("new-message", { 
          ...msg, 
          signatureVerified 
        });

        // Update chat UI with basic info (profile loading now handled in App.tsx)
        const preview =
          msg.text ||
          (msg.imageUrl ? "Image" : msg.videoUrl ? "Video" : "Attachment");

        formatTimeForUser(msg.createdAt).then((formattedTime) => {
          // Add security indicator to chat preview if signature verification failed
          const securityIndicator = signatureVerified ? "" : "🔓 ";
          
          addOrUpdateChat({
            id: msg.conversationId,
            name: `User ${msg.sender.slice(0, 6)}...`, // Default name until profile loads
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
    };
  }, [addOrUpdateChat]);

  return null;
};

export default GlobalMessageListener;
