// SettingsStackScreen.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SettingsScreen from './SettingsScreen';
import AppearanceScreen from './Appearance';
import MyProfile from './MyProfile';

export type SettingsStackParamList = {
  Settings: undefined;
  Appearance: undefined;
  MyProfile: undefined; 
};

const SettingsStack = createStackNavigator<SettingsStackParamList>();

export default function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen name="Appearance" component={AppearanceScreen} />
      <SettingsStack.Screen name="MyProfile" component={MyProfile} />
    </SettingsStack.Navigator>
  );
}
