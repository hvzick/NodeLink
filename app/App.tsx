// App.tsx

import 'react-native-webview-crypto';
import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen from './screens/Authentication';
import TermsOfServiceScreen from './screens/TermsOfService';
import PrivacyPolicyScreen from './screens/Privacypolicy';
import ChatDetailScreen from './screens/ChatDetailScreen';
import BottomTabs from './screens/BottomTabs';
import '@ethersproject/shims';
import 'react-native-polyfill-globals/auto';
import { ThemeProvider } from '../utils/GlobalUtils/ThemeProvider';
import * as Notifications from 'expo-notifications';
import { handleUserData } from '../backend/Supabase/HandleUserData';
import UserProfile from './screens/UserProfile';
import { ChatProvider } from '../utils/ChatUtils/ChatContext';
import { initializeDatabase } from '../backend/Local database/InitialiseDatabase';
import LoadingScreen from './screens/LoadingScreen';
import { initialize as initializeGun, destroy as destroyGun, onStatusChange } from '../backend/Gun Service/GunIndex';
import { AuthProvider, useAuth } from '../utils/AuthenticationUtils/AuthContext';

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
  Main: undefined;
  ChatDetail: { conversationId: string; name: string; avatar: any };
  MyProfile: { walletAddress?: string };
  UserProfile: { walletAddress?: string };
};

const Stack = createStackNavigator<RootStackParamList>();

function AppContent() {
  const [fontsLoaded] = useFonts({
    'MontserratAlternates-Regular': require('../assets/fonts/MontserratAlternates-Regular.ttf'),
    'Inter_18pt-Medium': require('../assets/fonts/Inter_18pt-Medium.ttf'),
    'Inter_28pt-Medium': require('../assets/fonts/Inter_28pt-Medium.ttf'),
    'SF-Pro-Text-Regular': require('../assets/fonts/SF-Pro-Text-Regular.otf'),
    'SF-Pro-Text-Medium': require('../assets/fonts/SF-Pro-Text-Medium.otf'),
  });

  const [ready, setReady] = useState(false);
  
  // 🚩 Replace local session with context's isLoggedIn
  const { isLoggedIn, setIsLoggedIn } = useAuth();

  useEffect(() => {
    const unsubscribe = onStatusChange(isConnected => {
      console.log(
        `P2P Network Status: ${isConnected ? 'Connected' : 'Connecting...'}`
      );
    });

    const init = async () => {
      await initializeDatabase();
      const walletAddress = await AsyncStorage.getItem('walletAddress');
      if (walletAddress) {
        // Sync context
        setIsLoggedIn(true);

        initializeGun();
        await handleUserData();
      } else {
        setIsLoggedIn(false);
      }
      setReady(true);
    };

    if (fontsLoaded) init();

    return () => {
      destroyGun();
      unsubscribe();
    };
  }, [fontsLoaded, setIsLoggedIn]);

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          // Auth flow
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="TOS" component={TermsOfServiceScreen} />
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
            />
          </>
        ) : (
          // Main flow
          <>
            <Stack.Screen name="Main" component={BottomTabs} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="UserProfile" component={UserProfile} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    // 🎯 Wrap with AuthProvider
    <AuthProvider>
      <ThemeProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}