import { triggerLightHapticFeedback } from "../GlobalUtils/HapticFeedback";

export const onRefresh = () => {
  // Trigger haptic feedback
  triggerLightHapticFeedback();

  // Return a promise that resolves after 2 seconds
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 2000);
  });
};