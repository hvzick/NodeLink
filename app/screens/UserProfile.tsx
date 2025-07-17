// screens/UserProfile.tsx

import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
  Animated,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { useThemeToggle } from "../../utils/GlobalUtils/ThemeProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserData } from "../../backend/Supabase/RegisterUser";
import { format } from "date-fns";
import { handleOpenEtherscan } from "../../utils/MyProfileUtils/OpenEtherscan";
import { handleCopyAddress } from "../../utils/MyProfileUtils/CopyAddress";
import { handleCopyUsername } from "../../utils/MyProfileUtils/CopyUsername";
import { RootStackParamList } from "../App";
import { useChat } from "../../utils/ChatUtils/ChatContext";
import { loadUserData } from "../../utils/ProfileUtils/LoadUserData";
import { handleConnect } from "../../utils/ProfileUtils/HandleConnect";
import { generateSharedSecurityCode } from "../../backend/Encryption/SecurityCodeGen";
import { copyToClipboard } from "../../utils/GlobalUtils/CopyToClipboard";
import { handleSendMessage } from "../../utils/ProfileUtils/HandleGoToChat";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function UserProfile() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { walletAddress } = route.params as { walletAddress: string };

  const { addOrUpdateChat, chatList } = useChat();

  const { currentTheme } = useThemeToggle();
  const isDarkMode = currentTheme === "dark";
  const [copyWalletText, setCopyWalletText] = useState("");
  const [copyUsernameText, setCopyUsernameText] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [sharedSecurityCode, setSharedSecurityCode] = useState<string | null>(
    null
  );

  const styles = getStyles(isDarkMode);
  const [myPublicKey, setMyPublicKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchMyKey = async () => {
      const key = await AsyncStorage.getItem("walletAddress"); // or "publicKey"
      setMyPublicKey(key);
    };
    fetchMyKey();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      loadUserData(walletAddress, setUserData, setIsProfileLoading);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (userData && chatList && myPublicKey) {
      const conversationId = `convo_${userData.walletAddress}`;
      const exists = chatList.some((chat) => chat.id === conversationId);
      if (exists) {
        setIsConnected(true);
        const code = generateSharedSecurityCode(
          myPublicKey,
          userData.walletAddress
        );
        setSharedSecurityCode(code);
      }
    }
  }, [userData, chatList, myPublicKey]);

  // --- NEW: A self-contained handler function inside the component ---
  const connectToUser = async () => {
    // 1. Check if user data (containing the address) is loaded.
    if (!userData?.walletAddress) {
      console.error("Cannot connect: User data is not available.");
      return;
    }

    setIsConnecting(true);

    // 2. Call the imported utility, passing the wallet address.
    const success = await handleConnect(userData.walletAddress);

    setIsConnecting(false);

    // 3. Update the UI state based on the result.
    if (success) {
      setIsConnected(true);
    }
    // The handleConnect utility now shows its own alert on failure.
  };

  const handleSendMessageWrapper = () =>
    handleSendMessage(
      isConnected,
      userData,
      chatList,
      addOrUpdateChat,
      navigation
    );

  // Show a loading indicator while fetching profile data
  if (isProfileLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={isDarkMode ? "#fff" : "#000"} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color="#007AFF"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer} pointerEvents="none">
          <Text style={styles.headerTitleText}>User Profile</Text>
        </View>
      </View>

      <TouchableOpacity onPress={() => setShowAvatarModal(true)}>
        <Image
          source={
            userData?.avatar === "default" || !userData?.avatar
              ? require("../../assets/images/default-user-avatar.jpg")
              : { uri: userData?.avatar }
          }
          style={styles.avatar}
        />
      </TouchableOpacity>
      <Modal
        visible={showAvatarModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowAvatarModal(false)}
        >
          <Image
            source={
              userData?.avatar === "default" || !userData?.avatar
                ? require("../../assets/images/default-user-avatar.jpg")
                : { uri: userData?.avatar }
            }
            style={{
              width: 320,
              height: 320,
              borderRadius: 160,
              borderWidth: 4,
              borderColor: "#fff",
            }}
            resizeMode="contain"
          />
        </Pressable>
      </Modal>
      <Text style={styles.name}>{userData?.name || "NodeLink User"}</Text>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Wallet Address</Text>
          <TouchableOpacity
            onPress={() => handleCopyAddress(userData, setCopyWalletText)}
            onLongPress={() => handleOpenEtherscan(userData)}
          >
            <Text style={styles.wallet}>
              {userData?.walletAddress || "Loading..."}
            </Text>
          </TouchableOpacity>
          {copyWalletText ? (
            <Text style={styles.waCopyMessage}>{copyWalletText}</Text>
          ) : null}
        </View>
        <View style={styles.separator} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Username</Text>
          <TouchableOpacity
            onPress={() => handleCopyUsername(userData, setCopyUsernameText)}
          >
            <Text style={styles.username}>
              @{userData?.username || "loading..."}
            </Text>
          </TouchableOpacity>
          {copyUsernameText ? (
            <Text style={styles.uCopyMessage}>{copyUsernameText}</Text>
          ) : null}
        </View>
        <View style={styles.separator} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Bio</Text>
          <Text style={styles.infoText}>
            {userData?.bio || "Im not being spied on!"}
          </Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.infoRow}>
          <Text style={styles.label}>Public Key</Text>
          <Text
            style={styles.infoText}
            selectable
            numberOfLines={2}
          >
            {userData?.publicKey || "Loading..."}
          </Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.infoRow}>
          <Text style={styles.label}>Joined</Text>
          <Text style={styles.infoText}>
            {userData?.created_at
              ? format(new Date(userData.created_at), "MMMM d, yyyy")
              : "N/A"}
          </Text>
        </View>
        {isConnected && sharedSecurityCode && (
          <View style={[styles.infoRow, styles.securityBox]}>
            <Text style={styles.label}>Shared Security Code</Text>

            <TouchableOpacity
              onPress={() => {
                copyToClipboard(sharedSecurityCode);
                setCopied(true);
                Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => {
                  setTimeout(() => {
                    Animated.timing(fadeAnim, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => setCopied(false));
                  }, 1500);
                });
              }}
            >
              <Text style={styles.securityCode}>{sharedSecurityCode}</Text>
            </TouchableOpacity>

            {copied && (
              <Animated.Text style={[styles.copiedText, { opacity: fadeAnim }]}>
                ✅ Copied
              </Animated.Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.sideBySideButton,
            isConnected
              ? styles.connectButtonConnected
              : styles.connectButtonDefault,
            isButtonPressed && !isConnected && styles.connectButtonPressed,
            (!userData || isConnecting) && styles.buttonDisabled,
          ]}
          // --- Call the new component-level handler ---
          onPress={connectToUser}
          onPressIn={() => setIsButtonPressed(true)}
          onPressOut={() => setIsButtonPressed(false)}
          activeOpacity={0.8}
          disabled={!userData || isConnecting || isConnected}
        >
          <Text
            style={[
              styles.buttonText,
              isConnected
                ? styles.connectButtonTextConnected
                : styles.connectButtonTextDefault,
            ]}
          >
            {isConnecting
              ? "Connecting..."
              : isConnected
              ? "Connected"
              : "Connect"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sideBySideButton,
            styles.sendMessageButton,
            isConnected && styles.sendMessageButtonEnabled,
            !isConnected && styles.buttonDisabled,
          ]}
          onPress={handleSendMessageWrapper}
          disabled={!isConnected}
        >
          <Text
            style={[
              styles.buttonText,
              isConnected
                ? styles.sendMessageButtonTextEnabled
                : styles.buttonTextDisabled,
            ]}
          >
            Message
          </Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1C1C1D" : "#F2F2F2",
      alignItems: "center",
    },
    headerContainer: {
      height: 40,
      justifyContent: "center",
      backgroundColor: isDarkMode ? "#1C1C1D" : "#F2F2F2",
      width: "100%",
    },
    backButton: {
      position: "absolute",
      left: 10,
      flexDirection: "row",
      alignItems: "center",
      zIndex: 1,
    },
    backButtonText: {
      fontSize: 18,
      color: "#007AFF",
    },
    headerTitleContainer: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 0,
    },
    headerTitleText: {
      fontSize: 20,
      fontWeight: "600",
      fontFamily: "SF-Pro-Text-Medium",
      color: isDarkMode ? "#fff" : "#333333",
    },
    avatar: {
      top: 10,
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    name: {
      top: 10,
      fontSize: 22,
      fontFamily: "SF-Pro-Text-Medium",
      marginTop: 10,
      color: isDarkMode ? "#fff" : "#333333",
    },
    infoBox: {
      top: 10,
      backgroundColor: isDarkMode ? "#121212" : "#FFFFFF",
      width: "90%",
      borderRadius: 12,
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginVertical: 20,
    },
    infoRow: { paddingVertical: 10 },
    label: { fontSize: 12, color: "gray", marginBottom: 4 },
    wallet: { fontSize: 16, color: "#00A86B", flexWrap: "wrap" },
    username: { fontSize: 16, color: "#007AFF" },
    infoText: { fontSize: 16, color: isDarkMode ? "#fff" : "#333333" },
    separator: { height: 1, backgroundColor: isDarkMode ? "#333" : "#EFEFEF" },
    waCopyMessage: {
      fontSize: 14,
      color: "#00A86B",
      marginTop: 5,
      fontWeight: "400",
    },
    uCopyMessage: {
      fontSize: 14,
      color: "#007AFF",
      marginTop: 5,
      fontWeight: "400",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "90%",
      marginTop: 10,
    },
    sideBySideButton: {
      width: "48%",
      padding: 15,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    connectButtonDefault: {
      backgroundColor: "transparent",
      borderColor: isDarkMode ? "#fff" : "#000",
    },
    connectButtonTextDefault: {
      color: isDarkMode ? "#fff" : "#000",
    },
    connectButtonPressed: {
      backgroundColor: "rgba(0, 122, 255, 0.2)",
      borderColor: "rgba(0, 122, 255, 0.4)",
    },
    connectButtonConnected: {
      backgroundColor: "#007AFF",
      borderColor: "#007AFF",
    },
    connectButtonTextConnected: {
      color: "#FFFFFF",
    },
    sendMessageButton: {
      backgroundColor: "transparent",
      borderColor: isDarkMode ? "#555" : "#ccc",
    },
    sendMessageButtonEnabled: {
      borderColor: isDarkMode ? "#fff" : "#000",
    },
    sendMessageButtonTextEnabled: {
      color: isDarkMode ? "#fff" : "#000",
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonTextDisabled: {
      color: isDarkMode ? "#555" : "#ccc",
    },
    securityBox: {
      marginTop: 15,
      padding: 10,
      borderRadius: 10,
      backgroundColor: isDarkMode ? "#2C2C2E" : "#F0F0F5",
      alignItems: "center",
    },
    securityCode: {
      fontSize: 24,
      fontWeight: "800",
      fontFamily: Platform.select({
        ios: "Courier", // Built-in on iOS
        android: "monospace", // Built-in on Android
      }),
      color: isDarkMode ? "#00FFAA" : "#007AFF",
      letterSpacing: 2,
      marginTop: 4,
    },
    copiedText: {
      marginTop: 6,
      fontSize: 14,
      fontWeight: "500",
      color: "green",
    },
  });
