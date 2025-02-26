import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image, useColorScheme, View } from "react-native";
import WalletScreen from "./WalletScreen";
import ChatScreen from "./ChatScreen";
import ProfileScreen from "./ProfileScreen";
import { triggerHapticFeedback } from "../../utils/GlobalUtils/HapticFeedback"; // Import haptic feedback function

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
      initialRouteName="Chats"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { 
          height: 85, 
          backgroundColor: colorScheme === "dark" ? "#1C1C1D" : "#EAEAEA",
          borderTopWidth: 1,
          borderTopColor: colorScheme === "dark" ? "#333" : "#ccc",
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colorScheme === "light" ? "blue" : "white",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ focused, size }) => {
          let iconSource;
          if (route.name === "Wallet") {
            iconSource =
              colorScheme === "dark"
                ? require("../../assets/images/wallet-icon-white.png")
                : require("../../assets/images/wallet-icon-black.png");
          } else if (route.name === "Chats") {
            iconSource =
              colorScheme === "dark"
                ? require("../../assets/images/messages-icon-white.png")
                : require("../../assets/images/messages-icon-black.png");
          } else if (route.name === "Profile") {
            iconSource =
              colorScheme === "dark"
                ? require("../../assets/images/profile-icon-white.png")
                : require("../../assets/images/profile-icon-black.png");
          }
          return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <Image 
                source={iconSource}
                style={{
                  width: size,
                  height: size,
                  marginTop: 10,
                  tintColor: focused
                    ? colorScheme === "light" ? "blue" : "white"
                    : "gray",
                }}
                resizeMode="contain"
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
          tabPress: () => triggerHapticFeedback(), // Vibrates when Wallet tab is pressed
        }}
      />
      <Tab.Screen 
        name="Chats" 
        component={ChatScreen} 
        listeners={{
          tabPress: () => triggerHapticFeedback(), // Vibrates when Chats tab is pressed
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        listeners={{
          tabPress: () => triggerHapticFeedback(), // Vibrates when Profile tab is pressed
        }}
      />
    </Tab.Navigator>
  );
}
