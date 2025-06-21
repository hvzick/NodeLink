import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  PanResponder,
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
};

const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  onImagePress,
  onVideoPress,
  onQuotedPress,
  onLongPress,
  onReply,
  isHidden = false,
}) => {
  const { currentTheme } = useThemeToggle();
  const styles = getStyles(currentTheme);
  const isMe = message.sender === 'Me';

  const bubbleRef = useRef<View>(null);
  const translateX = useRef(new Animated.Value(0)).current;

  // State to store the actual height of the bubble for the placeholder
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  // PanResponder for swipe-to-reply
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

  // Uses `measureInWindow` to get the exact position for animations
  const handleLongPress = () => {
    triggerTapHapticFeedback();
    bubbleRef.current?.measureInWindow((x, y, width, height) => {
      onLongPress(message, { x, y, width, height });
    });
  };

  // If hidden, render a placeholder with the measured height
  if (isHidden) {
    return <View style={{ height: measuredHeight || 50 }} />; // Fallback height of 50
  }

  return (
    <View onLayout={(event) => setMeasuredHeight(event.nativeEvent.layout.height)}>
      <Animated.View style={{ transform: [{ translateX }] }}>
        <TouchableOpacity
          onLongPress={handleLongPress}
          activeOpacity={0.9}
          delayLongPress={200}
          {...panResponder.panHandlers}
        >
          <View
            ref={bubbleRef}
            style={[
              styles.bubbleContainer,
              isMe ? styles.bubbleRight : styles.bubbleLeft,
            ]}
          >
            {message.replyTo && (
              <TouchableOpacity onPress={() => onQuotedPress(message.replyTo!)}>
                <View style={styles.replyPreview}>
                  <Text style={styles.replyLabel}>{`Replying to ${message.replyTo.sender}`}</Text>
                  <Text numberOfLines={1} style={styles.replyText}>
                    {message.replyTo.text || (message.replyTo.imageUrl ? 'Image' : 'Video')}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {message.imageUrl && (
              <TouchableOpacity onPress={() => onImagePress(message.imageUrl!)}>
                <Image source={{ uri: message.imageUrl }} style={styles.chatImage} />
              </TouchableOpacity>
            )}
            
            {message.videoUrl && (
              <TouchableOpacity onPress={() => onVideoPress(message.videoUrl!)}>
                <Video
                  source={{ uri: message.videoUrl }}
                  style={styles.chatVideo}
                  useNativeControls={false}
                  resizeMode={'cover' as any}
                />
              </TouchableOpacity>
            )}

            {message.text && <Text style={styles.messageText}>{message.text}</Text>}
          </View>
        </TouchableOpacity>
      </Animated.View>
      <Text style={[styles.timeTextOutside, isMe ? styles.timeTextRight : styles.timeTextLeft]}>
        {message.timestamp}
      </Text>
    </View>
  );
});

const getStyles = (theme: 'light' | 'dark') =>
  StyleSheet.create({
    messageWrapper: { 
      marginVertical: 4, 
      marginHorizontal: 8,
    },
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
    chatImage: { width: 220, height: 180, resizeMode: 'cover', borderRadius: 12, marginBottom: 5 },
    chatVideo: { width: 220, height: 150, borderRadius: 12, backgroundColor: theme === 'dark' ? '#000' : '#F0F0F0', marginBottom: 5 },
    messageText: { fontSize: 16, lineHeight: 22, color: theme === 'dark' ? '#FFFFFF' : '#000000' },
    timeTextOutside: { fontSize: 11, color: theme === 'dark' ? '#8E8E93' : '#6D6D72', marginTop: 2 },
    timeTextRight: { alignSelf: 'flex-end', marginRight: 5 },
    timeTextLeft: { alignSelf: 'flex-start', marginLeft: 5 },
  });

export default MessageBubble;