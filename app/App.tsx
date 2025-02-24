import 'react-native-get-random-values'; // Ensures crypto.getRandomValues is available
import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useFonts } from "expo-font";
import { View, Text } from "react-native";
import StartScreen from "./screens/start";
import AuthScreen from "./screens/auth";
import TermsOfServiceScreen from "./screens/tos";
import PrivacyPolicyScreen from "./screens/privacypolicy";
import HomeScreen from "./screens/Home";
import { initializeWalletConnect } from "../utils/WalletConnect"; // Correct import

import '@ethersproject/shims'; // Helps with WalletConnect compatibility

// Fix: Import crypto and buffer properly
import { Buffer } from "buffer";
import crypto from "react-native-polyfill-globals"; 
import "react-native-polyfill-globals/auto";

// Polyfill global objects
global.Buffer = Buffer;
global.crypto = crypto;

export type RootStackParamList = {
  Start: undefined;
  Auth: undefined;
  TOS: undefined;
  PrivacyPolicy: undefined;
  Home: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    initializeWalletConnect(() => {}, () => {}, () => {}, null);
  }, []);

  const [fontsLoaded] = useFonts({
    "MontserratAlternates-Regular": require("../assets/fonts/MontserratAlternates-Regular.ttf"),
    "Inter_18pt-Medium": require("../assets/fonts/Inter_18pt-Medium.ttf"),
    "Inter_24pt-Medium": require("../assets/fonts/Inter_24pt-Medium.ttf"),
    "Inter_28pt-Medium": require("../assets/fonts/Inter_28pt-Medium.ttf"),
  });

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
        <Stack.Screen name="Start" component={StartScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TOS" component={TermsOfServiceScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
