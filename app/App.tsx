import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import { View, Text } from 'react-native';
import StartScreen from './screens/start';
import AuthScreen from './screens/auth';
import TermsOfServiceScreen from './screens/tos';
import PrivacyPolicyScreen from './screens/privacypolicy';

// Define the navigation types
export type RootStackParamList = {
  Authentication: undefined;  // Face ID or Passcode Authentication
  Start: undefined;           // Start screen (Splash Screen)
  Auth: undefined;            // Metamask Authentication screen
  TOS: undefined;             // Terms of Service screen
  PrivacyPolicy: undefined;   // Privacy Policy screen
};

// Create stack navigator
const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    'MontserratAlternates-Regular': require('../assets/fonts/MontserratAlternates-Regular.ttf'),
    'Inter_18pt-Medium': require('../assets/fonts/Inter_18pt-Medium.ttf'),
    'Inter_24pt-Medium': require('../assets/fonts/Inter_24pt-Medium.ttf'),
    'Inter_28pt-Medium': require('../assets/fonts/Inter_28pt-Medium.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading Fonts...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Start" component={StartScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="TOS" component={TermsOfServiceScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
