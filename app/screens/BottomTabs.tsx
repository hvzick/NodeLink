import React, { useEffect, useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  Image,
  View,
  Animated,
  ImageSourcePropType,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WalletScreen from "./WalletScreen";
import ChatScreen from "./ChatScreen";
import SettingsStackScreen from "./SettingStackScreen";
import { triggerTapHapticFeedback } from "../../utils/GlobalUtils/TapHapticFeedback";
import { useThemeToggle } from "../../utils/GlobalUtils/ThemeProvider";
import { handleUserData } from "../../backend/Supabase/HandleUserData";
import { handleAndPublishKeys } from "../../backend/E2E-Encryption/HandleKeys";
import { loadChatProfiles } from "../../utils/ChatUtils/HandleRefresh";
import { ChatItemType } from "../../utils/ChatUtils/ChatItemsTypes";

const Tab = createBottomTabNavigator();

interface AnimatedTabIconProps {
  source: ImageSourcePropType;
  focused: boolean;
  size: number;
  tintColor: string;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  source,
  focused,
  size,
  tintColor,
}) => (
  <View style={styles.iconContainer}>
    <Image
      source={source}
      style={[styles.icon, { width: size, height: size, tintColor }]}
      resizeMode="contain"
    />
  </View>
);

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
      style={style}
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

const getIOSBarStyle = (isDarkMode: boolean) => ({
  height: 85,
  backgroundColor: isDarkMode ? "#1C1C1D" : "#EAEAEA",
  borderTopWidth: 1,
  borderTopColor: isDarkMode ? "#333" : "#ccc",
  elevation: 0,
  shadowOpacity: 0,
});

const getAndroidBarStyle = (isDarkMode: boolean) => ({
  height: 85,
  backgroundColor: isDarkMode ? "#1C1C1D" : "#EAEAEA",
  borderTopWidth: 1,
  borderTopColor: isDarkMode ? "#333" : "#ccc",
  elevation: 0,
  shadowOpacity: 0,
  marginBottom: 20,
  paddingBottom: 30,
});

export default function BottomTabs() {
  const { currentTheme } = useThemeToggle();
  const isDarkMode = currentTheme === "dark";

  // 1️⃣ Fetch & sync user data from Supabase
  useEffect(() => {
    handleUserData().catch(console.error);
  }, []);

  // 2️⃣ Generate & publish keys as soon as we know the walletAddress
  useEffect(() => {
    (async () => {
      try {
        const walletAddress = await AsyncStorage.getItem("walletAddress");
        if (walletAddress) {
          console.log("Handling Keys");
          await handleAndPublishKeys(walletAddress);
        }
      } catch (err) {
        console.error("Key generation error:", err);
      }
    })();
  }, []);

  // 3️⃣ Preload profiles for common conversations (optional warmup)
  useEffect(() => {
    const preloadCommonProfiles = async () => {
      try {
        console.log("Preloading common chat profiles...");

        const sampleConversationIds: any[] = [
          // Add any common conversation IDs you want to preload
          // "convo_0x1234567890...",
        ];

        if (sampleConversationIds.length > 0) {
          const chatItems: ChatItemType[] = sampleConversationIds.map((id) => ({
            id: id,
            name: "Loading...",
            message: "",
            time: "",
            avatar: null,
          }));

          const profiles = await loadChatProfiles(chatItems);
          console.log(
            `Preloaded ${Object.keys(profiles).length} common profiles`
          );
        } else {
          console.log("ℹNo common profiles to preload");
        }
      } catch (error) {
        console.error("Failed to preload profiles:", error);
      }
    };

    // Preload after a delay to ensure other systems are ready
    const timer = setTimeout(() => {
      preloadCommonProfiles();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Tab.Navigator
      initialRouteName="Chats"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarButton: (props) => <AnimatedTabBarButton {...props} />,
        tabBarStyle:
          Platform.OS === "ios"
            ? getIOSBarStyle(isDarkMode)
            : getAndroidBarStyle(isDarkMode),
        tabBarActiveTintColor: isDarkMode ? "white" : "black",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ focused, size }) => {
          let iconSource: ImageSourcePropType;
          if (route.name === "Wallet") {
            iconSource = require("../../assets/images/wallet-icon-black-active.png");
          } else if (route.name === "Chats") {
            iconSource = require("../../assets/images/chat-icon-black-active.png");
          } else {
            iconSource = require("../../assets/images/settings-icon-black-active.png");
          }
          return (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
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
            console.log("Wallet tab Hold pressed");
          },
          tabPress: () => {
            triggerTapHapticFeedback();
            console.log("Wallet tab Pressed");
          },
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatScreen}
        listeners={{
          tabLongPress: async () => {
            console.log("Chats tab Hold pressed");
          },
          tabPress: () => {
            triggerTapHapticFeedback();
            console.log("Chats tab Pressed");
          },
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackScreen}
        listeners={{
          tabLongPress: async () => {
            console.log("Settings tab Hold pressed");
          },
          tabPress: () => {
            triggerTapHapticFeedback();
            console.log("Settings tab Pressed");
          },
        }}
      />
    </Tab.Navigator>
  );
}

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
