// App.tsx
import 'react-native-get-random-values'; // Ensures crypto.getRandomValues is available
import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useFonts } from "expo-font";
import { View, Text } from "react-native";
import LoadingScreen from "./screens/LoadingScreen";
import AuthScreen from "./screens/Authentication";
import TermsOfServiceScreen from "./screens/TermsOfService";
import PrivacyPolicyScreen from "./screens/PrivacyPolicy";
import Chats from "./screens/ChatScreen";
import ChatDetailScreen from "./screens/ChatDetailScreen"; // <-- new import
import { initializeWalletConnect } from "../utils/AuthenticationUtils/WalletConnect";
import BottomTabs from "./screens/BottomTabs";

import '@ethersproject/shims'; // Helps with WalletConnect compatibility
import { Buffer } from "buffer";
import crypto from "react-native-polyfill-globals"; 
import "react-native-polyfill-globals/auto";
import { ThemeProvider } from "../utils/GlobalUtils/ThemeProvider"; // Adjust path as needed

// Import the getOrCreateUserData function and UserData type
import { getOrCreateUserData, UserData } from "../backend/decentralized-database/GetUserData"; // <-- update the path as necessary

// Polyfill global objects
global.Buffer = Buffer;
global.crypto = crypto;

// App.tsx (excerpt)
export type RootStackParamList = {
  LoadingScreen: undefined;
  Auth: undefined;
  TOS: undefined;
  PrivacyPolicy: undefined;
  Chats: undefined;
  ChatDetail: { conversationId: string; name: string; avatar: any }; // <-- now includes avatar
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
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
        async (walletAddress: string | null) => {
          if (walletAddress) {
            setIsAuthenticated(true);
            try {
              // Call getOrCreateUserData with default values if the user doesn't exist.
              // For the default avatar, we store the string "default" as an identifier.
              const user = await getOrCreateUserData(walletAddress, {
                username: '@hvzick',
                avatar: 'default', 
                name: 'Sheikh Hazik',
                bio: 'Blockchain enthusiast and developer',
              });
              setUserData(user);
              console.log("User data loaded:", user);
            } catch (error) {
              console.error("Error retrieving or creating user data:", error);
            }
          }
        },
        () => setIsAuthenticated(false),
        () => setIsAuthenticated(false),
        null
      );
    }
  }, [isAuthenticated]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading Fonts...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="LoadingScreen" component={LoadingScreen} />
          <Stack.Screen 
            name="Chats" 
            component={Chats} 
            listeners={({ navigation }) => ({
              focus: () => {
                if (isAuthenticated) {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Chats' }],
                  });
                }
              }
            })}
          />
          {/* ChatDetail screen added here */}
          <Stack.Screen 
            name="ChatDetail" 
            component={ChatDetailScreen} 
            options={({ route }) => ({ headerShown: false, title: route.params.name })}
          />
          {!isAuthenticated && (
            <Stack.Screen name="Auth" component={AuthScreen} />
          )}
          <Stack.Screen name="TOS" component={TermsOfServiceScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="Main" component={BottomTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

 