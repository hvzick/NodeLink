// NotificationsSettings/EnableNotification.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { triggerTapHapticFeedback } from '../GlobalUtils/TapHapticFeedback';

// ─── Foreground notification handler ─────────────────────────────────
// Ensure notifications show alerts, sounds, banners, and list entries when the app is in the foreground

// …at top level, once when your app mounts:
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, 
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true  
  }),
});

const STORAGE_KEY = '@app:notificationsEnabled';

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

export async function setNotificationsEnabled(desired: boolean): Promise<boolean> {
  console.log('[EnableNotification] set desired =', desired);
  if (desired) {
    await enableNotifications();
  } else {
    await disableNotifications();
  }
  triggerTapHapticFeedback();
  return desired;
}