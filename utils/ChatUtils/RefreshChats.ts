import { triggerTapHapticFeedback } from "../GlobalUtils/TapHapticFeedback";

export const onRefresh = (setRefreshing: unknown) => {
  // Trigger haptic feedback
  triggerTapHapticFeedback();

  // Return a promise that resolves after 2 seconds
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 2000);
  });
};