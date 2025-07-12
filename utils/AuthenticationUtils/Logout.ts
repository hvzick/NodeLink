// utils/Auth/handleLogout.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import { clearAllMessagesFromDB } from '../../backend/local database/ClearAllMessages'; // You need to create this helper function
import { Alert } from 'react-native'; // Import Alert

/**
 * Prompts the user to confirm logout, and if confirmed, clears all app data
 * and resets navigation to the Auth screen.
 *
 * @param navigation The navigation object, used to reset the navigation stack.
 */
export const logout = (navigation: NavigationProp<any>) => {
  // Show a confirmation dialog before proceeding.
  Alert.alert(
    "Confirm Logout",
    "Are you sure you want to log out? All your local data will be cleared.",
    [
      {
        text: "Cancel",
        onPress: () => console.log("Logout cancelled"),
        style: "cancel"
      },
      {
        text: "Logout",
        style: "destructive",
        // The actual logout logic is now inside the onPress handler for the "Logout" button.
        onPress: async () => {
          console.log("Logging out and clearing all app data...");
          try {
            // Step 1: Delete all messages from the SQLite database.
            await clearAllMessagesFromDB();

            // Step 2: Clear all data from AsyncStorage (session, chat lists, etc.).
            await AsyncStorage.clear();
            console.log("✅ Storage cleared");

            // Step 3: Reset the navigation stack to the Auth screen.
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
            console.log("✅ Navigation reset to Auth screen");

          } catch (error) {
            console.error("❌ A critical error occurred during the logout process:", error);
            // Optionally, show another alert if the logout fails.
            Alert.alert("Logout Failed", "An error occurred while trying to log out.");
          }
        }
      }
    ],
    { cancelable: true } // Allows user to dismiss the alert by tapping outside of it on Android
  );
};
