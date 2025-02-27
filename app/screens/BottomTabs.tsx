import React, { useEffect, useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image, View, Animated, ImageSourcePropType, StyleSheet } from "react-native";
import WalletScreen from "./WalletScreen";
import ChatScreen from "./ChatScreen";
import SettingsStackScreen from "./SettingStackScreen";
import { triggerLightHapticFeedback } from "../../utils/GlobalUtils/HapticFeedback";
import { triggerHoldHapticFeedback } from "../../utils/GlobalUtils/HoldHapticFeedback";
// IMPORTANT: Import from ThemeProvider instead of CheckSystemTheme
import { useThemeToggle } from "../../utils/GlobalUtils/ThemeProvider";

const Tab = createBottomTabNavigator();

interface AnimatedTabIconProps {
  source: ImageSourcePropType;
  focused: boolean;
  size: number;
  tintColor: string;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({ source, focused, size, tintColor }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
      <Image
        source={source}
        style={{ width: size, height: size, marginTop: 10, tintColor }}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    // Additional styling if needed
  },
});

export default function BottomTabs() {
  const { currentTheme } = useThemeToggle();
  console.log("BottomTabs currentTheme:", currentTheme); // Should log "light" or "dark"
  const isDarkMode = currentTheme === "dark";

  return (
    <Tab.Navigator
      initialRouteName="Chats"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 85,
          backgroundColor: isDarkMode ? "#1C1C1D" : "#EAEAEA",
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? "#333" : "#ccc",
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: isDarkMode ? "white" : "black",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ focused, size }) => {
          let iconSource;
          if (route.name === "Wallet") {
            iconSource = require("../../assets/images/wallet-icon-black-active.png");
          } else if (route.name === "Chats") {
            iconSource = require("../../assets/images/chat-icon-black-active.png");
          } else if (route.name === "Settings") {
            iconSource = require("../../assets/images/settings-icon-black-active.png");
          }
          return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <AnimatedTabIcon
                source={iconSource}
                focused={focused}
                size={size}
                tintColor={focused ? (isDarkMode ? "white" : "black") : "gray"}
              />
            </View>
          );
        },
        tabBarLabelStyle: {
          marginTop: 10,
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        listeners={{
          tabLongPress: async () => {
            await triggerHoldHapticFeedback();
            console.log("Wallet tab Hold pressed");
          },
          tabPress: () => {
            triggerLightHapticFeedback();
            console.log("Wallet tab Pressed");
          },
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatScreen}
        listeners={{
          tabLongPress: async () => {
            await triggerHoldHapticFeedback();
            console.log("Chats tab Hold pressed");
          },
          tabPress: () => {
            triggerLightHapticFeedback();
            console.log("Chats tab Pressed");
          },
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackScreen}
        listeners={{
          tabLongPress: async () => {
            await triggerHoldHapticFeedback();
            console.log("Settings tab Hold pressed");
          },
          tabPress: () => {
            triggerLightHapticFeedback();
            console.log("Settings tab Pressed");
          },
        }}
      />
    </Tab.Navigator>
  );
}
