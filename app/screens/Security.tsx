import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { refreshKeyData } from "../../utils/Security/HandleRefreshData";
import { handlePrivatePress } from "../../utils/Security/HandlePrivateKeyPress";
import { handleChangeKey } from "../../utils/Security/HandleChangeKey";
import { handleValidateKeys } from "../../utils/Security/HandleValidateKeys";
import { useThemeToggle } from "../../utils/GlobalUtils/ThemeProvider";

interface SharedItem {
  name: string;
  sharedPublicKey: string;
  sharedSecret: string;
}

// Add proper typing for navigation
type SecurityScreenNavigationProp = StackNavigationProp<any>;

const SecurityScreen: React.FC = () => {
  const navigation = useNavigation<SecurityScreenNavigationProp>();
  const { currentTheme } = useThemeToggle();
  const isDarkMode = currentTheme === "dark";
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userPublicKey, setUserPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [compressedPublicKey, setCompressedPublicKey] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [changeSuccess, setChangeSuccess] = useState(false);
  const [keysValid, setKeysValid] = useState(false);
  const [sharedList, setSharedList] = useState<SharedItem[]>([]);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>(
    {}
  );

  // Extracted to variable to allow refresh calls inside useFocusEffect
  const loadSharedSecrets = useCallback(async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const sharedKeys = allKeys.filter((k) => k.startsWith("shared_key_"));
      const entries = await AsyncStorage.multiGet(sharedKeys);

      const items: SharedItem[] = [];
      const visibilityMap: Record<string, boolean> = {};

      for (const [storageKey, secret] of entries) {
        const sharedKey = storageKey.replace("shared_key_", "");
        let name = sharedKey;
        visibilityMap[sharedKey] = false;

        try {
          const raw = await AsyncStorage.getItem(`user_profile_${sharedKey}`);
          if (raw) {
            const profile = JSON.parse(raw);
            if (profile.name) {
              name = profile.name;
            }
          }
        } catch (e) {
          console.log(`Error parsing profile for ${sharedKey}`, e);
        }

        items.push({
          name,
          sharedPublicKey: sharedKey,
          sharedSecret: secret || "",
        });
      }

      setSharedList(items);
      setVisibleSecrets(visibilityMap);
    } catch (e) {
      console.log("Failed to load shared secrets", e);
      setSharedList([]);
    }
  }, []);

  // Only resets on mount/unmount
  useEffect(() => {
    setKeysValid(false);
    setChangeSuccess(false);
  }, []);

  // Use useFocusEffect to always refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setLoading(true);

      const fetchData = async () => {
        await refreshKeyData(
          setWalletAddress,
          setUserPublicKey,
          setPrivateKey,
          setCompressedPublicKey,
          setLoading
        );
        await loadSharedSecrets();
        // Don't set state if unmounted
        if (isActive) setLoading(false);
      };

      fetchData();

      return () => {
        isActive = false;
        setKeysValid(false);
        setChangeSuccess(false);
      };
    }, [loadSharedSecrets])
  );

  const maskString = (str: string | null): string =>
    str
      ? Array.from({ length: str.length })
          .map(() => (Math.random() > 0.5 ? "." : "-"))
          .join("")
      : "";

  const toggleSecretVisibility = (key: string) => {
    setVisibleSecrets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleText}>Security</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          style={styles.scrollViewContainer}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.contentContainer}>
            {/* User Keys */}
            <Text style={styles.label}>Public Key:</Text>
            <Text style={styles.keyBox}>
              {userPublicKey ?? "No key found."}
            </Text>

            <Text style={styles.label}>Compressed Public Key:</Text>
            <Text style={styles.keyBox}>
              {compressedPublicKey ?? "No compressed key found."}
            </Text>

            <Text style={styles.label}>Private Key:</Text>
            <TouchableWithoutFeedback
              onPress={() => handlePrivatePress(showPrivate, setShowPrivate)}
            >
              <View style={styles.privateKeyRow}>
                <Text style={styles.keyBox}>
                  {showPrivate ? privateKey : maskString(privateKey)}
                </Text>
              </View>
            </TouchableWithoutFeedback>

            {/* Actions */}
            <View style={styles.buttonWrapper}>
              <Pressable
                style={[
                  styles.button,
                  actionLoading
                    ? styles.neutralButton
                    : changeSuccess
                    ? styles.blueOutline
                    : styles.neutralButton,
                ]}
                onPress={() => {
                  if (!actionLoading && !changeSuccess) {
                    Alert.alert(
                      "Change Key Pair",
                      "Are you sure you want to generate a new key pair? This will replace your current keys.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Change",
                          style: "destructive",
                          onPress: () =>
                            handleChangeKey(
                              walletAddress,
                              setActionLoading,
                              setChangeSuccess,
                              () =>
                                refreshKeyData(
                                  setWalletAddress,
                                  setUserPublicKey,
                                  setPrivateKey,
                                  setCompressedPublicKey,
                                  setLoading
                                )
                            ),
                        },
                      ]
                    );
                  }
                }}
              >
                <Text
                  style={
                    changeSuccess ? styles.blueText : styles.buttonTextDefault
                  }
                >
                  {actionLoading
                    ? "Changing..."
                    : changeSuccess
                    ? "Successful"
                    : "Change Key Pair"}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.button,
                  keysValid ? styles.greenOutline : styles.neutralButton,
                ]}
                onPress={() => handleValidateKeys(walletAddress, setKeysValid)}
              >
                <Text
                  style={
                    keysValid ? styles.greenText : styles.buttonTextDefault
                  }
                >
                  {keysValid ? "Valid Keys" : "Validate Keys"}
                </Text>
              </Pressable>
            </View>

            {/* Shared Secrets - Non-scrollable Container */}
            <View style={styles.sharedSecretsContainer}>
              <Text style={styles.label}>Shared Secrets</Text>

              <View style={styles.sharedSecretsContent}>
                {sharedList.length === 0 ? (
                  <Text style={styles.infoText}>No shared secrets found.</Text>
                ) : (
                  sharedList.map((item, index) => (
                    <View key={item.sharedPublicKey}>
                      <View style={styles.sharedItem}>
                        <View style={styles.sharedRow}>
                          <Text style={styles.sharedLabel}>Name:</Text>
                          <Text style={styles.sharedValueName}>
                            {item.name}
                          </Text>
                        </View>
                        <View style={styles.sharedRow}>
                          <Text style={styles.sharedLabel}>Public Key:</Text>
                          <Text style={styles.sharedValue}>
                            {item.sharedPublicKey}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() =>
                            toggleSecretVisibility(item.sharedPublicKey)
                          }
                        >
                          <View style={styles.sharedRowLast}>
                            <Text style={styles.sharedLabel}>
                              Shared Secret:
                            </Text>
                            <Text style={styles.sharedValue}>
                              {visibleSecrets[item.sharedPublicKey]
                                ? item.sharedSecret
                                : maskString(item.sharedSecret)}
                            </Text>
                          </View>
                        </Pressable>
                      </View>
                      {index < sharedList.length - 1 && (
                        <View style={styles.separator} />
                      )}
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default SecurityScreen;

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1C1C1D" : "#F2F2F2",
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      height: 40,
      paddingHorizontal: 16,
      backgroundColor: isDarkMode ? "#1C1C1D" : "#F2F2F2",
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    backButtonText: {
      fontSize: 17,
      color: "#007AFF",
      marginLeft: 4,
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
    scrollViewContainer: {
      flex: 1,
    },
    scrollViewContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    contentContainer: {
      marginTop: 20,
      paddingHorizontal: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
      color: isDarkMode ? "#fff" : "#333",
    },
    keyBox: {
      fontSize: 15,
      backgroundColor: isDarkMode ? "#121212" : "#fff",
      padding: 12,
      borderRadius: 8,
      marginBottom: 24,
      fontFamily: "monospace",
      color: isDarkMode ? "#fff" : "#333",
    },
    privateKeyRow: {
      marginBottom: 24,
    },
    buttonWrapper: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 32,
      marginTop: -25,
    },
    button: {
      flex: 1,
      height: 50,
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    neutralButton: {
      backgroundColor: "transparent",
      borderColor: isDarkMode ? "#555" : "#999",
    },
    blueOutline: {
      backgroundColor: "transparent",
      borderColor: "#007AFF",
    },
    greenOutline: {
      backgroundColor: "transparent",
      borderColor: "#34C759",
    },
    blueText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#007AFF",
    },
    greenText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#34C759",
    },
    buttonTextDefault: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#ccc" : "#666",
    },
    infoText: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "#888",
      textAlign: "center",
      marginTop: 10,
    },
    sharedSecretsContainer: {
      marginBottom: 20,
    },
    sharedSecretsContent: {
      backgroundColor: isDarkMode ? "#222" : "#fff",
      borderRadius: 15,
      padding: 8,
    },
    sharedItem: {
      backgroundColor: isDarkMode ? "#333" : "#f9f9f9",
      padding: 12,
      borderRadius: 8,
    },
    sharedRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    sharedRowLast: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    sharedLabel: {
      width: 100,
      fontSize: 14,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
    },
    sharedValue: {
      flex: 1,
      fontSize: 14,
      color: isDarkMode ? "#fff" : "#555",
      marginLeft: 8,
    },
    sharedValueName: {
      flex: 1,
      fontSize: 15,
      color: isDarkMode ? "#fff" : "#555",
      marginLeft: 8,
    },
    separator: {
      height: 1,
      backgroundColor: isDarkMode ? "#444" : "#e0e0e0",
      marginVertical: 4,
    },
  });
