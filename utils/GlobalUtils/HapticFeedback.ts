// HapticFeedback.ts
import * as Haptics from "expo-haptics";

export const triggerLightHapticFeedback = () => {
  const hapticFeedbackEnabled = true;
  if (hapticFeedbackEnabled) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};
