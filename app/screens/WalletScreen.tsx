import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";

export default function Wallet() {
  // Dummy data
  const walletAddress = "0x1234...abcd";
  const balance = "1.2345 ETH";

  const handleSendTransaction = () => {
    // Replace with your transaction logic
    console.log("Send transaction button pressed!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Wallet</Text>
      <Text style={styles.label}>Address: {walletAddress}</Text>
      <Text style={styles.label}>Balance: {balance}</Text>

      <Button title="Send Transaction" onPress={handleSendTransaction} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#FFF",
  },
  heading: {
    fontSize: 20,
    marginBottom: 8,
    fontWeight: "600",
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
});
