import Gun from 'gun';
import 'gun/sea.js'; // Optional if you want to add auth later

export interface UserData {
  walletAddress: string;
  username: string;
  avatar: string;
  name: string;
  bio: string;
}

const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun'],
  localStorage: false,
});

const usersNode = gun.get('nodelink').get('users');

/**
 * Modifies user data for a given walletAddress.
 */
export async function updateUserData(
  walletAddress: string,
  updates: Partial<UserData>
): Promise<void> {
  try {
    const userRef = usersNode.get(walletAddress);

    const oldData = await new Promise<UserData | null>((resolve) => {
      userRef.once((data: any) => {
        resolve(data && data.walletAddress ? data : null);
      });
    });

    if (!oldData) {
      console.log(`⚠️ No user found with wallet address: ${walletAddress}`);
      return;
    }

    // Apply updates
    const newData = { ...oldData, ...updates };

    // Save the updated data
    await new Promise<void>((resolve, reject) => {
      userRef.put(newData, (ack: any) => {
        if (ack.err) reject(new Error(ack.err));
        else resolve();
      });
    });

    console.log('✅ User data updated!');
    console.log('🔴 Old Data:', oldData);
    console.log('🟢 New Data:', newData);
  } catch (err) {
    console.error('❌ Failed to update user:', err);
  } finally {
    process.exit(0);
  }
}
