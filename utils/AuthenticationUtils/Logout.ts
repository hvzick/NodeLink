// utils/AuthenticationUtils/Logout.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { clearAllMessagesFromDB } from '../../backend/Local database/ClearAllMessages';
import { useAuth } from './AuthContext';

export function useLogout() {
  const navigation = useNavigation();  // we won’t reset it anymore
  const { setIsLoggedIn } = useAuth();

  return () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out? All your local data will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Logging out and clearing all app data...');
              await clearAllMessagesFromDB();
              console.log('✅ Local messages cleared');

              // If you store a key‐pair by walletAddress, delete it:
              const raw = await AsyncStorage.getItem('userData');
              if (raw) {
                const { walletAddress } = JSON.parse(raw);
                if (walletAddress) {
                  await AsyncStorage.removeItem(`crypto_key_pair_${walletAddress}`);
                  console.log(`🗝️ Deleted key pair for ${walletAddress}`);
                }
              }

              // Clear AsyncStorage
              await AsyncStorage.clear();
              console.log('✅ AsyncStorage cleared');

              // Flip your auth flag
              setIsLoggedIn(false);
              console.log('🔓 Auth context updated, user logged out');

              // **NO navigation.reset() here!**
              // Your root <App> will now automatically
              // render the Auth stack instead of Main.
            } catch (error) {
              console.error('❌ Error during logout:', error);
              Alert.alert('Logout Failed', 'An error occurred while trying to log out.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
}
