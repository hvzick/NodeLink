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
  ScrollView, // ← added
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
import { handleConnect } from "../../utils/ProfileUtils/HandleConnect";
import { generateSharedSecurityCode } from "../../backend/E2E-Encryption/SecurityCodeGen";
import { copyToClipboard } from "../../utils/GlobalUtils/CopyToClipboard";
import { handleSendMessage } from "../../utils/ProfileUtils/HandleGoToChat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../backend/Supabase/Supabase";
import {
  getUserDataFromSession,
  loadUserDataFromStorage,
  storeUserDataInStorage,
} from "../../backend/Local database/AsyncStorage/UserDataStorage/UtilityIndex";

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

  // --- publicKey display toggle state
  const [showFullPubKey, setShowFullPubKey] = useState(false);

  useEffect(() => {
    const fetchMyKey = async () => {
      const key = await AsyncStorage.getItem("walletAddress");
      setMyPublicKey(key);
    };
    fetchMyKey();
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!walletAddress) return;
      setIsProfileLoading(true);

      try {
        console.log("Loading user profile for:", walletAddress);

        const sessionData = getUserDataFromSession(walletAddress);
        if (sessionData) {
          setUserData(sessionData);
          setIsProfileLoading(false);
          console.log("Loaded user data from session cache");
          return;
        }

        const storageData = await loadUserDataFromStorage(walletAddress);
        if (storageData) {
          setUserData(storageData);
          setIsProfileLoading(false);
          console.log("Loaded user data from AsyncStorage");
          return;
        }

        console.log("Fetching user data from Supabase...");
        const { data: userProfile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("wallet_address", walletAddress)
          .single();

        if (error) {
          console.error("❌ Error fetching user profile:", error);
          setIsProfileLoading(false);
          return;
        }

        if (userProfile) {
          const mappedUserData: UserData = {
            walletAddress: userProfile.wallet_address,
            username: userProfile.username,
            name: userProfile.name,
            avatar: userProfile.avatar,
            bio: userProfile.bio,
            created_at: userProfile.created_at,
            publicKey: userProfile.public_key,
          };

          await storeUserDataInStorage(mappedUserData);
          setUserData(mappedUserData);
          console.log("User data fetched from Supabase and cached");
        }
      } catch (error) {
        console.error("❌ Error loading user profile:", error);
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadUserProfile();
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

  const connectToUser = async () => {
    if (!userData?.walletAddress) {
      console.error("Cannot connect: User data is not available.");
      return;
    }
    setIsConnecting(true);
    console.log("Initiating connection with", userData.walletAddress);
    const success = await handleConnect(userData.walletAddress);
    setIsConnecting(false);
    if (success) {
      setIsConnected(true);
      const updatedUserData = { ...userData };
      try {
        await storeUserDataInStorage(updatedUserData);
        console.log("Updated cached user data after connection");
      } catch (error) {
        console.error("❌ Error updating cached user data:", error);
      }
    }
  };

  const handleSendMessageWrapper = () =>
    handleSendMessage(
      isConnected,
      userData,
      chatList,
      addOrUpdateChat,
      navigation
    );

  if (isProfileLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={isDarkMode ? "#fff" : "#000"} />
        <Text style={[styles.infoText, { textAlign: "center", marginTop: 10 }]}>
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center" }]}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={isDarkMode ? "#fff" : "#000"}
        />
        <Text style={[styles.infoText, { textAlign: "center", marginTop: 10 }]}>
          Unable to load user profile
        </Text>
        <TouchableOpacity
          style={[
            styles.sideBySideButton,
            styles.connectButtonDefault,
            { marginTop: 20 },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, styles.connectButtonTextDefault]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- Function to shorten public key
  function shortenPublicKey(pk: string) {
    if (!pk) return "";
    if (pk.length <= 20) return pk;
    return `${pk.slice(0, 8)}...${pk.slice(-6)}`;
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

      {/* ← Wrap everything below in a ScrollView */}
      <ScrollView
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}
      >
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

          {/* ----------- THIS SECTION IS CHANGED ------------- */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Public Key</Text>
            <TouchableOpacity
              activeOpacity={0.65}
              onPress={() => setShowFullPubKey((prev) => !prev)}
            >
              <Text
                style={styles.publicKey}
                selectable
                selectionColor="#007AFF"
              >
                {showFullPubKey
                  ? userData?.publicKey || "Loading..."
                  : shortenPublicKey(userData?.publicKey || "Loading...")}
              </Text>
            </TouchableOpacity>
          </View>
          {/* ----------- END OF CHANGED SECTION ------------- */}
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
                <Animated.Text
                  style={[styles.copiedText, { opacity: fadeAnim }]}
                >
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
                  : styles.buttonDisabled,
              ]}
            >
              Message
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
      marginTop: 14,
      width: 100,
      height: 100,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: isDarkMode ? "#444" : "#fff",
      backgroundColor: "#ccc",
      elevation: 4,
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
    publicKey: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333333",
      fontFamily: Platform.select({ ios: "Courier", android: "monospace" }),
    },
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
    sendMessageButtonTextDisabled: {
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
        ios: "Courier",
        android: "monospace",
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
