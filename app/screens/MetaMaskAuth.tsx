import React, { useState, useEffect } from "react";
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator } from "react-native";
import WalletConnect from "@walletconnect/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";

// Define navigation prop
type NavigationProp = StackNavigationProp<RootStackParamList, "Home">;

export default function MetaMaskAuth() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connector, setConnector] = useState<WalletConnect | null>(null);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    initializeWalletConnect();
  }, []);

  // Initialize WalletConnect
  const initializeWalletConnect = async () => {
    setLoading(true);
    try {
      const storedSession = await AsyncStorage.getItem("walletConnectSession");
      const parsedSession = storedSession ? JSON.parse(storedSession) : null;

      const wcConnector = new WalletConnect({
        bridge: "https://bridge.walletconnect.org",
        session: parsedSession,
      });

      // Event Listeners
      wcConnector.on("connect", async (error, payload) => {
        if (error) throw error;
        const { accounts } = payload.params[0];
        const wallet = accounts[0];
        await AsyncStorage.setItem("walletAddress", wallet);
        await AsyncStorage.setItem("walletConnectSession", JSON.stringify(wcConnector.session));
        setWalletAddress(wallet);
        setLoading(false);
        Alert.alert("Connected", `Wallet Address: ${wallet}`);
        navigation.replace("Home");
      });

      wcConnector.on("disconnect", async () => {
        await AsyncStorage.removeItem("walletAddress");
        await AsyncStorage.removeItem("walletConnectSession");
        setWalletAddress(null);
      });

      if (wcConnector.connected) {
        setWalletAddress(wcConnector.accounts[0]);
        navigation.replace("Home");
      }

      setConnector(wcConnector);
    } catch (error) {
      console.error("WalletConnect initialization error:", error);
    }
    setLoading(false);
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!connector) {
      Alert.alert("Error", "WalletConnect is not initialized.");
      return;
    }

    setLoading(true);
    try {
      await connector.createSession();
    } catch (error) {
      console.error("Wallet connection error:", error);
      Alert.alert("Error", "Failed to connect to MetaMask.");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MetaMask Authentication</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#ff8c00" />
      ) : walletAddress ? (
        <Text style={styles.address}>Connected: {walletAddress}</Text>
      ) : (
        <Button title="Connect with MetaMask" onPress={connectWallet} color="#ff8c00" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  address: {
    fontSize: 16,
    color: "#fff",
    marginTop: 10,
  },
});
