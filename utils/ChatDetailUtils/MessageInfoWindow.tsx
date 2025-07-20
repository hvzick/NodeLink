import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Message } from "../../backend/Local database/SQLite/MessageStructure";
import { formatTimeForUser } from "../GlobalUtils/FormatDate";

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

const MessageInfoWindow: React.FC<MessageInfoWindowProps> = ({
  message,
  onClose,
  initialPosition,
}) => {
  const { width, height } = Dimensions.get("window");

  // Fixed center position
  const windowWidth = 320;
  const windowHeight = Math.min(height * 0.8, 500); // Max 80% of screen height or 500px
  const centerPosition = React.useMemo(
    () => ({
      x: Math.round((width - windowWidth) / 2),
      y: Math.round((height - windowHeight) / 2),
    }),
    [width, height, windowWidth, windowHeight]
  );

  // Use fixed center position instead of draggable
  const infoWindowPosition = useRef<Animated.ValueXY | null>(null);
  if (!infoWindowPosition.current) {
    infoWindowPosition.current = new Animated.ValueXY(centerPosition);
  }

  useEffect(() => {
    if (message) {
      infoWindowPosition.current?.setValue(centerPosition);
    }
  }, [message, centerPosition]);

  // Remove pan responder since we want fixed positioning
  const infoWindowPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // Disable dragging
      onPanResponderMove: () => {},
      onPanResponderRelease: () => {},
    })
  ).current;

  if (!message) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Blurred or dark overlay to close on outside press */}
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
          <Text style={styles.infoTitle}>Message Info</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={22} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Scrollable content area */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          <View style={styles.infoContent}>
            {Object.entries(message).map(([key, value]) => {
              // Skip null, undefined, or empty values
              if (value === null || value === undefined || value === "") {
                return null;
              }

              // Special handling for createdAt
              if (key === "createdAt") {
                if (typeof value === "number" || value instanceof Date) {
                  const dateObj =
                    value instanceof Date ? value : new Date(value);
                  return (
                    <React.Fragment key={key}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Sent Date:</Text>
                        <Text selectable style={styles.infoValue}>
                          {dateObj.toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Sent Time:</Text>
                        <Text selectable style={styles.infoValue}>
                          {formatTimeForUser(value)}
                        </Text>
                      </View>
                    </React.Fragment>
                  );
                }
                return null;
              }

              // Special handling for receivedAt
              if (key === "receivedAt") {
                if (typeof value === "number") {
                  const dateObj = new Date(value);
                  return (
                    <React.Fragment key={key}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Received Date:</Text>
                        <Text selectable style={styles.infoValue}>
                          {dateObj.toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Received Time:</Text>
                        <Text selectable style={styles.infoValue}>
                          {formatTimeForUser(value)}
                        </Text>
                      </View>
                    </React.Fragment>
                  );
                }
                return null;
              }

              // Special handling for readAt
              if (key === "readAt" && typeof value === "number") {
                const dateObj = new Date(value);
                return (
                  <React.Fragment key={key}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Read Date:</Text>
                      <Text selectable style={styles.infoValue}>
                        {dateObj.toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Read Time:</Text>
                      <Text selectable style={styles.infoValue}>
                        {formatTimeForUser(value)}
                      </Text>
                    </View>
                  </React.Fragment>
                );
              }

              // Format key names for better readability
              const formatKey = (key: string) => {
                return key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase());
              };

              return (
                <View key={key} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{formatKey(key)}:</Text>
                  <Text selectable style={styles.infoValue}>
                    {typeof value === "object"
                      ? JSON.stringify(value, null, 2)
                      : String(value)}
                  </Text>
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
});

export default MessageInfoWindow;
