import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";

export default function Wallet() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <Text style={styles.comingSoon}>Coming Soon...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  comingSoon: {
    fontSize: 24,
    fontWeight: "bold",
  },
});