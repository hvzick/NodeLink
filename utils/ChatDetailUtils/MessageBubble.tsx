import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Pressable,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { triggerTapHapticFeedback } from "../GlobalUtils/TapHapticFeedback";
import { Message } from "../../backend/Local database/MessageStructure";
import { useThemeToggle } from "../GlobalUtils/ThemeProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatTimeForUser } from "../GlobalUtils/FormatDate";

export type MessageBubbleProps = {
  message: Message;
  onImagePress: (uri: string) => void;
  onVideoPress: (uri: string) => void;
  onQuotedPress: (quoted: Message) => void;
  onLongPress: (
    message: Message,
    layout: { x: number; y: number; width: number; height: number }
  ) => void;
  isHidden?: boolean;
  highlighted?: boolean;
  isMenuVisibleForThisMessage?: boolean;
};

const MessageBubble: React.FC<MessageBubbleProps> = React.memo(
  ({
    message,
    onImagePress,
    onVideoPress,
    onQuotedPress,
    onLongPress,
    isHidden = false,
    highlighted = false,
    isMenuVisibleForThisMessage = false,
  }) => {
    const { currentTheme } = useThemeToggle();
    const styles = getStyles(currentTheme);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [formattedTime, setFormattedTime] = useState("");

    const bubbleRef = useRef<View>(null);
    useEffect(() => {
      AsyncStorage.getItem("walletAddress").then(setWalletAddress);
    }, []);

    useEffect(() => {
      let timeValue =
        message.createdAt ||
        (message.timestamp ? parseInt(message.timestamp, 10) : Date.now());
      formatTimeForUser(timeValue).then(setFormattedTime);
    }, [message.createdAt, message.timestamp]);

    const isMe =
      walletAddress &&
      message.sender?.toLowerCase() === walletAddress.toLowerCase();

    useEffect(() => {
      AsyncStorage.getItem("walletAddress").then((value) => {
        setWalletAddress(value);
      });
    }, []);

    const scale = useRef(new Animated.Value(1)).current;
    const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

    const handleLongPress = () => {
      triggerTapHapticFeedback();
      Animated.timing(scale, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        bubbleRef.current?.measureInWindow((x, y, width, height) => {
          onLongPress(message, { x, y, width, height });
        });
      });
    };

    useEffect(() => {
      if (!isMenuVisibleForThisMessage) {
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }, [isMenuVisibleForThisMessage, scale]);

    if (isHidden) {
      return <View style={{ height: measuredHeight || 50 }} />;
    }

    return (
      <View
        onLayout={(event) => setMeasuredHeight(event.nativeEvent.layout.height)}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <View
            ref={bubbleRef}
            style={[
              styles.bubbleContainer,
              isMe ? styles.bubbleRight : styles.bubbleLeft,
              highlighted && styles.highlighted,
            ]}
          >
            {message.replyTo && typeof message.replyTo === "object" && (
              <Pressable
                onPress={() => onQuotedPress(message.replyTo!)}
                style={styles.contentWrapper}
              >
                <View style={styles.replyPreview}>
                  <Text
                    style={styles.replyLabel}
                  >{`Replying to ${message.replyTo.sender}`}</Text>
                  <Text numberOfLines={1} style={styles.replyText}>
                    {message.replyTo.text ||
                      (message.replyTo.imageUrl ? "Image" : "Video")}
                  </Text>
                </View>
              </Pressable>
            )}

            {message.imageUrl && (
              <Pressable
                onPress={() => onImagePress(message.imageUrl!)}
                onLongPress={handleLongPress}
                delayLongPress={300}
                style={styles.contentWrapper}
              >
                <View style={styles.mediaContainer}>
                  <Image
                    source={{ uri: message.imageUrl }}
                    style={styles.chatImage}
                  />
                  <View style={styles.timeOverlay}>
                    <Text style={styles.timeTextOverlay}>{formattedTime}</Text>
                  </View>
                </View>
              </Pressable>
            )}

            {message.videoUrl && (
              <Pressable
                onPress={() => onVideoPress(message.videoUrl!)}
                onLongPress={handleLongPress}
                delayLongPress={300}
                style={styles.contentWrapper}
              >
                <View style={styles.mediaContainer}>
                  <Video
                    source={{ uri: message.videoUrl }}
                    style={styles.chatVideo}
                    useNativeControls={false}
                    resizeMode={ResizeMode.COVER}
                  />
                  <View style={styles.timeOverlay}>
                    <Text style={styles.timeTextOverlay}>{formattedTime}</Text>
                  </View>
                </View>
              </Pressable>
            )}

            {message.text && (
              <Pressable
                onLongPress={handleLongPress}
                delayLongPress={300}
                style={styles.contentWrapper}
              >
                <View style={styles.textContainer}>
                  <Text style={styles.messageText}>{message.text}</Text>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeTextInside}>{formattedTime}</Text>
                  </View>
                </View>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    );
  }
);

const getStyles = (theme: "light" | "dark") =>
  StyleSheet.create({
    bubbleContainer: {
      maxWidth: "80%",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
      overflow: "hidden",
    },
    bubbleLeft: {
      alignSelf: "flex-start",
      backgroundColor: theme === "dark" ? "#262626" : "#E5E5EA",
      borderTopLeftRadius: 10,
    },
    bubbleRight: {
      alignSelf: "flex-end",
      backgroundColor: theme === "dark" ? "#005C4B" : "#DCF8C6",
      borderTopRightRadius: 10,
    },
    highlighted: {
      backgroundColor: theme === "dark" ? "#5A4A02" : "#FFF3B2",
    },
    replyPreview: {
      backgroundColor:
        theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: "#007AFF",
      padding: 8,
      marginBottom: 5,
    },
    replyLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: "#007AFF",
      marginBottom: 2,
    },
    replyText: { fontSize: 14, color: theme === "dark" ? "#B0B0B0" : "#555" },

    // New styles for media containers
    mediaContainer: {
      position: "relative",
    },
    chatImage: {
      width: 220,
      height: 180,
      resizeMode: "cover",
      borderRadius: 12,
    },
    chatVideo: {
      width: 220,
      height: 150,
      borderRadius: 12,
      backgroundColor: theme === "dark" ? "#000" : "#F0F0F0",
    },

    // New styles for text with time
    textContainer: {
      position: "relative",
      paddingBottom: 8, // Make space for time
    },
    messageText: {
      fontSize: 17,
      lineHeight: 22,
      color: theme === "dark" ? "#FFFFFF" : "#000000",
      paddingRight: 40, // Make space for time on the right
      paddingLeft: 5,
    },

    // Time overlay for media (images/videos)
    timeOverlay: {
      position: "absolute",
      right: 8,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      paddingHorizontal: 6,
      borderRadius: 10,
    },
    timeTextOverlay: {
      fontSize: 11,
      color: "#FFFFFF",
      fontWeight: "500",
    },

    // Time container for text messages
    timeContainer: {
      position: "absolute",
      bottom: 0,
      right: 0,
    },
    timeTextInside: {
      fontSize: 11,
      color: theme === "dark" ? "#8E8E93" : "#6D6D72",
      opacity: 0.7,
    },

    contentWrapper: {},
  });

export default MessageBubble;
