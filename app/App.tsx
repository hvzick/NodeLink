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
import { handleAndPublishKeys } from '../backend/Encryption/HandleKeys';

// --- 🧠 NEW: Import GlobalMessageListener ---
import GlobalMessageListener from '../backend/Gun Service/Messaging/GlobalMessageListener';

// --- Gun.js setup ---
import {
  initialize as initializeGun,
  destroy as destroyGun,
  onStatusChange,
} from '../backend/Gun Service/GunIndex';

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
  LoadingScreen: { hasSession: boolean };
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
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(false);

  const [fontsLoaded] = useFonts({
    'MontserratAlternates-Regular': require('../assets/fonts/MontserratAlternates-Regular.ttf'),
    'Inter_18pt-Medium': require('../assets/fonts/Inter_18pt-Medium.ttf'),
    'Inter_28pt-Medium': require('../assets/fonts/Inter_28pt-Medium.ttf'),
    'SF-Pro-Text-Regular': require('../assets/fonts/SF-Pro-Text-Regular.otf'),
    'SF-Pro-Text-Medium': require('../assets/fonts/SF-Pro-Text-Medium.otf'),
  });

  useEffect(() => {
    const unsubscribeFromGunStatus = onStatusChange(isConnected => {
      console.log(`P2P Network Status: ${isConnected ? 'Connected' : 'Connecting...'}`);
    });

    const load = async () => {
      await initializeDatabase();

      const walletAddress = await AsyncStorage.getItem('walletAddress');
      if (walletAddress) {
        setSession(true);
        initializeGun(); // 🟢 Start Gun.js
        await handleUserData();
        await handleAndPublishKeys(walletAddress);
      } else {
        setSession(false);
      }

      setReady(true);
    };

    if (fontsLoaded) {
      load();
    }

    return () => {
      console.log('Cleaning up app-level resources...');
      destroyGun();
      unsubscribeFromGunStatus();
    };
  }, [fontsLoaded]);

  if (!ready) return null;

  return (
    <ThemeProvider>
      <ChatProvider>
        {/* 🧠 Always listen for Gun messages */}
        <GlobalMessageListener />

        <NavigationContainer>
          <Stack.Navigator initialRouteName="LoadingScreen" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="LoadingScreen" component={LoadingScreen} initialParams={{ hasSession: session }} />
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="TOS" component={TermsOfServiceScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="Main" component={BottomTabs} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="UserProfile" component={UserProfile} />
          </Stack.Navigator>
        </NavigationContainer>
      </ChatProvider>
    </ThemeProvider>
  );
}
