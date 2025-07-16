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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Message } from "../../backend/Local database/MessageStructure";
import { formatTimeForUser } from "../GlobalUtils/FormatDate";

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
  // Center the window by default
  const defaultPosition = React.useMemo(
    () => initialPosition || { x: width / 2 - 160, y: height / 2 - 120 },
    [initialPosition, width, height]
  );

  const infoWindowPosition = useRef(
    new Animated.ValueXY(defaultPosition)
  ).current;

  const infoWindowPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dx: infoWindowPosition.x, dy: infoWindowPosition.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {},
    })
  ).current;

  useEffect(() => {
    if (message) {
      infoWindowPosition.setValue(defaultPosition);
    }
  }, [message, defaultPosition, infoWindowPosition]);

  if (!message) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay to close on outside press */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          styles.infoWindow,
          { transform: infoWindowPosition.getTranslateTransform() },
        ]}
        {...infoWindowPanResponder.panHandlers}
      >
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>Message Info</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={22} color="#888" />
          </TouchableOpacity>
        </View>
        <View style={styles.infoContent}>
          {Object.entries(message).map(([key, value]) => {
            if (value === null || value === undefined || value === "")
              return null;
            if (key === "createdAt") {
              if (typeof value === "number" || value instanceof Date) {
                const dateObj = value instanceof Date ? value : new Date(value);
                return (
                  <React.Fragment key={key}>
                    <Text selectable style={styles.infoLabel}>
                      Sent Date:{" "}
                      <Text style={styles.infoValue}>
                        {dateObj.toLocaleDateString()}
                      </Text>
                    </Text>
                    <Text selectable style={styles.infoLabel}>
                      Sent Time:{" "}
                      <Text style={styles.infoValue}>
                        {formatTimeForUser(value)}
                      </Text>
                    </Text>
                  </React.Fragment>
                );
              }
              return null;
            }
            return (
              <Text key={key} selectable style={styles.infoLabel}>
                {key}:{" "}
                <Text style={styles.infoValue}>
                  {typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
                </Text>
              </Text>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
    zIndex: 9,
  },
  infoWindow: {
    position: "absolute",
    width: 320,
    minHeight: 180,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  infoTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#222",
  },
  infoContent: {
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: "#444",
    marginBottom: 2,
  },
  infoValue: {
    color: "#000",
    fontWeight: "500",
  },
});

export default MessageInfoWindow;
