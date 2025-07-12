// utils/ChatUtils/RightActions.tsx
import React from 'react';
import { TouchableOpacity, Image, Text, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, SharedValue } from 'react-native-reanimated';

/**
 * Defines the possible actions that can be performed from the swipe menu.
 * Using a specific type instead of a generic 'string' improves code safety.
 */
export type SwipeAction = 'Mute' | 'Pin' | 'Delete';

/**
 * Interface for the props accepted by the RightActions component.
 */
interface RightActionsProps {
  progress: SharedValue<number>;
  onAction: (action: SwipeAction) => void;
  isPinned: boolean;
  styles: {
    rightActions: ViewStyle;
    actionButton: ViewStyle;
    actionText: TextStyle;
  };
}

const RightActions = ({ progress, onAction, isPinned, styles }: RightActionsProps) => {
  // This animated style will slide the actions into view as the user swipes.
  const animatedStyle = useAnimatedStyle(() => {
    // The interpolation maps the swipe progress (0 to 1) to a translation value.
    // The output range should correspond to the total width of the action buttons.
    const animatedTranslateX = interpolate(
      progress.value,
      [0, 1], // Input range (from no swipe to full swipe)
      [100, 0], // Output range (from off-screen to on-screen)
      { extrapolateRight: "clamp" } // Prevents swiping beyond the buttons
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
