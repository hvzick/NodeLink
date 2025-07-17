import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TAP_SENSITIVITY_KEY = "tapHapticSensitivity";

export async function triggerTapHapticFeedback() {
  try {
    const sensitivity = await AsyncStorage.getItem(TAP_SENSITIVITY_KEY);
    let style = Haptics.ImpactFeedbackStyle.Light;
    if (sensitivity === "Medium") style = Haptics.ImpactFeedbackStyle.Medium;
    if (sensitivity === "Heavy") style = Haptics.ImpactFeedbackStyle.Heavy;
    await Haptics.impactAsync(style);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // fallback to light if error
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}