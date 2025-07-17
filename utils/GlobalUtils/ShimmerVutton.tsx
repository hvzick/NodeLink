import React, { ReactNode, useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

type RotatingShimmerButtonProps = {
  children: ReactNode;
  style?: any;
};

const RotatingShimmerButton = ({
  children,
  style,
}: RotatingShimmerButtonProps) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    };
    startAnimation();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[styles.shimmerOverlay, { transform: [{ rotate }] }]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#222222",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  shimmerOverlay: {
    position: "absolute",
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    backgroundColor: "transparent",
    borderWidth: 30,
    borderColor: "transparent",
    borderTopColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 100,
  },
  content: {
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default RotatingShimmerButton;
