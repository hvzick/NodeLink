// deleteUser.ts

import Gun from 'gun';
import 'gun/sea.js'; // if you ever add auth

// Initialize GUN
const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun'],
  localStorage: false,
});

const usersNode = gun.get('nodelink').get('users');

/**
 * Deletes a user from nodelink/users by setting their node to null.
 * @param walletAddress - The wallet address (key) of the user to delete.
 */
export async function deleteUser(walletAddress: string): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      usersNode.get(walletAddress).put(null, (ack: any) => {
        if (ack.err) {
          reject(new Error(`Failed to delete user ${walletAddress}: ${ack.err}`));
        } else {
          console.log(`🗑️  User ${walletAddress} deleted successfully.`);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('❌ Error deleting user:', (error as Error).message);
  } finally {
    process.exit(0);
  }
}
deleteUser('0x123abc456def789ghi');