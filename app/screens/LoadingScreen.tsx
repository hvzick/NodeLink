// screens/LoadingScreen.tsx
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, useColorScheme } from "react-native";
import SvgLogoDark from "../../assets/images/logo-white.svg";
import SvgLogoLight from "../../assets/images/logo-black.svg";

export default function LoadingScreen() {
  const logoScaleAnim = useRef(new Animated.Value(1)).current;
  const colorScheme = useColorScheme();
  const LogoComponent = colorScheme === "dark" ? SvgLogoDark : SvgLogoLight;

  useEffect(() => {
    Animated.timing(logoScaleAnim, {
      toValue: 1.3,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [logoScaleAnim]);

  return (
    <View
      style={[
        styles.container,
        colorScheme === "dark" ? darkStyles.container : lightStyles.container,
      ]}
    >
      <Animated.View style={{ transform: [{ scale: logoScaleAnim }] }}>
        <LogoComponent width={200} height={200} />
      </Animated.View>
      <Text
        style={[
          styles.staticText,
          colorScheme === "dark" ? darkStyles.text : lightStyles.text,
        ]}
      >
        Node Link
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  staticText: {
    position: "absolute",
    bottom: 70,
    fontSize: 25,
    fontWeight: "bold",
    fontFamily: "MontserratAlternates-Regular",
  },
});

const lightStyles = StyleSheet.create({
  container: { backgroundColor: "#fff" },
  text: { color: "black" },
});

const darkStyles = StyleSheet.create({
  container: { backgroundColor: "#121212" },
  text: { color: "white" },
});
