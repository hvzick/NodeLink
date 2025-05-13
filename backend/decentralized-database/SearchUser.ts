// userRedirect.ts

import Gun from 'gun';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';

// Define your user data interface.
export interface UserData {
  walletAddress: string;
  username: string;
  avatar: string;
  name: string;
  bio: string;
}

// Define your navigation stack type (ensure that 'UserProfile' exists in your navigator).
export type RootStackParamList = {
  UserProfile: { userProfile: UserData };
};

export type NavigationProp = StackNavigationProp<RootStackParamList, 'UserProfile'>;

// Initialize Gun with a relay peer and AsyncStorage for persistence.
const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun'],
  localStorage: false,
  store: AsyncStorage,
});

/**
 * Searches for a user by wallet address.
 * The promise races against a 5-second timeout.
 *
 * @param walletAddress - The wallet address to search for.
 * @returns A promise that resolves with the user profile data.
 */
function searchUser(walletAddress: string): Promise<UserData> {
  const queryPromise = new Promise<UserData>((resolve, reject) => {
    gun.get('users')
      .get(walletAddress)
      .once((data: any) => {
        if (data && data.walletAddress) {
          const userProfile: UserData = {
            walletAddress: data.walletAddress,
            username: data.username,
            avatar: data.avatar,
            name: data.name,
            bio: data.bio,
          };
          resolve(userProfile);
        } else {
          reject(new Error('User not found'));
        }
      });
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), 5000)
  );

  return Promise.race([queryPromise, timeoutPromise]);
}

/**
 * Redirects to the UserProfile screen if a user is found.
 *
 * @param walletAddress - The wallet address to search for.
 * @param navigation - The navigation object to perform the redirect.
 */
export async function redirectToUserProfile(
  walletAddress: string,
  navigation: NavigationProp
): Promise<void> {
  try {
    const userProfile = await searchUser(walletAddress);
    navigation.replace('UserProfile', { userProfile });
  } catch (error) {
    console.error('Error redirecting to user profile:', error);
    // Optionally, handle error (e.g. show a notification or navigate elsewhere).
  }
}
