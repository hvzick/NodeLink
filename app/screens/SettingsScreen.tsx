// ✅ Same imports
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Switch,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { copyToClipboard } from "../../utils/GlobalUtils/CopyToClipboard";
import { useThemeToggle } from "../../utils/GlobalUtils/ThemeProvider";
import {
  UserData,
  DEFAULT_USER_DATA,
} from "../../backend/Supabase/RegisterUser";
import ArrowSVG from "../../assets/images/arrow-icon.svg";
import ProfileArrowSvg from "../../assets/images/profile-arrow-icon.svg";
import { useLogout } from "../../utils/AuthenticationUtils/Logout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

// ✅ Navigation type
export type SettingsStackParamList = {
  Settings: undefined;
  Appearance: undefined;
  MyProfile: undefined;
  Notifications: undefined;
  HapticFeedback: undefined;
  PrivacyPolicy: undefined;
  Security: undefined;
};

type SettingsNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  "Settings"
>;

export default function SettingsScreen() {
  const { currentTheme, toggleTheme } = useThemeToggle();
  const isDarkMode = currentTheme === "dark";
  const [copied, setCopied] = useState(false);
  const navigation = useNavigation<SettingsNavigationProp>();
  const logout = useLogout();
  const [userData, setUserData] = useState<UserData | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const storedData = await AsyncStorage.getItem("userData");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setUserData(parsedData);
      } else {
        const walletAddress = await AsyncStorage.getItem("walletAddress");
        if (walletAddress) {
          setUserData({
            walletAddress,
            ...DEFAULT_USER_DATA,
          });
        }
      }
    } catch (error) {
      const walletAddress = await AsyncStorage.getItem("walletAddress");
      if (walletAddress) {
        setUserData({
          walletAddress,
          ...DEFAULT_USER_DATA,
        });
      }
    }
  };

  const toggleDarkMode = async () => {
    await toggleTheme();
  };

  const handleCopyAddress = async () => {
    if (!userData?.walletAddress) return;
    const success = await copyToClipboard(userData.walletAddress);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const styles = getStyles(isDarkMode);

  const RightArrow = () => (
    <ArrowSVG width={styles.arrowIcon.width} height={styles.arrowIcon.height} />
  );

  const ProfileRightArrow = () => (
    <ProfileArrowSvg
      width={styles.profileArrowIcon.width}
      height={styles.profileArrowIcon.height}
    />
  );

  const profileImageSource =
    userData && userData.avatar !== "default"
      ? { uri: userData.avatar }
      : require("../../assets/images/default-avatar.jpg");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={handleCopyAddress}>
          {copied ? (
            <View style={styles.copyContainer}>
              <Text style={styles.copyAddressButton}>Copied</Text>
              <Ionicons
                name="checkmark"
                size={20}
                color="#007AFF"
                style={{ marginLeft: 5 }}
              />
            </View>
          ) : (
            <Text style={styles.copyAddressButton}>Copy Address</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => navigation.navigate("MyProfile")}
        >
          <Image source={profileImageSource} style={styles.profileImage} />
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>
              {userData
                ? userData.name.length > 25
                  ? userData.name.slice(0, 25) + "..."
                  : userData.name
                : "NodeLink User"}
            </Text>
            <Text style={styles.profileAddress}>
              {userData?.walletAddress || "Loading..."}
            </Text>
          </View>
          <ProfileRightArrow />
        </TouchableOpacity>

        {/* Security Settings */}
        <TouchableOpacity onPress={() => navigation.navigate("Security")}>
          <View style={styles.settingsItem}>
            <View style={styles.itemLeft}>
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color={isDarkMode ? "#FFF" : "#000"}
                style={{ marginRight: 12 }}
              />
              <Text style={styles.itemTitle}>Security Settings</Text>
            </View>
            <RightArrow />
          </View>
        </TouchableOpacity>

        {/* Theme */}
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <Ionicons
              name={isDarkMode ? "moon" : "sunny"}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
              style={{ marginRight: 12 }}
            />
            <Text style={styles.itemTitle}>
              {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </Text>
          </View>
          <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
        </View>

        {/* Notifications */}
        <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
          <View style={styles.settingsItem}>
            <View style={styles.itemLeft}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={isDarkMode ? "#FFF" : "#000"}
                style={{ marginRight: 12 }}
              />
              <Text style={styles.itemTitle}>Notifications</Text>
            </View>
            <RightArrow />
          </View>
        </TouchableOpacity>

        {/* Appearance */}
        <TouchableOpacity onPress={() => navigation.navigate("Appearance")}>
          <View style={styles.settingsItem}>
            <View style={styles.itemLeft}>
              <Ionicons
                name="color-palette-outline"
                size={24}
                color={isDarkMode ? "#FFF" : "#000"}
                style={{ marginRight: 12 }}
              />
              <Text style={styles.itemTitle}>Appearance</Text>
            </View>
            <RightArrow />
          </View>
        </TouchableOpacity>

        {/* Haptic Feedback */}
        <TouchableOpacity onPress={() => navigation.navigate("HapticFeedback")}>
          <View style={styles.settingsItem}>
            <View style={styles.itemLeft}>
              <Ionicons
                name="hardware-chip-outline"
                size={24}
                color={isDarkMode ? "#FFF" : "#000"}
                style={{ marginRight: 12 }}
              />
              <Text style={styles.itemTitle}>Turn on Haptic Feedback</Text>
            </View>
            <RightArrow />
          </View>
        </TouchableOpacity>

        {/* Privacy */}
        <TouchableOpacity onPress={() => navigation.navigate("PrivacyPolicy")}>
          <View style={styles.settingsItem}>
            <View style={styles.itemLeft}>
              <Ionicons
                name="lock-closed-outline"
                size={24}
                color={isDarkMode ? "#FFF" : "#000"}
                style={{ marginRight: 12 }}
              />
              <Text style={styles.itemTitle}>Privacy and Security</Text>
            </View>
            <RightArrow />
          </View>
        </TouchableOpacity>

        {/* Logout / Delete */}
        <View style={styles.accountActionsContainer}>
          <TouchableOpacity onPress={() => logout()}>
            <View style={styles.accountActionItem}>
              <Text style={styles.deleteTitle}>Logout</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log("Delete Account")}>
            <View style={styles.accountActionItem}>
              <Text style={[styles.deleteTitle, { color: "#FF3B30" }]}>
                Delete Account
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1C1C1D" : "#F2F2F2",
    },
    header: {
      height: 60,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
    },
    headerTitle: {
      fontSize: 25,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333333",
    },
    copyAddressButton: {
      fontSize: 13,
      color: "#007AFF",
    },
    copyContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    scrollContainer: {
      flex: 1,
    },
    profileContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#121212" : "#FFFFFF",
      padding: 16,
      height: 120,
      marginBottom: 35,
    },
    profileImage: {
      width: 75,
      height: 75,
      borderRadius: 40,
      marginRight: 12,
      backgroundColor: "#ccc",
    },
    profileTextContainer: {
      flex: 1,
      paddingRight: 15,
      paddingLeft: 5,
    },
    profileName: {
      fontSize: 19,
      fontFamily: "SF-Pro-Text-Medium",
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333333",
      marginBottom: 4,
    },
    profileAddress: {
      fontSize: 13,
      color: "#1E90FF",
      marginTop: 4,
    },
    settingsItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#121212" : "#FFFFFF",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#333" : "#EFEFEF",
      justifyContent: "space-between",
    },
    itemLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    itemTitle: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333333",
    },
    deleteTitle: {
      fontSize: 16,
      color: "#EB5545",
    },
    arrowIcon: {
      width: 7,
      height: 12,
      marginLeft: 8,
      tintColor: "#3C3C43",
    },
    profileArrowIcon: {
      width: 12,
      height: 18,
      marginLeft: 8,
      tintColor: "#3C3C43",
    },
    accountActionsContainer: {
      marginTop: 35,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? "#333" : "#ddd",
    },
    accountActionItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: isDarkMode ? "#121212" : "#FFFFFF",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#333" : "#EFEFEF",
    },
  });
