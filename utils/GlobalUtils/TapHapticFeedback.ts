import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

// This key MUST match the key used in your settings screen
const TAP_HAPTIC_KEY = 'tapHapticEnabled';

/**
 * Triggers a light haptic feedback for taps, but only if the user has enabled it in settings.
 * This function is now correctly named to match what your screen is importing.
 */
export const triggerTapHapticFeedback= async () => {
  try {
    // 1. Get the saved setting from storage
    const savedValue = await AsyncStorage.getItem(TAP_HAPTIC_KEY);
    
    // 2. Determine if haptics are enabled. Default to ON (true) if not set.
    const isEnabled = savedValue !== 'false'; 

    // 3. Trigger haptics only if enabled
    if (isEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    console.error("Failed to trigger tap haptic feedback:", error);
  }
};