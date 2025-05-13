// HapticFeedback.ts
import * as Haptics from "expo-haptics";

/**
 * Trigger a haptic feedback for a long-press (hold) action.
 */
export const triggerHoldHapticFeedback = async () => {
  try {
    // Using Heavy impact to simulate a hold feedback effect.
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.error("Error triggering haptic feedback:", error);
  }
};
