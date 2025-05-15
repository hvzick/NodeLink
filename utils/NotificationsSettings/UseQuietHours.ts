import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'app:quietHours';

export type QuietRange = {
  start: { h: number; m: number };
  end:   { h: number; m: number };
};

export function useQuietHours() {
  // Default now 00:00–00:00 (no quiet window)
  const [quietRange, setQuietRange] = useState<QuietRange>({
    start: { h: 0, m: 0 },
    end:   { h: 0, m: 0 },
  });

  // Load persisted range on mount
  useEffect(() => {
    console.log('[QuietHours] Loading persisted range...');
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const parsed: QuietRange = JSON.parse(raw);
          console.log(
            `[QuietHours] Retrieved range → start: ${parsed.start.h.toString().padStart(2, '0')}:${parsed.start.m.toString().padStart(2, '0')}, end: ${parsed.end.h.toString().padStart(2, '0')}:${parsed.end.m.toString().padStart(2, '0')}`
          );
          setQuietRange(parsed);
        } catch (err) {
          console.error('[QuietHours] Failed to parse stored range:', err);
        }
      } else {
        console.log(
          `[QuietHours] No stored range found; using default → start: ${quietRange.start.h.toString().padStart(2, '0')}:${quietRange.start.m.toString().padStart(2, '0')}, end: ${quietRange.end.h.toString().padStart(2, '0')}:${quietRange.end.m.toString().padStart(2, '0')}`
        );
      }
    });
  }, []);

  // Persist whenever it changes
  const saveQuietRange = async (range: QuietRange) => {
    console.log(
      `[QuietHours] Saving new range → start: ${range.start.h.toString().padStart(2, '0')}:${range.start.m.toString().padStart(2, '0')}, end: ${range.end.h.toString().padStart(2, '0')}:${range.end.m.toString().padStart(2, '0')}`
    );
    setQuietRange(range);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(range));
      console.log('[QuietHours] Range saved successfully.');
    } catch (err) {
      console.error('[QuietHours] Error saving range to storage:', err);
    }
  };

  // Returns true if “now” is inside today’s quiet window:
  //   - If start < end → same-day window
  //   - If start >= end → overnight window spanning midnight
  const isQuietNow = (): boolean => {
    const now = new Date();
    const hh = now.getHours();
    const mm = now.getMinutes();
    const totalMins = hh * 60 + mm;

    const startTotal = quietRange.start.h * 60 + quietRange.start.m;
    const endTotal   = quietRange.end.h   * 60 + quietRange.end.m;

    // SPECIAL CASE: identical times → no quiet window
    if (startTotal === endTotal) {
      console.log('[QuietHours] No quiet window set (start === end)');
      return false;
    }

    console.log(
      `[QuietHours] Checking now=${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} (${totalMins} mins), ` +
      `window start=${quietRange.start.h.toString().padStart(2, '0')}:${quietRange.start.m.toString().padStart(2, '0')} (${startTotal} mins), ` +
      `end=${quietRange.end.h.toString().padStart(2, '0')}:${quietRange.end.m.toString().padStart(2, '0')} (${endTotal} mins)`
    );

    let result: boolean;
    if (startTotal < endTotal) {
      // e.g. 09:00–17:00
      result = totalMins >= startTotal && totalMins < endTotal;
    } else {
      // e.g. 22:00–07:00 (overnight)
      result = totalMins >= startTotal || totalMins < endTotal;
    }

    console.log(`[QuietHours] isQuietNow = ${result}`);
    return result;
  };

  return { quietRange, saveQuietRange, isQuietNow };
}