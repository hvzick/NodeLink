import Gun from 'gun';
import 'gun/sea.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserData {
  walletAddress: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
}

// Default user data configuration
export const DEFAULT_USER_DATA = {
  name: "NodeLink User",
  bio: "Im not being spied on",
  avatar: "default",
  username: "user" + Math.random().toString(36).substring(2, 8)
};

const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun'],
  localStorage: false,
});

const appRoot = gun.get('nodelink');
const usersNode = appRoot.get('users');

export async function getOrRegisterUser(
  userInfo: UserData
): Promise<{ user: UserData; isNew: boolean }> {
  return new Promise((resolve, reject) => {
    const userRef = usersNode.get(userInfo.walletAddress);

    userRef.once((data: any) => {
      if (data && data.walletAddress) {
        console.log('👀 Loaded existing user');
        resolve({ user: data, isNew: false });
      } else {
        console.log('✨ Registering new user');
        userRef.put(userInfo, (ack: any) => {
          if (ack.err) {
            reject(new Error(ack.err));
          } else {
            console.log('✅ User registered');
            resolve({ user: userInfo, isNew: true });
          }
        });
      }
    });
  });
}

// Main function to handle user registration
export async function registerUser(): Promise<void> {
  try {
    console.log("🔍 Starting user registration...");
    
    // Get wallet address from AsyncStorage
    const walletAddress = await AsyncStorage.getItem("walletAddress");
    console.log("📝 Retrieved wallet address:", walletAddress);
    
    if (!walletAddress) {
      console.log("❌ No wallet address found in AsyncStorage");
      return;
    }

    // Create user data using default configuration
    const userData: UserData = {
      walletAddress,
      ...DEFAULT_USER_DATA
    };

    // Check if user exists or register new user
    const { user, isNew } = await getOrRegisterUser(userData);
    console.log(isNew ? '✨ User registered:' : '👀 User loaded:', user);

    // Store user data locally
    await AsyncStorage.setItem("userData", JSON.stringify(user));
    console.log("💾 User data stored locally");

  } catch (error) {
    console.error("❌ Error in user registration:", error);
  }
}