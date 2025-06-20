import { Linking } from 'react-native';
import { UserData } from '../../backend/Supabase/RegisterUser';

export const handleOpenEtherscan = async (userData: UserData | null) => {
  if (!userData?.walletAddress) return;

  const url = `https://sepolia.etherscan.io/address/${userData.walletAddress}`;

  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error('Error opening Etherscan:', error);
  }
};
