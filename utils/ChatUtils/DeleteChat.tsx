import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteMessagesByConversation } from '../../backend/Local database/DeleteConversation';
import { deleteConversationFromMyNode } from '../../backend/Gun Service/Messaging/DeleteFromGun'; // ✅ Import Gun delete

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
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            // 🧠 Step 1: Extract the other wallet address from convo ID
            const otherWallet = conversationId.replace(/^convo_/, '');

            // 🗑️ Step 2: Delete from GunDB node
            await deleteConversationFromMyNode(otherWallet);

            // 🧹 Step 3: Delete messages from local DB
            await deleteMessagesByConversation(conversationId);

            // 🔑 Step 4: Remove shared key from local storage
            const storageKey = `shared_key_${conversationId}`;
            await AsyncStorage.removeItem(storageKey);
            console.log(`🗑️ Shared key removed for: ${storageKey}`);

            // ✅ Step 5: Update UI
            deleteChatFromUI();
          } catch (error) {
            console.error("Failed to complete chat deletion process:", error);
            Alert.alert("Error", "Could not delete the chat's data. Please try again.");
          }
        },
        style: 'destructive',
      },
    ],
    { cancelable: true }
  );
};
