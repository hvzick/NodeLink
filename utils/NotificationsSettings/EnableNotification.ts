// NotificationsSettings/EnableNotification.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { triggerLightHapticFeedback } from '../../utils/GlobalUtils/HapticFeedback';

const STORAGE_KEY = '@app:notificationsEnabled';
const QUIET_KEY   = 'quietHours';

type QuietRange = {
  start: { h: number; m: number };
  end:   { h: number; m: number };
};

// ─── Setup handler to respect quiet hours ───────────────────────────
// At top of EnableNotification.ts, after your imports:
Notifications.setNotificationHandler({
  handleNotification: async notification => {
    // load quiet hours…
    const raw = await AsyncStorage.getItem(QUIET_KEY);
    let inQuiet = false;
    if (raw) {
      try {
        const { start, end } = JSON.parse(raw) as QuietRange;
        const now = new Date();
        const total = now.getHours() * 60 + now.getMinutes();
        const s = start.h * 60 + start.m;
        const e = end.h   * 60 + end.m;
        inQuiet = s < e ? (total >= s && total < e) : (total >= s || total < e);
      } catch { inQuiet = false; }
    }

    console.log('[EnableNotification] inQuietHours=', inQuiet);

    return {
      shouldShowAlert:      !inQuiet,
      shouldPlaySound:      !inQuiet,
      shouldSetBadge:       false,
      shouldShowBanner:     !inQuiet,
      shouldShowList:       !inQuiet,
    };
  },
});


async function ensureNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    return newStatus === 'granted';
  }
  return true;
}

async function enableNotifications(): Promise<void> {
  const granted = await ensureNotificationPermission();
  console.log('[EnableNotification] permission granted?', granted);
  if (!granted) return;

  await AsyncStorage.setItem(STORAGE_KEY, 'true');
  console.log('[EnableNotification] saved ENABLED');

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    // send tokenData to your backend…
    console.log('[EnableNotification] got push token:', tokenData);
  } catch (err: any) {
    if (!err.message?.includes('projectId')) {
      console.error('[EnableNotification] push token error:', err);
    }
  }
}

async function disableNotifications(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, 'false');
  console.log('[EnableNotification] saved DISABLED');

  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[EnableNotification] canceled scheduled notifications');
}

export async function loadNotificationEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(STORAGE_KEY);
  console.log('[EnableNotification] loaded:', val);
  return val === 'true';
}

/**
 * Directly set notifications on/off to match `desired` and return it.
 * Use this in your Switch handler.
 */
export async function setNotificationsEnabled(desired: boolean): Promise<boolean> {
  console.log('[EnableNotification] set desired =', desired);
  if (desired) {
    await enableNotifications();
  } else {
    await disableNotifications();
  }
  triggerLightHapticFeedback();
  return desired;
}
