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
  radisk: false
});

const appRoot = gun.get('nodelink');
const usersNode = appRoot.get('users');

export async function registerUser(
  userInfo: UserData
): Promise<{ user: UserData; isNew: boolean }> {
  return new Promise((resolve, reject) => {
    console.log('🔍 Checking for existing user:', userInfo.walletAddress);
    
    // First, try to get the user
    const userRef = usersNode.get(userInfo.walletAddress);
    
    userRef.once((data: any) => {
      console.log('🔍 Existing user data:', data);
      
      if (data && data.walletAddress) {
        console.log('👀 Loaded existing user');
        resolve({ user: data, isNew: false });
      } else {
        console.log('✨ Registering new user');
        
        // Put the data and wait for acknowledgment
        userRef.put(userInfo, (ack: any) => {
          console.log('🔍 Put acknowledgment:', ack);
          
          if (ack.err) {
            console.error('❌ Error registering user:', ack.err);
            reject(new Error(ack.err));
          } else {
            // Verify the data was saved
            userRef.once((savedData: any) => {
              console.log('🔍 Verification of saved data:', savedData);
              
              if (savedData && savedData.walletAddress) {
                console.log('✅ User registered and verified');
                resolve({ user: savedData, isNew: true });
              } else {
                console.error('❌ Data not properly saved');
                reject(new Error('Failed to save user data'));
              }
            });
          }
        });
      }
    });
  });
}