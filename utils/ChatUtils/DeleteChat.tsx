// utils/ChatUtils/DeleteChat.ts
import { Alert } from 'react-native';
import { deleteMessagesByConversation } from '../../backend/local database/DeleteConversation'; // Import the database function

/**
 * Handles the deletion of a chat item, including its messages from the database.
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

            // Step 2: Call the original function to remove the chat from the UI.
            deleteChatFromUI();
          } catch (error) {
            console.error("Failed to complete chat deletion process:", error);
            Alert.alert("Error", "Could not delete the chat's messages. Please try again.");
          }
        },
        style: 'destructive',
      },
    ],
    { cancelable: true }
  );
};
