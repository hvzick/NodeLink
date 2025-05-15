import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'app:muteUntil';

export function useMuteSettings() {
  const [muteUntil, setMuteUntil] = useState<number>(0);

  useEffect(() => {
    // console.log('[MuteSettings] Loading muteUntil from AsyncStorage...');
    AsyncStorage.getItem(STORAGE_KEY).then(value => {
      if (value) {
        const parsed = parseInt(value, 10);
        // console.log(`[MuteSettings] Retrieved muteUntil: ${parsed}`);
        setMuteUntil(parsed);
      } else {
        // console.log('[MuteSettings] No stored muteUntil value found.');
      }
    });
  }, []);

  const isMuted = Date.now() < muteUntil;
  console.log(
    // `[MuteSettings] isMuted: ${isMuted} (Now: ${Date.now()}, muteUntil: ${muteUntil})`
  );

  const setMuteDuration = async (label: string) => {
    // console.log(`[MuteSettings] Setting mute duration for: ${label}`);
    let durationMs = 0;

    switch (label) {
      case '8 hours':
        durationMs = 8 * 60 * 60 * 1000;
        break;
      case '1 day':
        durationMs = 24 * 60 * 60 * 1000;
        break;
      case '1 week':
        durationMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case '1 month':
        durationMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case '1 year':
        durationMs = 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        // console.warn(`[MuteSettings] Unknown label received: ${label}`);
        durationMs = 0;
    }

    const until = Date.now() + durationMs;
    // console.log(
      // `[MuteSettings] Calculated muteUntil: ${until} (${new Date(until).toISOString()})`
    // );
    setMuteUntil(until);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, until.toString());
      // console.log('[MuteSettings] muteUntil saved successfully.');
    } catch (err) {
      // console.error(
        // '[MuteSettings] Failed to save muteUntil to AsyncStorage:',
      //   err
      // );
    }
  };

  return { isMuted, muteUntil, setMuteDuration };
}
