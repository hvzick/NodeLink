import { Alert, BackHandler, Platform } from 'react-native';

export const handleExit = () => {
  if (Platform.OS === "android") {
    Alert.alert(
      "Exit App",
      "Are you sure you want to exit?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => BackHandler.exitApp() }, // Proceed to exit
      ]
    );
  } else {
    Alert.alert(
      "Exit App",
      "Please close the app manually by swiping up.",
      [{ text: "OK", style: "cancel" }]
    );
  }
};
