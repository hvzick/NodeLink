import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";

type NavigationProp = StackNavigationProp<RootStackParamList, "Home">;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load wallet address when screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadWalletAddress = async () => {
        setLoading(true);
        const address = await AsyncStorage.getItem("walletAddress");
        setWalletAddress(address);
        setLoading(false);
      };
      loadWalletAddress();
    }, [])
  );

  // Logout function - Clear session & navigate to Auth
  const disconnectWallet = async () => {
    await AsyncStorage.removeItem("walletAddress"); // Clear stored wallet
    await AsyncStorage.removeItem("walletconnect"); // Clear WalletConnect session
    setWalletAddress(null);
    navigation.replace("Auth"); // Redirect to Auth screen (ensuring logout)
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Node Link!</Text>
      <Text style={styles.address}>Wallet Connected</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0FA958" style={styles.loadingIndicator} />
      ) : (
        <Text style={styles.wallet}>{walletAddress || "No wallet connected"}</Text>
      )}
      

      {/* Logout Button */}
      <TouchableOpacity style={styles.button} onPress={disconnectWallet}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  address: {
    fontSize: 18,
    color: "#ccc",
  },
  wallet: {
    fontSize: 16,
    color: "#0FA958",
    marginVertical: 10,
    textAlign: "center",
  },
  loadingIndicator: {
    marginVertical: 10,
  },
  backButton: {
    marginTop: 10,
    backgroundColor: "#0277BD",
    padding: 12,
    borderRadius: 8,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#E53935",
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
