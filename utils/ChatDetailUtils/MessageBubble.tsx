// MessageBubble.tsx
import React, { useRef, useState, useEffect } from 'react'; // Import useEffect
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  Pressable, // Already using Pressable
} from 'react-native';
import { Video } from 'expo-av';
import { triggerTapHapticFeedback } from '../GlobalUtils/TapHapticFeedback';
import { Message } from '../../backend/local database/MessageStructure';
import { useThemeToggle } from '../GlobalUtils/ThemeProvider';

export type MessageBubbleProps = {
  message: Message;
  onImagePress: (uri: string) => void;
  onVideoPress: (uri: string) => void;
  onQuotedPress: (quoted: Message) => void;
  onLongPress: (message: Message, layout: { x: number; y: number; width: number; height: number }) => void;
  onReply: (message: Message) => void;
  isHidden?: boolean;
  highlighted?: boolean;
  // --- NEW PROP: indicates if the menu for THIS specific message is visible ---
  isMenuVisibleForThisMessage?: boolean;
};

const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  onImagePress,
  onVideoPress,
  onQuotedPress,
  onLongPress,
  onReply,
  isHidden = false,
  highlighted = false,
  isMenuVisibleForThisMessage = false, // Default to false
}) => {
  const { currentTheme } = useThemeToggle();
  const styles = getStyles(currentTheme);
  const isMe = message.sender === 'Me';

  const bubbleRef = useRef<View>(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2,
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx;
        const clampedDx = Math.max(Math.min(dx, 60), -60);
        if ((isMe && dx < 0) || (!isMe && dx > 0)) {
          translateX.setValue(clampedDx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const dx = gestureState.dx;
        const swipeThreshold = 50;
        if ((isMe && dx < -swipeThreshold) || (!isMe && dx > swipeThreshold)) {
          triggerTapHapticFeedback();
          onReply(message);
        }
        Animated.spring(translateX, {
          toValue: 0,
          friction: 7,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // --- MODIFIED handleLongPress: Only scales UP ---
  const handleLongPress = () => {
    triggerTapHapticFeedback();
    Animated.timing(scale, {
      toValue: 1.05, // Scale up
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      // After scaling up, trigger the onLongPress callback to open the menu
      bubbleRef.current?.measureInWindow((x, y, width, height) => {
        onLongPress(message, { x, y, width, height });
      });
    });
  };

  // --- NEW useEffect: Scales down when menu hides ---
  useEffect(() => {
    if (!isMenuVisibleForThisMessage) { // If menu is no longer visible for this message
      Animated.timing(scale, {
        toValue: 1, // Scale back down
        duration: 200, // A slightly longer duration for a smoother reset
        useNativeDriver: true,
      }).start();
    }
  }, [isMenuVisibleForThisMessage, scale]); // Depend on the prop and the animated value

  if (isHidden) {
    return <View style={{ height: measuredHeight || 50 }} />;
  }

  return (
    <View onLayout={(event) => setMeasuredHeight(event.nativeEvent.layout.height)}>
      <Animated.View style={{ transform: [{ translateX }, { scale }] }}>
        <View // This is the bubbleRef container
          ref={bubbleRef}
          style={[
            styles.bubbleContainer,
            isMe ? styles.bubbleRight : styles.bubbleLeft,
            highlighted && styles.highlighted,
          ]}
          // Removed panResponder.panHandlers from here to allow nested Pressable to handle it
        >
          {message.replyTo && (
            <Pressable onPress={() => onQuotedPress(message.replyTo!)} style={styles.contentWrapper}> {/* Added contentWrapper style for consistency */}
              <View style={styles.replyPreview}>
                <Text style={styles.replyLabel}>{`Replying to ${message.replyTo.sender}`}</Text>
                <Text numberOfLines={1} style={styles.replyText}>
                  {message.replyTo.text || (message.replyTo.imageUrl ? 'Image' : 'Video')}
                </Text>
              </View>
            </Pressable>
          )}

          {message.imageUrl && (
            <Pressable
              onPress={() => onImagePress(message.imageUrl!)}
              onLongPress={handleLongPress}
              delayLongPress={300}
              style={styles.contentWrapper} // Added contentWrapper style for consistency
              {...panResponder.panHandlers} // Apply panResponder to individual content Pressable
            >
              <Image source={{ uri: message.imageUrl }} style={styles.chatImage} />
            </Pressable>
          )}

          {message.videoUrl && (
            <Pressable
              onPress={() => onVideoPress(message.videoUrl!)}
              onLongPress={handleLongPress}
              delayLongPress={300}
              style={styles.contentWrapper} // Added contentWrapper style for consistency
              {...panResponder.panHandlers} // Apply panResponder to individual content Pressable
            >
              <Video
                source={{ uri: message.videoUrl }}
                style={styles.chatVideo}
                useNativeControls={false}
                resizeMode={'cover' as any}
              />
            </Pressable>
          )}

          {message.text && (
            <Pressable
              onLongPress={handleLongPress}
              delayLongPress={300}
              style={styles.contentWrapper} // Added contentWrapper style for consistency
              {...panResponder.panHandlers} // Apply panResponder to individual content Pressable
            >
              <Text style={styles.messageText}>{message.text}</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
      <Text style={[styles.timeTextOutside, isMe ? styles.timeTextRight : styles.timeTextLeft]}>
        {message.timestamp}
      </Text>
    </View>
  );
});

const getStyles = (theme: 'light' | 'dark') =>
  StyleSheet.create({
    bubbleContainer: {
      maxWidth: '80%',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
    },
    bubbleLeft: {
      alignSelf: 'flex-start',
      backgroundColor: theme === 'dark' ? '#262626' : '#E5E5EA',
      borderTopLeftRadius: 5,
    },
    bubbleRight: {
      alignSelf: 'flex-end',
      backgroundColor: theme === 'dark' ? '#005C4B' : '#DCF8C6',
      borderTopRightRadius: 5,
    },
    highlighted: {
      backgroundColor: theme === 'dark' ? '#5A4A02' : '#FFF3B2',
    },
    replyPreview: {
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#007AFF',
      padding: 8,
      marginBottom: 5,
    },
    replyLabel: { fontSize: 13, fontWeight: '600', color: '#007AFF', marginBottom: 2 },
    replyText: { fontSize: 14, color: theme === 'dark' ? '#B0B0B0' : '#555' },
    chatImage: {
      width: 220,
      height: 180,
      resizeMode: 'cover',
      borderRadius: 12,
      marginBottom: 5,
    },
    chatVideo: {
      width: 220,
      height: 150,
      borderRadius: 12,
      backgroundColor: theme === 'dark' ? '#000' : '#F0F0F0',
      marginBottom: 5,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 22,
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
    },
    timeTextOutside: {
      fontSize: 11,
      color: theme === 'dark' ? '#8E8E93' : '#6D6D72',
      marginTop: 2,
    },
    timeTextRight: { alignSelf: 'flex-end', marginRight: 5 },
    timeTextLeft: { alignSelf: 'flex-start', marginLeft: 5 },
    contentWrapper: { // Added for consistent Pressable styling
      // No specific styles needed here unless you want to add padding/margin directly to content
    },
  });

export default MessageBubble;