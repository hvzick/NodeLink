import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SettingsScreen from "./SettingsScreen";
import AppearanceScreen from "./Appearance";
import MyProfile from "./MyProfile";
import NotificationsScreen from "./Notifications";
import AuthScreen from "./Authentication";
import HapticFeedback from "./HapticFeedback";
import PrivacyPolicyScreen from "./PrivacyPolicy";
import SecurityScreen from "./Security";
import "react-native-polyfill-globals/auto";

export type SettingsStackParamList = {
  SettingsScreen: undefined;
  Appearance: undefined;
  MyProfile: undefined;
  Notifications: undefined;
  Auth: undefined;
  HapticFeedback: undefined;
  PrivacyPolicy: undefined;
  Security: undefined;
};

const SettingsStack = createStackNavigator<SettingsStackParamList>();

export default function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsScreen" component={SettingsScreen} />
      <SettingsStack.Screen name="Appearance" component={AppearanceScreen} />
      <SettingsStack.Screen name="MyProfile" component={MyProfile} />
      <SettingsStack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />
      <SettingsStack.Screen name="Auth" component={AuthScreen} />
      <SettingsStack.Screen name="HapticFeedback" component={HapticFeedback} />
      <SettingsStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
      />
      <SettingsStack.Screen name="Security" component={SecurityScreen} />
    </SettingsStack.Navigator>
  );
}
