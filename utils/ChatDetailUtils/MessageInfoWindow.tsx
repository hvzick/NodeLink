/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect, useState, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
  TouchableOpacity,
  TextStyle,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Message } from "../../backend/Local database/SQLite/MessageStructure";

// Try to use expo-blur for a blurred background
let BlurView: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  BlurView = require("expo-blur").BlurView;
} catch {}

interface MessageInfoWindowProps {
  message: Message | null;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
}

// Properly typed interface for SelectableText props
interface SelectableTextProps {
  children: ReactNode;
  style?: TextStyle | TextStyle[];
  isLabel?: boolean;
}

const MessageInfoWindow: React.FC<MessageInfoWindowProps> = ({
  message,
  onClose,
  initialPosition,
}) => {
  const { width, height } = Dimensions.get("window");
  const windowWidth = 320;
  const windowHeight = Math.min(height * 0.8, 500);

  const centerPosition = React.useMemo(
    () => ({
      x: Math.round((width - windowWidth) / 2),
      y: Math.round((height - windowHeight) / 2),
    }),
    [width, height]
  );

  const infoWindowPosition = useRef<Animated.ValueXY | null>(null);
  if (!infoWindowPosition.current) {
    infoWindowPosition.current = new Animated.ValueXY(centerPosition);
  }
  useEffect(() => {
    if (message) {
      infoWindowPosition.current?.setValue(centerPosition);
    }
  }, [message, centerPosition]);

  const infoWindowPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onPanResponderMove: () => {},
      onPanResponderRelease: () => {},
    })
  ).current;

  if (!message) return null;

  const formatDateWithDay = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFullTime = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleTimeString(undefined, {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Only the text color turns blue on hold – no background change
  const SelectableText: React.FC<SelectableTextProps> = ({
    children,
    style,
    isLabel = false,
  }) => {
    const [held, setHeld] = useState(false);

    return (
      <Pressable
        onPressIn={() => setHeld(true)}
        onPressOut={() => setHeld(false)}
        style={({ pressed }) => null}
      >
        <Text
          selectable
          style={[
            style,
            styles.selectableText,
            held ? { color: "#007AFF" } : null,
          ]}
          selectionColor="#007AFF"
        >
          {children}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {BlurView ? (
        <BlurView intensity={40} style={styles.overlay} tint="light">
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </BlurView>
      ) : (
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}
      <Animated.View
        style={[
          styles.infoWindow,
          {
            width: windowWidth,
            height: windowHeight,
            transform: infoWindowPosition.current!.getTranslateTransform(),
          },
        ]}
        {...infoWindowPanResponder.panHandlers}
      >
        <View style={styles.infoHeader}>
          <SelectableText style={styles.infoTitle}>Message Info</SelectableText>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={22} color="#888" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
          bounces
        >
          <View style={styles.infoContent}>
            {/* CreatedAt / ReceivedAt */}
            {message.createdAt != null && (
              <View style={styles.infoRow}>
                <SelectableText style={styles.infoLabel} isLabel>
                  Sent:
                </SelectableText>
                <SelectableText style={styles.infoValue}>
                  {formatDateWithDay(message.createdAt)}
                </SelectableText>
                <SelectableText style={styles.infoValue}>
                  {formatFullTime(message.createdAt)}
                </SelectableText>
              </View>
            )}
            {message.receivedAt != null && (
              <View style={styles.infoRow}>
                <SelectableText style={styles.infoLabel} isLabel>
                  Received:
                </SelectableText>
                <SelectableText style={styles.infoValue}>
                  {formatDateWithDay(message.receivedAt)}
                </SelectableText>
                <SelectableText style={styles.infoValue}>
                  {formatFullTime(message.receivedAt)}
                </SelectableText>
              </View>
            )}
            {message.readAt != null && (
              <View style={styles.infoRow}>
                <SelectableText style={styles.infoLabel} isLabel>
                  Read:
                </SelectableText>
                <SelectableText style={styles.infoValue}>
                  {formatDateWithDay(message.readAt)}
                </SelectableText>
                <SelectableText style={styles.infoValue}>
                  {formatFullTime(message.readAt)}
                </SelectableText>
              </View>
            )}

            {/* Other Fields - signature timestamp will show as raw value */}
            {Object.entries(message).map(([key, value]) => {
              if (
                value == null ||
                key === "createdAt" ||
                key === "receivedAt" ||
                key === "readAt" ||
                value === ""
              ) {
                return null;
              }
              const formatKey = (k: string) =>
                k
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (s) => s.toUpperCase());
              return (
                <View key={key} style={styles.infoRow}>
                  <SelectableText style={styles.infoLabel} isLabel>
                    {formatKey(key)}:
                  </SelectableText>
                  <SelectableText style={styles.infoValue}>
                    {typeof value === "object"
                      ? JSON.stringify(value, null, 2)
                      : String(value)}
                  </SelectableText>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 9,
  },
  infoWindow: {
    position: "absolute",
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  infoTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#222",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  infoContent: {
    padding: 16,
  },
  infoRow: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "400",
    lineHeight: 18,
  },
  selectableText: {
    backgroundColor: "transparent",
    borderRadius: 2,
    padding: 1,
  },
});

export default MessageInfoWindow;
