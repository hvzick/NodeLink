import React from "react";
import { Animated, PanResponder } from "react-native";

const distanceThreshold = 20; // px - quote after this much right-drag
const maxTranslate = 80; // px - allow drag up to 80px
const animationKick = 32; // px - feedback bounce

export default function SwipeToQuoteWrapper({
  message,
  onQuote,
  children,
  style,
  onSwipeStart,
  onSwipeEnd,
}) {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const [swiping, setSwiping] = React.useState(false);
  const hasQuoted = React.useRef(false);

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 4 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        setSwiping(true);
        hasQuoted.current = false;
        onSwipeStart?.();
      },
      onPanResponderMove: (_e, g) => {
        const travel = Math.max(0, Math.min(g.dx, maxTranslate));
        translateX.setValue(travel);
        if (!hasQuoted.current && travel >= distanceThreshold) {
          hasQuoted.current = true;
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: animationKick,
              duration: 90,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: 170,
              useNativeDriver: true,
            }),
          ]).start();
          onQuote?.(message);
        }
      },
      onPanResponderRelease: () => {
        setSwiping(false);
        onSwipeEnd?.();
        Animated.timing(translateX, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        setSwiping(false);
        onSwipeEnd?.();
        Animated.timing(translateX, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateX }],
          elevation: swiping ? 2 : 0,
          shadowOpacity: swiping ? 0.08 : 0,
        },
        style,
      ]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
}
