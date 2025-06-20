import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HOLD_HAPTIC_KEY = 'holdHapticEnabled';

// A small helper function to create a pause between haptic pulses
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Triggers a haptic feedback that feels like a long-press (hold) action
 * by firing several pulses in rapid succession.
 */
export const triggerHoldHapticFeedback = async () => {
  try {
    const isEnabled = (await AsyncStorage.getItem(HOLD_HAPTIC_KEY)) !== 'false';
    if (!isEnabled) {
      return; // Exit early if the setting is disabled
    }

    // Define the "hold" effect: 3 pulses with a 50ms delay between them
    const repetitions = 3;
    const interval = 50; 

    for (let i = 0; i < repetitions; i++) {
      // Use Medium impact for a sustained but not overly jarring feel
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Pause before the next pulse (no need to wait after the last one)
      if (i < repetitions - 1) {
        await delay(interval);
      }
    }
  } catch (error) {
    console.error("Failed to trigger hold haptic feedback:", error);
  }
};