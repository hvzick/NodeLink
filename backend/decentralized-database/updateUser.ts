import Gun from 'gun';

// Initialize GUN
const gun = Gun({ peers: ['https://gun-manhattan.herokuapp.com/gun'] });

// User profile structure
export interface UserData {
  username: string;
  avatar: string;
  name: string;
  bio: string;
}

/**
 * Updates a user's profile in the GUN DB (no auth) and logs before/after values.
 * @param walletAddress - The wallet address (used as key)
 * @param updatedData - Object containing profile fields to update
 */
export function updateUser(walletAddress: string, updatedData: Partial<UserData>) {
  const userRef = gun.get('nodelink').get('users').get(walletAddress);

  userRef.once((oldData: UserData) => {
    if (!oldData) {
      console.log(`🔍 No user found for wallet: ${walletAddress}`);
      return;
    }

    console.log(`📄 Old data for ${walletAddress}:`, oldData);

    userRef.put(updatedData, (ack: any) => {
      if (ack.err) {
        console.error('❌ Update failed:', ack.err);
        return;
      }

      // Re-fetch after update to show latest data
      setTimeout(() => {
        userRef.once((newData: UserData) => {
          console.log(`✅ New data for ${walletAddress}:`, newData);
        });
      }, 1000); // slight delay to allow GUN to propagate
    });
  });
}
