// utils/testForegroundNotification.ts
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@app:notificationsEnabled';

/**
 * Requests notification permissions (if needed) and then
 * immediately fires a local notification so you can verify
 * that foreground alerts/sounds/banners are working.
 */
export async function testForegroundNotification(): Promise<void> {
  // First check if notifications are enabled
  const notificationsEnabled = await AsyncStorage.getItem(STORAGE_KEY);
  if (notificationsEnabled !== 'true') {
    console.log('[TestNotification] Notifications are disabled');
    return;
  }

  // 1) Ensure we have permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('[TestNotification] Permission not granted');
    return;
  }

  // 2) Schedule a "fire immediately" notification via a 1‑second interval
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚀 Foreground Test',
      body:  'This notification proves your foreground handler works!',
    },
    // Expo's TS definitions can be strict — cast to any for a simple interval trigger:
    trigger: { seconds: 1, repeats: false } as any,
  });

  console.log('[TestNotification] Scheduled foreground test');
}
