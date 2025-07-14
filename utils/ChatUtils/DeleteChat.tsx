import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteMessagesByConversation } from '../../backend/Local database/DeleteConversation';

/**
 * Handles the deletion of a chat item, including its messages from the database
 * and the associated shared key from local storage.
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
            // Step 1: Delete all messages from the database for this conversation.
            await deleteMessagesByConversation(conversationId);

            // Step 2: Delete the shared key from local storage.
            const storageKey = `shared_key_${conversationId}`;
            await AsyncStorage.removeItem(storageKey);
            console.log(`🗑️ Shared key removed for: ${storageKey}`);

            // Step 3: Call the original function to remove the chat from the UI.
            deleteChatFromUI();
          } catch (error) {
            console.error("Failed to complete chat deletion process:", error);
            Alert.alert("Error", "Could not delete the chat's messages or shared key. Please try again.");
          }
        },
        style: 'destructive',
      },
    ],
    { cancelable: true }
  );
};
