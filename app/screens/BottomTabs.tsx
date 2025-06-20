import React, { useEffect, useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image, View, Animated, ImageSourcePropType, StyleSheet, Pressable } from "react-native";
import WalletScreen from "./WalletScreen";
import ChatScreen from "./ChatScreen";
import SettingsStackScreen from "./SettingStackScreen";
import { triggerLightHapticFeedback } from "../../utils/GlobalUtils/HapticFeedback";
import { triggerHoldHapticFeedback } from "../../utils/GlobalUtils/HoldHapticFeedback";
// IMPORTANT: Import from ThemeProvider instead of CheckSystemTheme
import { useThemeToggle } from "../../utils/GlobalUtils/ThemeProvider";
import { handleUserData } from "../../backend/Supabase/HandleUserData";

const Tab = createBottomTabNavigator();

interface AnimatedTabIconProps {
  source: ImageSourcePropType;
  focused: boolean;
  size: number;
  tintColor: string;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({ source, focused, size, tintColor }) => {
  return (
    <View style={styles.iconContainer}>
      <Image
        source={source}
        style={[
          styles.icon,
          { width: size, height: size, tintColor }
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
    borderRadius: 10,
  },
  icon: {
    marginTop: 10,
  },
});

// Custom TabBarButton that wraps the default button and applies a scale animation
const AnimatedTabBarButton = (props: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { onPress, children, style } = props;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style} // preserve any style passed by the navigator
    >
      <Animated.View
        style={[
          { transform: [{ scale: scaleAnim }] },
          { flex: 1, alignItems: "center", justifyContent: "center" },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default function BottomTabs() {
  const { currentTheme } = useThemeToggle();
  console.log("BottomTabs currentTheme:", currentTheme); // Should log "light" or "dark"
  const isDarkMode = currentTheme === "dark";

  useEffect(() => {
    handleUserData();
  }, []);

  return (
    <Tab.Navigator
      initialRouteName="Chats"
      screenOptions={({ route }) => ({
        headerShown: false,
        // Use the custom AnimatedTabBarButton for a scale animation on press.
        tabBarButton: (props) => <AnimatedTabBarButton {...props} />,
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
                tintColor={focused ? (isDarkMode ? "white" : "#333") : "gray"}
              />
            </View>
          );
        },
        tabBarLabelStyle: {
          top: 13,
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
