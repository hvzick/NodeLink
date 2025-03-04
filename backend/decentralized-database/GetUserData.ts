import Gun from 'gun';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the structure of your user data
export interface UserData {
  walletAddress: string;
  username: string;
  avatar: string;
  name: string;
  bio: string;
}

// Initialize Gun with a relay peer and AsyncStorage for persistence
const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun'], // optional relay peer
  localStorage: false, // disable browser localStorage for React Native
  store: AsyncStorage, // use AsyncStorage for storage
});

/**
 * Checks if a user with the given wallet address exists in the database.
 * If not, creates a new user with the provided default data.
 * 
 * @param walletAddress - The wallet address serving as the primary key.
 * @param defaultData - The default user data (excluding the wallet address).
 * @returns A promise that resolves to the existing or newly created user data.
 */
export function getOrCreateUserData(
  walletAddress: string,
  defaultData: Omit<UserData, 'walletAddress'>
): Promise<UserData> {
  return new Promise((resolve, reject) => {
    // Try to fetch the user data once from Gun
    gun.get('users')
      .get(walletAddress)
      .once((data: any) => {
        if (data && data.walletAddress) {
          // User exists – return the fetched data
          const existingUser: UserData = {
            walletAddress: data.walletAddress,
            username: data.username,
            avatar: data.avatar,
            name: data.name,
            bio: data.bio,
          };
          resolve(existingUser);
        } else {
          // User doesn't exist – create a new user entry
          const newUser: UserData = {
            walletAddress,
            ...defaultData,
          };
          gun.get('users')
            .get(walletAddress)
            .put(newUser, (ack: any) => {
              if (ack && ack.err) {
                console.error("Error creating user:", ack.err);
                reject(ack.err);
              } else {
                resolve(newUser);
              }
            });
        }
      });
  });
}
