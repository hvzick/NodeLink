// App.tsx
import 'react-native-get-random-values';
import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useFonts } from "expo-font";
import { View, Text } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingScreen from "./screens/LoadingScreen";
import AuthScreen from "./screens/Authentication";
import TermsOfServiceScreen from "./screens/TermsOfService";
import PrivacyPolicyScreen from "./screens/PrivacyPolicy";
import Chats from "./screens/ChatScreen";
import ChatDetailScreen from "./screens/ChatDetailScreen";
import { initializeWalletConnect } from "../utils/AuthenticationUtils/WalletConnect";
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
  LoadingScreen: undefined;
  Auth: undefined;
  TOS: undefined;
  PrivacyPolicy: undefined;
  Chats: undefined;
  ChatDetail: { conversationId: string; name: string; avatar: any };
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [fontsLoaded] = useFonts({
    "MontserratAlternates-Regular": require("../assets/fonts/MontserratAlternates-Regular.ttf"),
    "Inter_18pt-Medium": require("../assets/fonts/Inter_18pt-Medium.ttf"),
    "Inter_28pt-Medium": require("../assets/fonts/Inter_28pt-Medium.ttf"),
    "SF-Pro-Text-Regular": require("../assets/fonts/SF-Pro-Text-Regular.otf"),
    "SF-Pro-Text-Medium": require("../assets/fonts/SF-Pro-Text-Medium.otf"),
  });

  // 1️⃣ Restore wallet session from storage once
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("walletAddress");
        console.log("🔍 Checking stored wallet:", stored);
        if (stored) {
          console.log("✅ Found stored wallet, setting authenticated to true");
          setIsAuthenticated(true);
        } else {
          console.log("❌ No stored wallet found");
        }
        setSessionChecked(true);
      } catch (error) {
        console.error("Error checking session:", error);
        setSessionChecked(true);
      }
    })();
  }, []);

  // 2️⃣ Init WalletConnect only after session check & auth
  useEffect(() => {
    if (!sessionChecked) {
      console.log("⏳ Waiting for session check");
      return;
    }

    console.log("🚀 Initializing WalletConnect");
    initializeWalletConnect(
      async (walletAddress: string | null) => {
        if (walletAddress) {
          console.log("🔸 Received wallet address:", walletAddress);
          await AsyncStorage.setItem("walletAddress", walletAddress);
          setIsAuthenticated(true);
        }
      },
      () => {
        console.log("❌ Wallet disconnected - but maintaining auth state");
        // Don't reset authentication state on disconnect
      },
      () => {
        console.log("❌ Wallet connection failed - but maintaining auth state");
        // Don't reset authentication state on connection failure
      },
      null
    );
  }, [sessionChecked]);

  // 3️⃣ Block UI until fonts + session restore complete
  if (!fontsLoaded || !sessionChecked) {
    console.log("⏳ Loading state:", { fontsLoaded, sessionChecked });
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading App...</Text>
      </View>
    );
  }

  console.log("🎯 Current auth state:", { isAuthenticated, sessionChecked });

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isAuthenticated ? "Main" : "Auth"}
          screenOptions={{ headerShown: false }}
        >
          {isAuthenticated ? (
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
