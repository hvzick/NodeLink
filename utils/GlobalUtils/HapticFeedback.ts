// HapticFeedback.ts
import * as Haptics from "expo-haptics";

export const triggerHapticFeedback = () => {
  const hapticFeedbackEnabled = true;
  if (hapticFeedbackEnabled) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};
