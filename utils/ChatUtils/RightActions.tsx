import React from 'react';
import { TouchableOpacity, Image, Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, SharedValue } from 'react-native-reanimated';

/**
 * Interface for the props accepted by the RightActions component.
 * It now correctly includes the 'styles' property.
 */
interface RightActionsProps {
  progress: SharedValue<number>;
  onAction: (action: string) => void;
  isPinned: boolean;
  /**
   * We expect a 'styles' object containing the specific styles
   * needed for this component, which are passed down from ChatItem.
   */
  styles: {
    rightActions: ViewStyle;
    actionButton: ViewStyle;
    actionText: TextStyle;
  };
}

const RightActions = ({ progress, onAction, isPinned, styles }: RightActionsProps) => {
  // This animated style will slide the actions into view.
  const animatedStyle = useAnimatedStyle(() => {
    const animatedTranslateX = interpolate(
      progress.value,
      [0, 1], // Input range
      [100, 0], // Output range
      { extrapolateRight: "clamp" }
    );
    return { transform: [{ translateX: animatedTranslateX }] };
  });

  return (
    <Animated.View style={[styles.rightActions, animatedStyle]}>
      {/* Mute Action */}
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: "#F09A37" }]}
        onPress={() => onAction("Mute")}
      >
        <Image
          source={require("../../assets/images/mute.png")}
          style={{ width: 30, height: 30, resizeMode: "contain" }}
        />
        <Text style={styles.actionText}>Mute</Text>
      </TouchableOpacity>

      {/* Pin/Unpin Action */}
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: isPinned ? "#999" : "#1EBE1E" }]}
        onPress={() => onAction("Pin")}
      >
        <Image
          source={require("../../assets/images/pin.png")}
          style={{ width: 30, height: 30, resizeMode: "contain" }}
        />
        <Text style={styles.actionText}>{isPinned ? "Unpin" : "Pin"}</Text>
      </TouchableOpacity>

      {/* Delete Action */}
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: "#FE3B30" }]}
        onPress={() => onAction("Delete")}
      >
        <Image
          source={require("../../assets/images/delete.png")}
          style={{ width: 30, height: 30, resizeMode: "contain" }}
        />
        <Text style={styles.actionText}>Delete</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default RightActions;