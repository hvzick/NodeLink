import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  generateAndStoreKeys,
  handleAndPublishKeys,
} from "../../backend/Encryption/HandleKeys";
import * as LocalAuthentication from "expo-local-authentication";
import { getCompressedPublicKey } from "../../backend/Encryption/SharedKey";
import RotatingShimmerButton from "../../utils/GlobalUtils/ShimmerVutton";
import { validateKeyPair } from "../../backend/Encryption/KeyGen";

export default function SecurityScreen() {
  const navigation = useNavigation();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [compressedPublicKey, setCompressedPublicKey] = useState<string | null>(
    null
  );
  const [changeSuccess, setChangeSuccess] = useState(false);
  const [keysValid, setKeysValid] = useState(false);

  // load keys on mount
  useEffect(() => {
    refreshKeyData();
  }, []);

  // helper to load from AsyncStorage
  const refreshKeyData = async () => {
    const addr = await AsyncStorage.getItem("walletAddress");
    setWalletAddress(addr);
    if (addr) {
      const raw = await AsyncStorage.getItem(`crypto_key_pair_${addr}`);
      if (raw) {
        const keyPair = JSON.parse(raw);
        setPublicKey(keyPair.publicKey);
        setPrivateKey(keyPair.privateKey);
        try {
          const compressed = getCompressedPublicKey(keyPair.publicKey);
          setCompressedPublicKey(compressed);
        } catch (e) {
          console.error("Compression error:", e);
          setCompressedPublicKey(null);
        }
      }
    }
    setLoading(false);
  };

  const handlePrivatePress = async () => {
    if (showPrivate) return;
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      Alert.alert(
        "Biometric authentication not available",
        "No biometrics or device PIN enrolled."
      );
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to view your private key",
      fallbackLabel: "Enter device PIN",
    });
    if (result.success) {
      setShowPrivate(true);
    } else {
      Alert.alert("Authentication failed", "Could not verify your identity.");
    }
  };

  const handleChangeKey = async () => {
    if (!walletAddress) return;
    // Store old private key for later comparison
    const oldRaw = await AsyncStorage.getItem(
      `crypto_key_pair_${walletAddress}`
    );
    if (oldRaw) {
      const oldKeyPair = JSON.parse(oldRaw);
      await AsyncStorage.setItem(
        `old_private_key_${walletAddress}`,
        oldKeyPair.privateKey
      );
    }
    Alert.alert(
      "Change Key Pair",
      "Are you sure you want to generate a new key pair? This will replace your current keys.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Change",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            setChangeSuccess(false);
            await generateAndStoreKeys(walletAddress); // always generate new key pair
            await handleAndPublishKeys(walletAddress); // upload new public key
            await refreshKeyData(); // refresh UI with new keys
            setActionLoading(false);
            setChangeSuccess(true);
          },
        },
      ]
    );
  };

  const handleValidateKeys = async () => {
    if (!walletAddress) return;
    const raw = await AsyncStorage.getItem(`crypto_key_pair_${walletAddress}`);
    if (raw) {
      const keyPair = JSON.parse(raw);
      const isValid = validateKeyPair(keyPair.publicKey, keyPair.privateKey);
      setKeysValid(isValid);
      if (isValid) {
        Alert.alert("Validation", "Key pair is valid.");
      } else {
        Alert.alert("Validation", "Key pair is INVALID!");
      }
    } else {
      setKeysValid(false);
      Alert.alert("Validation", "No key pair found.");
    }
  };

  const maskPrivateKey = (key: string | null): string =>
    key
      ? key
          .split("")
          .map(() => (Math.random() > 0.5 ? "." : "_"))
          .join("")
      : "";

  const styles = getStyles();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer} pointerEvents="none">
          <Text style={styles.headerTitleText}>Security</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.contentContainer}>
          <Text style={styles.label}>Public Key:</Text>
          <Text style={styles.keyBox}>{publicKey || "No key found."}</Text>

          <Text style={styles.label}>Compressed Public Key:</Text>
          <Text style={styles.keyBox}>
            {compressedPublicKey || "No compressed key found."}
          </Text>

          <Text style={styles.label}>Private Key:</Text>
          <View style={styles.privateKeyRow}>
            <TouchableOpacity
              onPress={handlePrivatePress}
              activeOpacity={0.7}
              style={{ flex: 1 }}
            >
              <Text style={styles.keyBox}>
                {showPrivate ? privateKey : maskPrivateKey(privateKey)}
              </Text>
            </TouchableOpacity>
          </View>

          {actionLoading ? (
            <RotatingShimmerButton style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Changing...</Text>
            </RotatingShimmerButton>
          ) : changeSuccess ? (
            <View style={[styles.actionButton, { backgroundColor: "#4CD964" }]}>
              <Text style={styles.actionButtonText}>Successful</Text>
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleChangeKey}
              >
                <Text style={styles.actionButtonText}>Change Key Pair</Text>
              </TouchableOpacity>
              {keysValid ? (
                <View style={[styles.actionButton, styles.validButton]}>
                  <Text style={styles.actionButtonText}>Valid Keys</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.validateButton]}
                  onPress={handleValidateKeys}
                >
                  <Text style={styles.actionButtonText}>Validate Keys</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
const getStyles = () =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F2F2F2" },
    headerContainer: {
      position: "relative",
      flexDirection: "row",
      alignItems: "center",
      height: 40,
      paddingHorizontal: 16,
      backgroundColor: "#F2F2F2",
    },
    backButton: {
      width: 100,
      flexDirection: "row",
      alignItems: "center",
      zIndex: 1,
    },
    backButtonText: { fontSize: 17, color: "#007AFF", marginLeft: 4 },
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
    headerTitleText: { fontSize: 20, fontWeight: "600", color: "#333333" },
    contentContainer: { marginTop: 40, paddingHorizontal: 20 },
    label: { fontSize: 16, fontWeight: "bold", marginBottom: 8, color: "#333" },
    keyBox: {
      fontSize: 13,
      backgroundColor: "#fff",
      padding: 12,
      borderRadius: 8,
      marginBottom: 24,
      color: "#333",
      fontFamily: "monospace",
    },
    actionButton: {
      backgroundColor: "#007AFF",
      padding: 14,
      borderRadius: 8,
      marginBottom: 16,
      alignItems: "center",
    },
    actionButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    privateKeyRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    buttonRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 0,
      marginBottom: 16,
    },
    validateButton: {
      backgroundColor: "#4CAF50", // A different color for validation
    },
    validButton: {
      backgroundColor: "#4CD964",
      justifyContent: "center",
      alignItems: "center",
    },
  });
