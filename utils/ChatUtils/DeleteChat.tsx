import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteMessagesByConversation } from "../../backend/Local database/SQLite/DeleteConversation";
import { deleteConversationFromMyNode } from "../../backend/Gun Service/Messaging/DeleteFromGun";

/**
 * Handles the deletion of a chat item, including its messages from the database,
 * associated shared key, and GunDB conversation node.
 *
 * @param conversationId The ID of the conversation to delete.
 * @param chatName The name of the chat for the confirmation message.
 * @param deleteChatFromUI The function from the context that removes the chat from the UI list.
 */
export const handleDeleteChat = (
  conversationId: string,
  chatName: string,
  deleteChatFromUI: () => void
) => {
  Alert.alert(
    `Delete Chat`,
    `Are you sure you want to delete your chat with ${chatName}? This action cannot be undone.`,
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: async () => {
          try {
            // 🧠 Step 1: Extract the other wallet address from convo ID
            const otherWallet = conversationId.replace(/^convo_/, "");

            // 🗑️ Step 2: Delete from GunDB node
            await deleteConversationFromMyNode(otherWallet);

            // 🧹 Step 3: Delete messages from local DB
            await deleteMessagesByConversation(conversationId);

            // 🔑 Step 4: Remove shared key from local storage (FIXED)
            const sharedKeyStorageKey = `shared_key_${otherWallet}`;
            await AsyncStorage.removeItem(sharedKeyStorageKey);
            console.log(`🗑️ Shared key removed for: ${sharedKeyStorageKey}`);

            // 🔑 Step 5: Also remove user profile cache if it exists
            const userProfileKey = `user_profile_${otherWallet}`;
            await AsyncStorage.removeItem(userProfileKey);
            console.log(`🗑️ User profile cache removed for: ${userProfileKey}`);

            // Step 6: Update UI
            deleteChatFromUI();
          } catch (error) {
            console.error("Failed to complete chat deletion process:", error);
            Alert.alert(
              "Error",
              "Could not delete the chat's data. Please try again."
            );
          }
        },
        style: "destructive",
      },
    ],
    { cancelable: true }
  );
};
