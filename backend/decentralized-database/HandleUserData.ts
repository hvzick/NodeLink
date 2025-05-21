import Gun from 'gun';
import 'gun/sea.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, DEFAULT_USER_DATA } from './RegisterUser';
import { searchUser } from './SearchUser';

const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun'],
  localStorage: false,
});

const appRoot = gun.get('nodelink');
const usersNode = appRoot.get('users');

export async function handleUserData(): Promise<void> {
  try {
    console.log("🔍 Starting user data handling...");
    
    // Get wallet address from AsyncStorage
    const walletAddress = await AsyncStorage.getItem("walletAddress");
    console.log("📝 Retrieved wallet address:", walletAddress);
    
    if (!walletAddress) {
      console.log("❌ No wallet address found in AsyncStorage");
      return;
    }

    try {
      // First try to search for existing user
      console.log("🔎 Searching for existing user...");
      const existingUser = await searchUser(walletAddress);
      console.log("👤 Found existing user:", existingUser);
      
      // Store existing user data locally
      await AsyncStorage.setItem("userData", JSON.stringify(existingUser));
      console.log("💾 Existing user data stored locally");
      
    } catch (error) {
      // If user not found, register new user
      console.log("❌ User not found:", error);
      console.log("Registering new user...");
      
      // Create new user data
      const newUserData: UserData = {
        walletAddress,
        ...DEFAULT_USER_DATA
      };

      // Register new user
      const { user } = await getOrRegisterUser(newUserData);
      console.log("✨ New user registered:", user);

      // Store new user data locally
      await AsyncStorage.setItem("userData", JSON.stringify(user));
      console.log("💾 New user data stored locally");
    }

  } catch (error) {
    console.error("❌ Error in user data handling:", error);
  }
}

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
