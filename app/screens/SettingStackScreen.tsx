// SettingsStackScreen.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SettingsScreen from './SettingsScreen';
import AppearanceScreen from './Appearance';
import MyProfile from './MyProfile';
import NotificationsScreen from './Notifications';
import AuthScreen from './Authentication';

export type SettingsStackParamList = {
  SettingsScreen: undefined;
  Appearance: undefined;
  MyProfile: undefined; 
  Notifications: undefined;
  Auth: undefined;
};

const SettingsStack = createStackNavigator<SettingsStackParamList>();

export default function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsScreen" component={SettingsScreen} />
      <SettingsStack.Screen name="Appearance" component={AppearanceScreen} />
      <SettingsStack.Screen name="MyProfile" component={MyProfile} />
      <SettingsStack.Screen name="Notifications" component={NotificationsScreen} />
      <SettingsStack.Screen name="Auth" component={AuthScreen} />
    </SettingsStack.Navigator>
  );
}
