import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  generateAndStoreKeys,
  handleAndPublishKeys,
} from "../../backend/Encryption/HandleKeys";
import * as LocalAuthentication from "expo-local-authentication";
import { getCompressedPublicKey } from "../../backend/Encryption/SharedKey";
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

  useEffect(() => {
    refreshKeyData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setKeysValid(false);
        setChangeSuccess(false);
      };
    }, [])
  );

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
        } catch {
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
    if (result.success) setShowPrivate(true);
    else
      Alert.alert("Authentication failed", "Could not verify your identity.");
  };

  const handleChangeKey = async () => {
    if (!walletAddress) return;
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
            await generateAndStoreKeys(walletAddress);
            await handleAndPublishKeys(walletAddress);
            await refreshKeyData();
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
      const valid = validateKeyPair(keyPair.publicKey, keyPair.privateKey);
      setKeysValid(valid);
    } else {
      setKeysValid(false);
    }
  };

  const maskPrivateKey = (key: string | null): string =>
    key
      ? key
          .split("")
          .map(() => (Math.random() > 0.5 ? "." : "-"))
          .join("")
      : "";

  const ButtonWithScale = ({
    onPress,
    children,
    style,
    disabled,
  }: {
    onPress: () => void;
    children: React.ReactNode;
    style?: any;
    disabled?: boolean;
  }) => {
    const scale = new Animated.Value(1);
    const animate = (toValue: number) => {
      Animated.spring(scale, { toValue, useNativeDriver: true }).start();
    };
    return (
      <TouchableWithoutFeedback
        onPressIn={() => animate(1.06)}
        onPressOut={() => animate(1)}
        onPress={onPress}
        disabled={disabled}
      >
        <Animated.View style={[style, { transform: [{ scale }] }]}>
          {children}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  };

  const styles = getStyles();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
          <View style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
            <Text style={styles.backButtonText}>Back</Text>
          </View>
        </TouchableWithoutFeedback>
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
          <TouchableWithoutFeedback onPress={handlePrivatePress}>
            <View style={styles.privateKeyRow}>
              <Text style={styles.keyBox}>
                {showPrivate ? privateKey : maskPrivateKey(privateKey)}
              </Text>
            </View>
          </TouchableWithoutFeedback>

          <View style={styles.buttonWrapper}>
            {actionLoading ? (
              <View style={[styles.button, styles.neutralButton]}>
                <Text style={styles.buttonTextDefault}>Changing...</Text>
              </View>
            ) : changeSuccess ? (
              <ButtonWithScale
                onPress={() => {}}
                style={[styles.button, styles.blueOutline]}
              >
                <Text style={styles.blueText}>Successful</Text>
              </ButtonWithScale>
            ) : (
              <ButtonWithScale
                onPress={handleChangeKey}
                style={[styles.button, styles.neutralButton]}
              >
                <Text style={styles.buttonTextDefault}>Change Key Pair</Text>
              </ButtonWithScale>
            )}

            <ButtonWithScale
              onPress={handleValidateKeys}
              style={[
                styles.button,
                keysValid ? styles.greenOutline : styles.neutralButton,
              ]}
            >
              <Text
                style={keysValid ? styles.greenText : styles.buttonTextDefault}
              >
                {keysValid ? "Valid Keys" : "Validate Keys"}
              </Text>
            </ButtonWithScale>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F2F2F2",
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      height: 40,
      paddingHorizontal: 16,
      backgroundColor: "#F2F2F2",
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
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitleText: {
      fontSize: 20,
      fontWeight: "600",
      color: "#333333",
    },
    contentContainer: {
      marginTop: 40,
      paddingHorizontal: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
      color: "#333",
    },
    keyBox: {
      fontSize: 15,
      backgroundColor: "#fff",
      padding: 12,
      borderRadius: 8,
      marginBottom: 24,
      fontFamily: "monospace",
      color: "#333",
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
      borderColor: "#999999",
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
      color: "#666666",
    },
  });
