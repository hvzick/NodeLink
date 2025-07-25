import { useEffect } from "react";
import { Alert, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import * as Linking from "expo-linking";

const checkInternetConnection = () => {
  NetInfo.fetch().then((state) => {
    if (!state.isConnected) {
      Alert.alert(
        "No Internet Connection",
        "Please turn on your internet connection.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Wi-Fi Settings",
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("App-Prefs:root=WIFI");
              } else {
                Linking.openSettings();
              }
            },
          },
          {
            text: "Mobile Data Settings",
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("App-Prefs:root=MOBILE_DATA");
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
    }
  });
};

const InternetCheck = () => {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected) {
        checkInternetConnection();
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
};

export default InternetCheck;
export { checkInternetConnection };
