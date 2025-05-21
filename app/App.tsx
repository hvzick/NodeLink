// App.tsx
import 'react-native-get-random-values';
import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useFonts } from "expo-font";
import { View, Text } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen from "./screens/Authentication";
import TermsOfServiceScreen from "./screens/TermsOfService";
import PrivacyPolicyScreen from "./screens/PrivacyPolicy";
import Chats from "./screens/ChatScreen";
import ChatDetailScreen from "./screens/ChatDetailScreen";
import BottomTabs from "./screens/BottomTabs";
import '@ethersproject/shims';
import "react-native-polyfill-globals/auto";
import { ThemeProvider } from "../utils/GlobalUtils/ThemeProvider";
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type RootStackParamList = {
  Auth: undefined;
  TOS: undefined;
  PrivacyPolicy: undefined;
  Chats: undefined;
  ChatDetail: { conversationId: string; name: string; avatar: any };
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded] = useFonts({
    "MontserratAlternates-Regular": require("../assets/fonts/MontserratAlternates-Regular.ttf"),
    "Inter_18pt-Medium": require("../assets/fonts/Inter_18pt-Medium.ttf"),
    "Inter_28pt-Medium": require("../assets/fonts/Inter_28pt-Medium.ttf"),
    "SF-Pro-Text-Regular": require("../assets/fonts/SF-Pro-Text-Regular.otf"),
    "SF-Pro-Text-Medium": require("../assets/fonts/SF-Pro-Text-Medium.otf"),
  });

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const walletAddress = await AsyncStorage.getItem("walletAddress");
        console.log("🔍 Checking session:", walletAddress ? "Found" : "Not found");
        setHasSession(!!walletAddress);
      } catch (error) {
        console.error("Error checking session:", error);
        setHasSession(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Show loading screen while checking session and loading fonts
  if (isLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={hasSession ? "Main" : "Auth"}
          screenOptions={{ headerShown: false }}
        >
          {hasSession ? (
            // Authenticated stack
            <>
              <Stack.Screen name="Main" component={BottomTabs} />
              <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            </>
          ) : (
            // Unauthenticated stack
            <>
              <Stack.Screen name="Auth" component={AuthScreen} />
              <Stack.Screen name="TOS" component={TermsOfServiceScreen} />
              <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
