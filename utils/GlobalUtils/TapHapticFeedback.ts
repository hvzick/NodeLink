import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TAP_HAPTIC_KEY = "tapHapticEnabled";
const TAP_SENSITIVITY_KEY = "tapHapticSensitivity";

export async function triggerTapHapticFeedback() {
  try {
    const enabled = await AsyncStorage.getItem(TAP_HAPTIC_KEY);
    if (enabled === "false") return; // Only play if enabled

    const sensitivity = await AsyncStorage.getItem(TAP_SENSITIVITY_KEY);
    let style = Haptics.ImpactFeedbackStyle.Light;
    if (sensitivity === "Medium") style = Haptics.ImpactFeedbackStyle.Medium;
    if (sensitivity === "Heavy") style = Haptics.ImpactFeedbackStyle.Heavy;
    await Haptics.impactAsync(style);
  } catch {
    // fallback to light if error
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}