// screens/Settings/SettingsScreen.tsx

import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { copyToClipboard } from "../../utils/GlobalUtils/CopyToClipboard";
import { useThemeToggle } from "../../utils/GlobalUtils/ThemeProvider";
import { UserData } from "../../backend/Supabase/RegisterUser";
import {
  getUserDataFromSession,
  loadUserDataFromStorage,
} from "../../backend/Local database/AsyncStorage/UserDataStorage/UtilityIndex";
import { refreshUserDataFromSupabase } from "../../backend/Supabase/RefreshUserData";
import ArrowSVG from "../../assets/images/arrow-icon.svg";
import ProfileArrowSvg from "../../assets/images/profile-arrow-icon.svg";
import { useLogout } from "../../utils/AuthenticationUtils/Logout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { deleteUserByWallet } from "../../backend/Supabase/DeleteUserData";

// Navigation type
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
  const logout = useLogout(); // Your logout function
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Load wallet address first
  useEffect(() => {
    const loadWalletAddress = async () => {
      try {
        const address = await AsyncStorage.getItem("walletAddress");
        if (address) {
          setWalletAddress(address);
        }
      } catch (error) {
        console.error("❌ Error loading wallet address:", error);
      }
    };
    loadWalletAddress();
  }, []);

  // Load user data function
  const loadUserData = useCallback(async () => {
    if (!walletAddress) {
      console.warn("No wallet address available");
      return;
    }

    // First try to get from session memory (fastest)
    const sessionData = getUserDataFromSession(walletAddress);
    if (sessionData) {
      setUserData(sessionData);
      return;
    }

    // If not in session, try to load from storage (now with wallet address parameter)
    const storageData = await loadUserDataFromStorage(walletAddress);
    if (storageData) {
      setUserData(storageData);
      return;
    }

    // If still no data, try to refresh from Supabase
    console.log("No local data found, refreshing from Supabase...");
    try {
      const refreshedData = await refreshUserDataFromSupabase();
      if (refreshedData) {
        setUserData(refreshedData as UserData);
      }
    } catch (error) {
      console.error("❌ Error refreshing from Supabase:", error);
    }
  }, [walletAddress]);

  // Load data when wallet address is available
  useEffect(() => {
    if (walletAddress) {
      loadUserData();
    }
  }, [walletAddress, loadUserData]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (walletAddress) {
        loadUserData();
      }
    }, [walletAddress, loadUserData])
  );

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshedData = await refreshUserDataFromSupabase();
      if (refreshedData) {
        setUserData(refreshedData as UserData);
      }
    } catch (error) {
      console.error("❌ Error during pull-to-refresh:", error);
    } finally {
      setIsRefreshing(false);
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

  const handleDeleteAccount = () => {
    Alert.alert(
      "⚠️ Delete Account",
      `This action will permanently delete your account and all associated data including:\n\n• Your profile information\n• All chat messages\n• Encryption keys\n• User preferences\n• Profile images\n\nThis action cannot be undone and you will be logged out immediately.\n\nAre you sure you want to continue?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => console.log("Account deletion cancelled"),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Second confirmation with stronger warning
            Alert.alert(
              "🚨 Final Confirmation",
              `This is your last chance to cancel.\n\nYour account "${
                userData?.username || "Unknown"
              }" will be permanently deleted and you will be logged out immediately.\n\nThis action is irreversible.\n\nAre you absolutely sure?`,
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => console.log("Final confirmation cancelled"),
                },
                {
                  text: "YES, DELETE FOREVER",
                  style: "destructive",
                  onPress: performAccountDeletion,
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Create a logout function without the confirmation dialog for account deletion
  const logoutWithoutConfirmation = () => {
    return new Promise<void>((resolve) => {
      // We need to bypass the confirmation dialog in your logout function
      // Since your logout function shows an Alert, we'll handle the logout manually here
      const performLogout = async () => {
        try {
          console.log("🚪 Starting logout process after account deletion...");

          // Clear all local data (similar to your logout function but without the alert)
          await AsyncStorage.clear();
          console.log("All local storage cleared");

          // You might want to call setIsLoggedIn(false) here if you have access to it
          // For now, we'll resolve and let the navigation happen
          resolve();
        } catch (error) {
          console.error("❌ Error during logout:", error);
          resolve(); // Still resolve to continue the flow
        }
      };

      performLogout();
    });
  };

  // Account deletion function using your logout
  const performAccountDeletion = async () => {
    if (!userData?.walletAddress) {
      Alert.alert("Error", "No wallet address found. Cannot delete account.");
      return;
    }

    setIsDeletingAccount(true);

    try {
      console.log("🗑️ Starting account deletion process...");

      // Step 1: Delete user from Supabase
      const result = await deleteUserByWallet(userData.walletAddress);

      if (result.success) {
        console.log("Account deleted successfully from Supabase");

        // Clear local state immediately
        setUserData(null);
        setWalletAddress(null);

        // Step 2: Show success message
        Alert.alert(
          "✅ Account Deleted",
          "Your account has been permanently deleted from our servers. You will now be logged out and all local data will be cleared.",
          [
            {
              text: "OK",
              onPress: () => {
                console.log("🚪 Proceeding with logout after account deletion");
                // Call your logout function which will handle the confirmation and cleanup
                logout();
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        console.error("❌ Account deletion failed:", result.error);

        Alert.alert(
          "❌ Deletion Failed",
          `Unable to delete your account: ${result.error}\n\nPlease try again or contact support if the problem persists.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("❌ Unexpected error during account deletion:", error);

      Alert.alert(
        "❌ Deletion Error",
        "An unexpected error occurred while deleting your account. Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsDeletingAccount(false);
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
      : require("../../assets/images/default-user-avatar.jpg");

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

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => navigation.navigate("MyProfile")}
        >
          <View style={styles.profileImageContainer}>
            <Image
              source={profileImageSource}
              style={styles.profileImage}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator
                  size="small"
                  color={isDarkMode ? "#fff" : "#007AFF"}
                />
              </View>
            )}
          </View>
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>
              {userData
                ? userData.name && userData.name.length > 25
                  ? userData.name.slice(0, 25) + "..."
                  : userData.name ?? "NodeLink User"
                : "NodeLink User"}
            </Text>
            <Text style={styles.profileAddress}>
              {userData?.walletAddress ?? "Loading..."}
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
          <TouchableOpacity onPress={logout}>
            <View style={styles.accountActionItem}>
              <View style={styles.itemLeft}>
                <Text style={[styles.itemTitle, { color: "#FF3B30" }]}>
                  Logout
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            disabled={isDeletingAccount}
            style={[
              styles.accountActionItem,
              isDeletingAccount && styles.disabledItem,
            ]}
          >
            <View style={styles.itemLeft}>
              {isDeletingAccount ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#FF3B30"
                    style={{ marginRight: 12 }}
                  />
                  <Text style={[styles.deleteTitle, { color: "#FF3B30" }]}>
                    Deleting Account...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.deleteTitle, { color: "#FF3B30" }]}>
                    Delete Account
                  </Text>
                </>
              )}
            </View>
            {!isDeletingAccount && (
              <Ionicons name="warning-outline" size={20} color="#FF3B30" />
            )}
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
    profileImageContainer: {
      position: "relative",
      marginRight: 12,
    },
    profileImage: {
      width: 75,
      height: 75,
      borderRadius: 40,
      backgroundColor: "#ccc",
    },
    imageLoadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 75,
      height: 75,
      borderRadius: 40,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      justifyContent: "center",
      alignItems: "center",
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
    disabledItem: {
      opacity: 0.6,
    },
  });
