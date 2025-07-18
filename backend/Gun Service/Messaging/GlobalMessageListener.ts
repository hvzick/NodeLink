import { useEffect } from "react";
import { Message } from "../../Local database/SQLite/MessageStructure";
import { insertMessage } from "../../Local database/SQLite/InsertMessage";
import { useChat, EventBus } from "../../../utils/ChatUtils/ChatContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchAndCacheUserProfile } from "../../../backend/Supabase/FetchAvatarAndName";
import { listenForMessages } from "./RecieveMessages";
import { gun } from "../GunState";
import { decryptMessage } from "../../../backend/Encryption/Decrypt";
import { deriveSharedKeyWithUser } from "../../../backend/Encryption/SharedKey";
import { formatTimeForUser } from "../../../utils/GlobalUtils/FormatDate";

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
        if (!msg.id || !msg.sender) {
          console.warn("⚠️ Invalid message, missing id or sender. Skipping.");
          return;
        }

        msg.conversationId = msg.conversationId || `convo_${msg.sender}`;
        msg.createdAt =
          msg.createdAt ||
          (msg.timestamp ? parseInt(msg.timestamp, 10) : Date.now());
        msg.receivedAt = Date.now();
        // Important: Always ensure these two fields are set
        msg.encryptionVersion = msg.encryptionVersion || "AES-256-GCM";
        msg.readAt = typeof msg.readAt === "number" ? msg.readAt : null;

        let sharedKey = await AsyncStorage.getItem(`shared_key_${msg.sender}`);
        if (!sharedKey) {
          sharedKey = await deriveSharedKeyWithUser(msg.sender);
          if (sharedKey) {
            await AsyncStorage.setItem(`shared_key_${msg.sender}`, sharedKey);
            console.log("🔑 Derived and stored new shared key:", sharedKey);
          } else {
            console.warn("❌ Could not derive shared key for", msg.sender);
          }
        }
        console.log("🔑 Shared key:", sharedKey);
        console.log("🔐 IV:", msg.iv);
        console.log("🔐 Encrypted Content:", msg.encryptedContent);

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

        try {
          await insertMessage(msg);
        } catch (err) {
          console.warn("❌ DB insert failed:", err);
        }

        try {
          gun.get(`nodelink/${myWalletAddress}`).get(msg.id).put(null);
          console.log(`🗑️ Auto-deleted message ${msg.id} from GunDB.`);
        } catch (err) {
          console.warn("❌ Auto-delete failed:", err);
        }

        EventBus.emit("new-message", msg);

        const profile = await fetchAndCacheUserProfile(msg.conversationId);
        if (!profile) {
          console.warn(`⚠️ No profile found for ${msg.sender}`);
          return;
        }

        const preview =
          msg.text ||
          (msg.imageUrl ? "Image" : msg.videoUrl ? "Video" : "Attachment");

        formatTimeForUser(msg.createdAt).then((formattedTime) => {
          addOrUpdateChat({
            id: msg.conversationId,
            name: profile.name,
            avatar: profile.avatar
              ? { uri: profile.avatar }
              : require("../../../assets/images/default-user-avatar.jpg"),
            message: preview,
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
