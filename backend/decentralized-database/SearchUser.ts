// userRedirect.ts

import Gun from 'gun';
import { UserData } from './RegisterUser';
import AsyncStorage from '@react-native-async-storage/async-storage';

const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun'],
  localStorage: false,
});

export async function searchUser(walletAddress: string): Promise<UserData> {
  return new Promise((resolve, reject) => {
    gun.get('nodelink')
      .get('users')
      .get(walletAddress)
      .once((data: any) => {
        if (data && data.walletAddress) {
          resolve(data);
        } else {
          reject(new Error('User not found'));
        }
      });

    // Add timeout
    setTimeout(() => reject(new Error('Request timed out')), 5000);
  });
}

// Test function
export async function testSearchUser(): Promise<void> {
  try {
    const walletAddress = await AsyncStorage.getItem("walletAddress");
    if (!walletAddress) {
      console.log("❌ No wallet address found in AsyncStorage");
      return;
    }
    
    const user = await searchUser(walletAddress);
    console.log('User found:', user);
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

// Run search and exit
// (async () => {
//   try {
//     const user = await searchUser('0xe65eac370db1079688f8e1e4b9a35a841aac2bac');
//     console.log('User found:', user);
//     process.exit(0);
//   } catch (err: any) {
//     console.error('Error:', err.message);
//     process.exit(1);
//   }
// })();
