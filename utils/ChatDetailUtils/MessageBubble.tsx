// utils/ChatDetailUtils/MessageBubble.tsx

import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { triggerTapHapticFeedback } from "../GlobalUtils/TapHapticFeedback";
import { Message } from "../../backend/Local database/SQLite/MessageStructure";
import { useThemeToggle } from "../GlobalUtils/ThemeProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatTimeForUser } from "../GlobalUtils/FormatDate";

export type MessageBubbleProps = {
  message: Message;
  repliedMessages?: Record<string, Message>;
  chatRecipientName: string;
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
    repliedMessages,
    chatRecipientName,
    onImagePress,
    onVideoPress,
    onQuotedPress,
    onLongPress,
    isHidden = false,
    highlighted = false,
    isMenuVisibleForThisMessage = false,
  }) => {
    const { currentTheme } = useThemeToggle();
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [formattedTime, setFormattedTime] = useState("");
    const [bubbleWidth, setBubbleWidth] = useState(0);
    const bubbleRef = useRef<View>(null);

    useEffect(() => {
      AsyncStorage.getItem("walletAddress").then(setWalletAddress);
    }, []);

    useEffect(() => {
      const tv =
        message.createdAt ||
        (message.timestamp ? parseInt(message.timestamp, 10) : Date.now());
      formatTimeForUser(tv).then(setFormattedTime);
    }, [message.createdAt, message.timestamp]);

    const isMe =
      !!walletAddress &&
      message.sender?.toLowerCase() === walletAddress.toLowerCase();

    const styles = getStyles(currentTheme, isMe);
    const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

    const handleLongPress = () => {
      triggerTapHapticFeedback();
      bubbleRef.current?.measureInWindow(
        (x: any, y: any, width: any, height: any) => {
          onLongPress(message, { x, y, width, height });
        }
      );
    };

    // No animation effect needed

    if (isHidden) {
      return <View style={{ height: measuredHeight || 50 }} />;
    }

    // Quoted message lookup
    const quotedMsg =
      typeof message.replyTo === "string"
        ? repliedMessages?.[message.replyTo]
        : undefined;

    // Only uses chatRecipientName as the display name (for 1-to-1 chats)
    const getReplyName = (sender: string) => {
      if (!walletAddress || !sender) return sender;
      return sender.toLowerCase() === walletAddress.toLowerCase()
        ? "You"
        : chatRecipientName;
    };

    return (
      <View onLayout={(e) => setMeasuredHeight(e.nativeEvent.layout.height)}>
        <View>
          <View
            ref={bubbleRef}
            onLayout={(e) => setBubbleWidth(e.nativeEvent.layout.width)}
            style={[
              styles.bubbleContainer,
              isMe ? styles.bubbleRight : styles.bubbleLeft,
              highlighted &&
                (isMe ? styles.highlightedRight : styles.highlightedLeft),
            ]}
          >
            {/* Reply preview (if quotedMsg found in map) */}
            {message.replyTo && (
              <Pressable
                onPress={quotedMsg ? () => onQuotedPress(quotedMsg) : undefined}
                style={styles.contentWrapper}
                disabled={!quotedMsg}
              >
                <View
                  style={[
                    styles.replyPreview,
                    isMe ? styles.replyPreviewRight : styles.replyPreviewLeft,
                  ]}
                >
                  {quotedMsg ? (
                    <>
                      <Text
                        style={[
                          styles.replyLabel,
                          isMe ? styles.replyLabelRight : styles.replyLabelLeft,
                        ]}
                      >
                        Replying to {getReplyName(quotedMsg.sender)}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.replyText,
                          isMe ? styles.replyTextRight : styles.replyTextLeft,
                        ]}
                      >
                        {quotedMsg.text ||
                          (quotedMsg.imageUrl
                            ? "Image"
                            : quotedMsg.videoUrl
                            ? "Video"
                            : "[No Preview]")}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.replyLabel,
                          isMe ? styles.replyLabelRight : styles.replyLabelLeft,
                        ]}
                      >
                        Replied to {chatRecipientName}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.replyText,
                          isMe ? styles.replyTextRight : styles.replyTextLeft,
                        ]}
                      >
                        Deleted Message
                      </Text>
                    </>
                  )}
                </View>
              </Pressable>
            )}

            {/* Image */}
            {message.imageUrl && (
              <Pressable
                onPress={() => onImagePress(message.imageUrl!)}
                onLongPress={handleLongPress}
                delayLongPress={300}
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

            {/* Video */}
            {message.videoUrl && (
              <Pressable
                onPress={() => onVideoPress(message.videoUrl!)}
                onLongPress={handleLongPress}
                delayLongPress={300}
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

            {/* Text */}
            {message.text && (
              <Pressable
                onLongPress={handleLongPress}
                delayLongPress={300}
                style={styles.contentWrapper}
              >
                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.messageTextCommon,
                      isMe ? styles.messageTextRight : styles.messageTextLeft,
                    ]}
                  >
                    {message.text}
                  </Text>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeTextInside}>{formattedTime}</Text>
                  </View>
                </View>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }
);

const getStyles = (theme: "light" | "dark", isMe: boolean) =>
  StyleSheet.create({
    bubbleContainer: {
      maxWidth: "80%",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 18,
    },
    bubbleLeft: {
      alignSelf: "flex-start",
      backgroundColor: theme === "dark" ? "#3A3A3C" : "#E5E5EA",
      borderTopLeftRadius: 0,
    },
    bubbleRight: {
      alignSelf: "flex-end",
      backgroundColor: theme === "dark" ? "#0A84FF" : "#0A84FF",
      borderBottomRightRadius: 0,
    },
    messageTextCommon: {
      fontSize: 17,
      lineHeight: 22,
      paddingLeft: 5,
      paddingRight: 50,
    },
    messageTextLeft: {
      color: theme === "dark" ? "#FFFFFF" : "#000000",
    },
    messageTextRight: {
      color: "#FFFFFF",
    },
    textContainer: {
      position: "relative",
      paddingBottom: 5,
    },
    timeContainer: {
      position: "absolute",
      bottom: 0,
      right: 0,
    },
    timeTextInside: {
      fontSize: 11,
      color: theme === "dark" ? "#FFFFFF" : "#000000",
      opacity: 0.7,
    },
    mediaContainer: { position: "relative" },
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
    timeOverlay: {
      position: "absolute",
      right: 8,
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: 6,
      borderRadius: 10,
    },
    timeTextOverlay: { fontSize: 11, color: "#FFFFFF", fontWeight: "500" },

    // Base reply preview styles
    replyPreview: {
      borderRadius: 8,
      padding: 8,
      marginBottom: 5,
      borderLeftWidth: 3,
    },

    // Reply preview for received messages (left side)
    replyPreviewLeft: {
      backgroundColor:
        theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
      borderLeftColor: theme === "dark" ? "#FFFFFF" : "#666666",
    },

    // Reply preview for sent messages (right side)
    replyPreviewRight: {
      backgroundColor: "rgba(255,255,255,0.2)",
      borderLeftColor: "#FFFFFF",
    },

    // Reply label styles
    replyLabel: {
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 2,
    },
    replyLabelLeft: {
      color: theme === "dark" ? "#FFFFFF" : "#666666",
    },
    replyLabelRight: {
      color: "#FFFFFF",
    },

    // Reply text styles
    replyText: {
      fontSize: 14,
    },
    replyTextLeft: {
      color: theme === "dark" ? "#CCCCCC" : "#888888",
    },
    replyTextRight: {
      color: "rgba(255,255,255,0.9)",
    },

    // Highlight styles for your own messages (right side)
    highlightedRight: {
      borderWidth: 2,
      borderColor: theme === "dark" ? "#FFFFFF" : "#000000",
      backgroundColor: theme === "dark" ? "#1A5FFF" : "#0066CC", // Darker blue for your messages
      shadowColor: "#FFFFFF",
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },

    // Highlight styles for receiver's messages (left side)
    highlightedLeft: {
      borderWidth: 2,
      borderColor: theme === "dark" ? "#0A84FF" : "#007AFF",
      backgroundColor:
        theme === "dark"
          ? "rgba(58, 58, 60, 0.8)" // Slightly lighter than normal for dark theme
          : "rgba(229, 229, 234, 0.8)", // Slightly darker than normal for light theme
      shadowColor: theme === "dark" ? "#0A84FF" : "#007AFF",
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },

    contentWrapper: {},
  });

export default MessageBubble;
