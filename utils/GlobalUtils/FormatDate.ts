// utils/ChatDetailUtils/ChatHandlers/FormatDate.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const formatDateHeader = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTimeForUser = async (date: Date | number) => {
  let timeFormat = '24';
  try {
    const stored = await AsyncStorage.getItem('timeFormat');
    if (stored === '12' || stored === '24') timeFormat = stored;
  } catch {}
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12',
  });
};