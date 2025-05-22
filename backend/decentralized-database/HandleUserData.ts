import Gun from 'gun';
import 'gun/sea.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, DEFAULT_USER_DATA, registerUser } from './RegisterUser';
import { searchUser } from './SearchUser';

const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun'],
  localStorage: false,
});

const appRoot = gun.get('nodelink');
const usersNode = appRoot.get('users');

export async function handleUserData(): Promise<void> {
  try {
    console.log("Starting user data handling...");
    
    // Get wallet address from AsyncStorage
    const walletAddress = await AsyncStorage.getItem("walletAddress");
    console.log("Retrieved wallet address:", walletAddress);
    
    if (!walletAddress) {
      console.log("No wallet address found - skipping user data handling");
      return;
    }

    try {
      // Always search for existing user in Gun.js first
      console.log("Searching for existing user in Gun.js...");
      const existingUser = await searchUser(walletAddress);
      console.log("Found existing user:");
      
      // Store user data locally after fetching from Gun.js
      await AsyncStorage.setItem("userData", JSON.stringify(existingUser));
      console.log("User data stored locally");
      
    } catch (error) {
      // If user not found, register new user
      console.log("User not found in Gun.js:", error);
      console.log("Registering new user...");
      
      // Create new user data
      const newUserData: UserData = {
        walletAddress,
        ...DEFAULT_USER_DATA
      };

      // Register new user using the imported function
      const { user } = await registerUser(newUserData);
      console.log("New user registered:", user);

      // Store new user data locally
      await AsyncStorage.setItem("userData", JSON.stringify(user));
      console.log("New user data stored locally");
    }

  } catch (error) {
    console.error("Error in user data handling:", error);
  }
}
