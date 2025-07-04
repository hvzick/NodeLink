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
import ChatDetailScreen from "./screens/ChatDetailScreen";
import BottomTabs from "./screens/BottomTabs";
import '@ethersproject/shims';
import "react-native-polyfill-globals/auto";
import { ThemeProvider } from "../utils/GlobalUtils/ThemeProvider";
import * as Notifications from 'expo-notifications';
import { handleUserData } from "../backend/Supabase/HandleUserData";
import UserProfile from './screens/UserProfile';
import { ChatProvider } from '../utils/ChatUtils/ChatContext';
import { initializeDatabase } from '../backend/local database/InitialiseDatabase';

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
  MyProfile: { walletAddress?: string };
  UserProfile: { walletAddress?: string };
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

  // Check for existing session and load user data
    useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Initialize the local database once when the app starts.
        await initializeDatabase();
        console.log('✅ Local database initialized successfully.');

        // 2. Check for an active user session.
        const walletAddress = await AsyncStorage.getItem("walletAddress");
        console.log("🔍 Checking session:", walletAddress ? "Found" : "Not found");
        
        if (walletAddress) {
          setHasSession(true);
          await handleUserData(); // Load user data if authenticated
        } else {
          setHasSession(false);
        }
      } catch (error) {
        console.error("❌ Error during app initialization:", error);
        setHasSession(false); // Ensure user is logged out on error
      } finally {
        // This will run regardless of success or failure.
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []); // Empty dependency array ensures this runs only once on launch.


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
       <ChatProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={hasSession ? "Main" : "Auth"}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{ gestureEnabled: !hasSession }}
          />
          <Stack.Screen 
            name="TOS" 
            component={TermsOfServiceScreen}
            options={{ gestureEnabled: !hasSession }}
          />
          <Stack.Screen 
            name="PrivacyPolicy" 
            component={PrivacyPolicyScreen}
            options={{ gestureEnabled: !hasSession }}
          />
          <Stack.Screen 
            name="Main" 
            component={BottomTabs}
            options={{ gestureEnabled: hasSession }}
          />
          <Stack.Screen 
            name="ChatDetail" 
            component={ChatDetailScreen}
            options={{ gestureEnabled: hasSession }}
          />
          <Stack.Screen 
            name="UserProfile" 
            component={UserProfile}
            options={{ gestureEnabled: hasSession }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      </ChatProvider>
    </ThemeProvider>
  );
}