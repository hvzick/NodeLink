import Gun from 'gun';
import 'gun/sea.js';
import { UserData } from './RegisterUser';

const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun'],
  localStorage: false,
});

const appRoot = gun.get('nodelink');
const usersNode = appRoot.get('users');

export async function fetchAllUsers(): Promise<UserData[]> {
  return new Promise((resolve, reject) => {
    const users: UserData[] = [];
    
    usersNode.map().once((data: any, key: string) => {
      if (data && data.walletAddress) {
        console.log('👤 Found user:', data);
        users.push(data);
      }
    });

    // Wait for 5 seconds to collect all users
    setTimeout(() => {
      console.log(`📊 Total users found: ${users.length}`);
      resolve(users);
    }, 5000);
  });
}

// Example usage
(async () => {
  try {
    console.log('🔍 Fetching all users...');
    const users = await fetchAllUsers();
    console.log('✅ Users fetched successfully:');
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('Wallet:', user.walletAddress);
      console.log('Name:', user.name);
      console.log('Username:', user.username);
      console.log('Bio:', user.bio);
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
  } finally {
    process.exit(0);
  }
})();
