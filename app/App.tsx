import 'react-native-get-random-values'; // Ensures crypto.getRandomValues is available
import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useFonts } from "expo-font";
import { View, Text } from "react-native";
import LoadingScreen from "./screens/LoadingScreen";
import AuthScreen from "./screens/Auth";
import TermsOfServiceScreen from "./screens/TermsOfService";
import PrivacyPolicyScreen from "./screens/PrivacyPolicy";
import ChatScreen from "./screens/ChatScreen"; // Add ChatScreen import
import { initializeWalletConnect } from "../utils/WalletConnect"; // Correct import

import '@ethersproject/shims'; // Helps with WalletConnect compatibility
import { Buffer } from "buffer";
import crypto from "react-native-polyfill-globals"; 
import "react-native-polyfill-globals/auto";

// Polyfill global objects
global.Buffer = Buffer;
global.crypto = crypto;

export type RootStackParamList = {
  LoadingScreen: undefined;
  Auth: undefined;
  TOS: undefined;
  PrivacyPolicy: undefined;
  ChatScreen: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track authentication state
  const [fontsLoaded] = useFonts({
    "MontserratAlternates-Regular": require("../assets/fonts/MontserratAlternates-Regular.ttf"),
    "Inter_18pt-Medium": require("../assets/fonts/Inter_18pt-Medium.ttf"),
    "Inter_28pt-Medium": require("../assets/fonts/Inter_28pt-Medium.ttf"),
    "SF-Pro-Text-Regular": require("../assets/fonts/SF-Pro-Text-Regular.otf"),
    "SF-Pro-Text-Medium": require("../assets/fonts/SF-Pro-Text-Medium.otf"),
  });

  useEffect(() => {
    if (isAuthenticated) {
        initializeWalletConnect(
            (walletAddress) => {
                if (walletAddress) {
                    setIsAuthenticated(true);
                }
            },
            () => setIsAuthenticated(false),
            () => setIsAuthenticated(false),
            null
        );
    }
}, [isAuthenticated]); // Only run when `isAuthenticated` changes


  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading Fonts...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* If authenticated, redirect to the Chat screen, else go to Auth */}
        <Stack.Screen name="LoadingScreen" component={LoadingScreen} />
        
        {/* Ensure ChatScreen is part of the stack, even if not authenticated */}
        <Stack.Screen 
          name="ChatScreen" 
          component={ChatScreen} 
          listeners={({ navigation }) => ({
            focus: () => {
              // Reset navigation stack when navigating to ChatScreen
              if (isAuthenticated) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'ChatScreen' }],
                });
              }
            }
          })}
        />

        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : null}

        <Stack.Screen name="TOS" component={TermsOfServiceScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
