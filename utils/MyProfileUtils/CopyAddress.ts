import { copyToClipboard } from '../GlobalUtils/CopyToClipboard';
import { UserData } from '../../backend/Supabase/RegisterUser';

export const handleCopyAddress = async (
  userData: UserData | null,
  setCopyWalletText: (text: string) => void
) => {
  if (!userData?.walletAddress) return;

  const success = await copyToClipboard(userData.walletAddress);
  if (success) {
    setCopyWalletText('Wallet Address Copied!');
    setTimeout(() => setCopyWalletText(''), 2000);
  }
};
