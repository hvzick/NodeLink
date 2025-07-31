import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  LayoutAnimation,
  UIManager,
  Modal,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeToggle } from "../../utils/GlobalUtils/ThemeProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserData } from "../../backend/Supabase/RegisterUser";
import { checkUsernameExists } from "../../backend/Supabase/CheckUsername";
import {
  validateName,
  validateUsername,
  validateBio,
} from "../../utils/MyProfileUtils/Validators";
import { handleOpenEtherscan } from "../../utils/MyProfileUtils/OpenEtherscan";
import { handleCopyAddress } from "../../utils/MyProfileUtils/CopyAddress";
import { handleCopyUsername } from "../../utils/MyProfileUtils/CopyUsername";
import { format } from "date-fns";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../backend/Supabase/Supabase";
import {
  getUserDataFromSession,
  loadUserDataFromStorage,
  storeUserDataInStorage,
} from "../../backend/Local database/AsyncStorage/UserDataStorage/UtilityIndex";
import { updateUserData } from "../../utils/ProfileUtils/HandleUpdateUserData";

export default function MyProfile() {
  const navigation = useNavigation();
  const { currentTheme } = useThemeToggle();
  const isDarkMode = currentTheme === "dark";
  const styles = getStyles(isDarkMode);

  // --- STATE ---
  const [copyWalletText, setCopyWalletText] = useState("");
  const [copyUsernameText, setCopyUsernameText] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sessionData, setSessionData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedUsername, setEditedUsername] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [editedAvatarUri, setEditedAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isNameValid, setIsNameValid] = useState(true);
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [isBioValid, setIsBioValid] = useState(true);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const showNotification = (
    message: string,
    type: "success" | "error",
    duration = 3000
  ) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotification({ message, type });

    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setNotification(null);
    }, duration);
  };

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Enhanced data loading function
  const loadUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Starting user data load...");

      const walletAddress = await AsyncStorage.getItem("walletAddress");
      if (!walletAddress) {
        console.warn("No wallet address found");
        setIsLoading(false);
        return;
      }

      console.log("Wallet address found:", walletAddress);

      // 1. Try to load from session cache first (fastest)
      const sessionData = getUserDataFromSession(walletAddress);
      if (sessionData) {
        console.log("Loaded user data from session cache");
        setSessionData(sessionData);
        setUserData(sessionData);
        setIsLoading(false);
        return;
      }

      // 2. Try to load from AsyncStorage (medium speed)
      const storageData = await loadUserDataFromStorage(walletAddress);
      if (storageData) {
        console.log("Loaded user data from AsyncStorage");
        setUserData(storageData);
        setSessionData(storageData);
        setIsLoading(false);
        return;
      }

      // 3. If no local data, try to fetch from Supabase
      console.log("No local data found, fetching from Supabase...");
      const { data: userProfile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", walletAddress)
        .single();

      if (error) {
        console.error("Error fetching from Supabase:", error);
        setIsLoading(false);
        return;
      }

      if (userProfile) {
        // Map Supabase data to UserData interface
        const mappedUserData: UserData = {
          walletAddress: userProfile.wallet_address,
          username: userProfile.username,
          name: userProfile.name,
          avatar: userProfile.avatar,
          bio: userProfile.bio,
          created_at: userProfile.created_at,
          publicKey: userProfile.public_key,
        };

        console.log("Fetched user data from Supabase");

        // Store in local storage for future use
        await storeUserDataInStorage(mappedUserData);

        setUserData(mappedUserData);
        setSessionData(mappedUserData);
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Error loading user data:", err);
      setIsLoading(false);
    }
  }, []); // Remove userData dependency to prevent infinite loops

  // Load data on component mount and when screen focuses
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Reload data when screen comes into focus (but only if no data exists)
  useFocusEffect(
    useCallback(() => {
      if (!userData) {
        loadUserData();
      }
    }, [userData, loadUserData])
  );

  useEffect(() => {
    if (userData?.walletAddress) {
      (async () => {
        const stored = await AsyncStorage.getItem(
          `crypto_key_pair_${userData.walletAddress}`
        );
        if (stored) {
          const parsed = JSON.parse(stored);
          setPublicKey(parsed.publicKey);
        } else {
          setPublicKey(null);
        }
      })();
    }
  }, [userData?.walletAddress]);

  useEffect(() => {
    if (userData) {
      setEditedName(userData.name || "");
      setEditedUsername(userData.username || "");
      setEditedBio(userData.bio || "");
    }
  }, [userData]);

  // Show loading screen while data is loading
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={isDarkMode ? "#fff" : "#000"} />
        <Text style={[styles.infoText, { textAlign: "center", marginTop: 10 }]}>
          Loading your profile...
        </Text>
      </SafeAreaView>
    );
  }

  // Show error screen if no data could be loaded
  if (!userData) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center" }]}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={isDarkMode ? "#fff" : "#000"}
        />
        <Text style={[styles.infoText, { textAlign: "center", marginTop: 10 }]}>
          Unable to load your profile
        </Text>
        <TouchableOpacity
          style={[styles.editButton, { marginTop: 20 }]}
          onPress={() => loadUserData()}
        >
          <Text style={styles.editButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleEditProfile = () => {
    setIsEditing(true);
    setIsNameValid(true);
    setIsUsernameValid(true);
    setIsBioValid(true);
  };

  const handleCancelEdit = () => {
    if (userData) {
      setEditedName(userData.name || "");
      setEditedUsername(userData.username || "");
      setEditedBio(userData.bio || "");
    }
    setEditedAvatarUri(null);
    setIsEditing(false);
    setUsernameTaken(false);
  };

  const handleNameChange = (text: string) => {
    setEditedName(text);
    setIsNameValid(validateName(text));
  };

  const handleUsernameChange = async (text: string) => {
    setEditedUsername(text);
    const valid = validateUsername(text);
    setIsUsernameValid(valid);
    if (valid && text.trim() !== userData?.username) {
      const exists = await checkUsernameExists(
        text.trim(),
        userData?.walletAddress || ""
      );
      setUsernameTaken(exists);
    } else {
      setUsernameTaken(false);
    }
  };

  const handleBioChange = (text: string) => {
    setEditedBio(text);
    setIsBioValid(validateBio(text));
  };

  const handleAvatarPress = async () => {
    if (!isEditing) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Denied",
        "You need to allow access to your photos."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return;
    setEditedAvatarUri(result.assets[0].uri);
  };

  const handleSaveProfile = async () => {
    if (!userData?.walletAddress) {
      showNotification("Wallet address not found.", "error");
      return;
    }
    if (!isNameValid || !isUsernameValid || !isBioValid || usernameTaken) {
      showNotification("Please correct the highlighted fields.", "error");
      return;
    }

    const avatarDidChange = editedAvatarUri !== null;
    const textDidChange =
      editedName.trim() !== (userData.name || "") ||
      editedUsername.trim() !== (userData.username || "") ||
      editedBio.trim() !== (userData.bio || "");

    if (!avatarDidChange && !textDidChange) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const updates: {
      name?: string;
      username?: string;
      bio?: string;
      avatar?: string;
    } = {};

    // Handle avatar upload if changed
    if (avatarDidChange && editedAvatarUri) {
      try {
        // Remove old avatar if exists
        if (
          userData?.avatar &&
          userData.avatar !== "default" &&
          !userData.avatar?.startsWith("require")
        ) {
          const oldAvatarPathParts = userData.avatar.split("/");
          const oldAvatarPath = `${userData.walletAddress}/${
            oldAvatarPathParts.pop()?.split("?")[0]
          }`;
          await supabase.storage.from("avatars").remove([oldAvatarPath]);
        }

        // Upload new avatar
        const fileExtension =
          editedAvatarUri.split(".").pop()?.toLowerCase() || "jpg";
        const contentType = `image/${fileExtension}`;
        const fileName = `avatar.${fileExtension}`;
        const filePath = `${userData.walletAddress}/${fileName}`;
        const formData = new FormData();
        formData.append("file", {
          uri: editedAvatarUri,
          name: fileName,
          type: contentType,
        } as any);

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, formData, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        updates.avatar = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.";
        showNotification(`Avatar upload failed: ${message}`, "error");
        setIsSaving(false);
        return;
      }
    }

    // Handle text changes
    if (textDidChange) {
      if (editedName.trim() !== (userData.name || ""))
        updates.name = editedName.trim();
      if (editedUsername.trim() !== (userData.username || ""))
        updates.username = editedUsername.trim();
      if (editedBio.trim() !== (userData.bio || ""))
        updates.bio = editedBio.trim();
    }

    // Create final updated user data
    const finalUserData = { ...userData, ...updates };

    // Sync with Supabase and update all storage layers
    const syncResult = await updateUserData(
      finalUserData,
      setUserData,
      setSessionData
    );

    if (syncResult.success) {
      setIsEditing(false);
      setEditedAvatarUri(null);
      setUsernameTaken(false);
      showNotification("Profile updated successfully!", "success");
    } else {
      showNotification(`Update failed: ${syncResult.error}`, "error");
    }

    setIsSaving(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1, width: "100%" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* --- HEADER --- */}
        <View style={styles.headerContainer}>
          {isEditing ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCancelEdit}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
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
          )}
          <View style={styles.headerTitleContainer} pointerEvents="none">
            <Text style={styles.headerTitleText}>My Profile</Text>
          </View>
          {isEditing ? (
            <View style={styles.editButtonsContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* --- SCROLLVIEW CONTENT --- */}
        <ScrollView
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* --- AVATAR WITH LOADING --- */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={
                isEditing ? handleAvatarPress : () => setShowAvatarModal(true)
              }
              disabled={isEditing && !handleAvatarPress}
            >
              <Image
                source={
                  editedAvatarUri
                    ? { uri: editedAvatarUri }
                    : userData?.avatar === "default" || !userData?.avatar
                    ? require("../../assets/images/default-user-avatar.jpg")
                    : { uri: userData.avatar }
                }
                style={styles.avatar}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
              {imageLoading && !imageError && (
                <View style={[styles.avatar, styles.loadingOverlay]}>
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              )}
              {isEditing && (
                <View style={styles.avatarEditOverlay}>
                  <Ionicons name="camera-outline" size={32} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Avatar Modal */}
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
                    editedAvatarUri
                      ? { uri: editedAvatarUri }
                      : userData?.avatar === "default" || !userData?.avatar
                      ? require("../../assets/images/default-user-avatar.jpg")
                      : { uri: userData.avatar }
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
          </View>

          {/* --- NAME --- */}
          {isEditing ? (
            <TextInput
              style={[
                styles.name,
                styles.editableText,
                !isNameValid && styles.invalidText,
              ]}
              value={editedName}
              onChangeText={handleNameChange}
              placeholder="Your Name"
              maxLength={30}
            />
          ) : (
            <Text style={styles.name}>{userData?.name || "NodeLink User"}</Text>
          )}

          {/* --- INFO BOX --- */}
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
              {isEditing ? (
                <>
                  <TextInput
                    style={[
                      styles.username,
                      styles.editableText,
                      (!isUsernameValid || usernameTaken) && styles.invalidText,
                    ]}
                    value={editedUsername}
                    onChangeText={handleUsernameChange}
                    placeholder="Your Username"
                    maxLength={20}
                    autoCapitalize="none"
                  />
                  {usernameTaken && (
                    <Text style={[styles.uCopyMessage, { color: "#EB5545" }]}>
                      This username is already taken.
                    </Text>
                  )}
                </>
              ) : (
                <TouchableOpacity
                  onPress={() =>
                    handleCopyUsername(userData, setCopyUsernameText)
                  }
                  onLongPress={() => handleOpenEtherscan(userData)}
                >
                  <Text style={styles.username}>
                    @{userData?.username || "loading..."}
                  </Text>
                </TouchableOpacity>
              )}
              {copyUsernameText ? (
                <Text style={styles.uCopyMessage}>{copyUsernameText}</Text>
              ) : null}
            </View>

            <View style={styles.separator} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Bio</Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.infoText,
                    styles.editableText,
                    styles.bioInput,
                    !isBioValid && styles.invalidText,
                  ]}
                  value={editedBio}
                  onChangeText={handleBioChange}
                  placeholder="Tell us about yourself"
                  multiline
                  maxLength={150}
                />
              ) : (
                <Text style={styles.infoText}>
                  {userData?.bio || "I'm not being spied on!"}
                </Text>
              )}
            </View>

            <View style={styles.separator} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Public Key</Text>
              <Text style={styles.publicKey} selectable>
                {publicKey || "Loading..."}
              </Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Joined</Text>
              <Text style={styles.infoText}>
                {userData?.created_at
                  ? format(new Date(userData.created_at), "MMMM d, yy")
                  : "N/A"}
              </Text>
            </View>
          </View>

          {/* --- NOTIFICATION --- */}
          {notification && (
            <View
              style={[
                styles.notificationContainer,
                {
                  backgroundColor:
                    notification.type === "success" ? "#007AFF" : "#dc3545",
                },
              ]}
            >
              <Text style={styles.notificationText}>
                {notification.message}
              </Text>
            </View>
          )}
        </ScrollView>
        <StatusBar style="auto" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1C1C1D" : "#F2F2F2",
    },
    scrollContentContainer: {
      alignItems: "center",
      paddingBottom: 50,
    },
    headerContainer: {
      height: 40,
      justifyContent: "center",
      backgroundColor: isDarkMode ? "#1C1C1D" : "#F2F2F2",
      width: "100%",
      zIndex: 10,
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
    cancelButtonText: {
      fontSize: 18,
      left: 10,
      color: "#EB5545",
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
    avatarContainer: {
      marginTop: 10,
      position: "relative",
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    loadingOverlay: {
      position: "absolute",
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(240, 240, 240, 0.8)",
    },
    avatarEditOverlay: {
      position: "absolute",
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      justifyContent: "center",
      alignItems: "center",
    },
    name: {
      marginTop: 20,
      fontSize: 22,
      fontFamily: "SF-Pro-Text-Medium",
      color: isDarkMode ? "#fff" : "#333333",
      textAlign: "center",
    },
    infoBox: {
      marginTop: 20,
      backgroundColor: isDarkMode ? "#121212" : "#FFFFFF",
      width: "90%",
      borderRadius: 12,
      paddingHorizontal: 15,
      marginBottom: 0,
    },
    infoRow: {
      paddingVertical: 12,
    },
    label: {
      fontSize: 12,
      color: "gray",
      marginBottom: 4,
    },
    wallet: {
      fontSize: 16,
      color: "#00A86B",
      flexWrap: "wrap",
    },
    username: {
      fontSize: 16,
      color: "#007AFF",
      textAlign: "left",
    },
    infoText: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333333",
    },
    separator: {
      height: 1,
      backgroundColor: isDarkMode ? "#333" : "#EFEFEF",
    },
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
    editButton: {
      position: "absolute",
      right: 20,
      flexDirection: "row",
      alignItems: "center",
      zIndex: 1,
    },
    editButtonText: {
      fontSize: 18,
      color: "#007AFF",
    },
    editButtonsContainer: {
      position: "absolute",
      right: 10,
      flexDirection: "row",
      alignItems: "center",
      zIndex: 1,
    },
    saveButton: {
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    saveButtonText: {
      fontSize: 18,
      color: "#007AFF",
      fontWeight: "600",
    },
    publicKey: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333333",
      fontFamily: Platform.select({ ios: "Courier", android: "monospace" }),
    },
    editableText: {
      borderBottomWidth: 1,
      borderBottomColor: "gray",
      paddingBottom: 2,
    },
    bioInput: {
      minHeight: 40,
      textAlignVertical: "top",
    },
    invalidText: {
      color: "#dc3545",
      borderBottomColor: "#dc3545",
    },
    notificationContainer: {
      width: "90%",
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 15,
      marginTop: 20,
    },
    notificationText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "bold",
      textAlign: "center",
    },
  });
