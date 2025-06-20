import { copyToClipboard } from '../GlobalUtils/CopyToClipboard';
import { UserData } from '../../backend/Supabase/RegisterUser';

export const handleCopyUsername = async (
  userData: UserData | null,
  setCopyUsernameText: (text: string) => void
) => {
  if (!userData?.username) return;

  const success = await copyToClipboard(`@${userData.username}`);
  if (success) {
    setCopyUsernameText('Username Copied!');
    setTimeout(() => setCopyUsernameText(''), 2000);
  }
};
