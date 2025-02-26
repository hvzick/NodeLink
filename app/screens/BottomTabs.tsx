import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image, useColorScheme } from "react-native";
import WalletScreen from "./WalletScreen";
import ChatScreen from "./ChatScreen";
import ProfileScreen from "./ProfileScreen";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  // Get the current system color scheme: "light" or "dark"
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
      initialRouteName="ChatScreen"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { 
          height: 65, 
          paddingBottom: 10,
          backgroundColor: colorScheme === "dark" ? "#121212" : "#fff",
        },
        tabBarActiveTintColor: colorScheme === "light" ? "blue" : "white",
        tabBarInactiveTintColor: colorScheme === "light" ? "gray" : "gray",
        tabBarIcon: ({ focused, size }) => {
          let iconSource;

          if (route.name === "WalletScreen") {
            iconSource =
              colorScheme === "dark"
                ? require("../../assets/images/wallet-icon-white.png")
                : require("../../assets/images/wallet-icon-black.png");
          } else if (route.name === "ChatScreen") {
            iconSource =
              colorScheme === "dark"
                ? require("../../assets/images/messages-icon-white.png")
                : require("../../assets/images/messages-icon-black.png");
          } else if (route.name === "ProfileScreen") {
            iconSource =
              colorScheme === "dark"
                ? require("../../assets/images/profile-icon-white.png")
                : require("../../assets/images/profile-icon-black.png");
          }

          return (
            <Image
              source={iconSource}
              style={{
                marginTop:-5,
                width: size,
                height: size,
                // Optionally, you can use tintColor if you want to apply a color overlay.
                tintColor: focused ? colorScheme === "light" ? "blue" : "white" : "gray",
              }}
              resizeMode="contain"
            />
          );
        },
      })}
    >
      <Tab.Screen name="WalletScreen" component={WalletScreen} />
      <Tab.Screen name="ChatScreen" component={ChatScreen} />
      <Tab.Screen name="ProfileScreen" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
