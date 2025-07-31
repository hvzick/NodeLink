// utils/AuthenticationUtils/Logout.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAllMessagesFromDB } from "../../backend/Local database/SQLite/ClearAllMessages";
import { useAuth } from "./AuthContext";

const CHAT_LIST_STORAGE_KEY = "chats";

export function useLogout() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigation = useNavigation();
  const { setIsLoggedIn } = useAuth();

  return () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out? All your local data will be cleared.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(
                "🚪 Starting logout process - clearing all app data..."
              );

              // Step 1: Clear SQLite database (messages)
              try {
                await clearAllMessagesFromDB();
                console.log("Local messages cleared from SQLite");
              } catch (error) {
                console.error("❌ Error clearing SQLite messages:", error);
              }

              // Step 2: Get current user data before clearing for cleanup
              let currentWalletAddress = null;
              try {
                const walletAddress = await AsyncStorage.getItem(
                  "walletAddress"
                );
                if (walletAddress) {
                  currentWalletAddress = walletAddress;
                }
              } catch (error) {
                console.warn("⚠️ Could not retrieve wallet address:", error);
              }

              // Step 3: Clear user-specific data
              if (currentWalletAddress) {
                try {
                  // Remove crypto key pair
                  await AsyncStorage.removeItem(
                    `crypto_key_pair_${currentWalletAddress}`
                  );
                  console.log(
                    `🗝️ Deleted key pair for ${currentWalletAddress}`
                  );

                  // Remove user-specific storage keys
                  const userSpecificKeys = [
                    `user_${currentWalletAddress}`,
                    `profile_${currentWalletAddress}`,
                    `settings_${currentWalletAddress}`,
                  ];
                  await AsyncStorage.multiRemove(userSpecificKeys);
                  console.log("🗑️ User-specific data removed");
                } catch (error) {
                  console.error("❌ Error clearing user-specific data:", error);
                }
              }

              // Step 4: Clear all conversation and chat-related data
              try {
                const allKeys = await AsyncStorage.getAllKeys();
                const chatRelatedKeys = allKeys.filter(
                  (key) =>
                    key.startsWith("shared_key_convo_") ||
                    key.startsWith("conversation_") ||
                    key.startsWith("last_message_") ||
                    key.startsWith("chat_metadata_") ||
                    key.includes("convo_") ||
                    key === CHAT_LIST_STORAGE_KEY
                );

                if (chatRelatedKeys.length > 0) {
                  await AsyncStorage.multiRemove(chatRelatedKeys);
                  console.log(
                    `🗑️ Removed ${chatRelatedKeys.length} chat-related keys`
                  );
                }
              } catch (error) {
                console.error("❌ Error clearing chat-related data:", error);
              }

              // Step 5: Clear main user data storage keys
              try {
                const mainDataKeys = [
                  "userData",
                  "sessionData",
                  "currentUser",
                  "walletAddress",
                  "userPreferences",
                  "appSettings",
                ];
                await AsyncStorage.multiRemove(mainDataKeys);
                console.log("🗑️ Main data keys cleared");
              } catch (error) {
                console.error("❌ Error clearing main data keys:", error);
              }

              // Step 6: Final cleanup - clear any remaining data
              try {
                await AsyncStorage.clear();
                console.log("Complete AsyncStorage cleared");
              } catch (error) {
                console.error(
                  "❌ Error during final AsyncStorage clear:",
                  error
                );
              }

              // Step 7: Update authentication state
              setIsLoggedIn(false);
              console.log("Auth context updated, user logged out");

              console.log("Logout process completed successfully");
            } catch (error) {
              console.error("❌ Critical error during logout:", error);
              Alert.alert(
                "Logout Failed",
                "An error occurred while trying to log out. Some data may not have been cleared."
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
}
