// SettingsStackScreen.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SettingsScreen from './SettingsScreen';
import AppearanceScreen from './Appearance';

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Appearance: undefined;
};

const SettingsStack = createStackNavigator<SettingsStackParamList>();

export default function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
      <SettingsStack.Screen name="Appearance" component={AppearanceScreen} />
    </SettingsStack.Navigator>
  );
}
