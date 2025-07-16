import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Pressable,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { triggerTapHapticFeedback } from '../GlobalUtils/TapHapticFeedback';
import { Message } from '../../backend/Local database/MessageStructure';
import { useThemeToggle } from '../GlobalUtils/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MessageBubbleProps = {
  message: Message;
  onImagePress: (uri: string) => void;
  onVideoPress: (uri: string) => void;
  onQuotedPress: (quoted: Message) => void;
  onLongPress: (message: Message, layout: { x: number; y: number; width: number; height: number }) => void;
  // onReply prop is removed
  isHidden?: boolean;
  highlighted?: boolean;
  isMenuVisibleForThisMessage?: boolean;
};

const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  onImagePress,
  onVideoPress,
  onQuotedPress,
  onLongPress,
  // onReply is removed
  isHidden = false,
  highlighted = false,
  isMenuVisibleForThisMessage = false,
}) => {
  const { currentTheme } = useThemeToggle();
  const styles = getStyles(currentTheme);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const bubbleRef = useRef<View>(null);
  useEffect(() => {
    AsyncStorage.getItem('walletAddress').then(setWalletAddress);
  }, []);
  // ✅ Move isMe inside the component body and after walletAddress is loaded
const isMe =
  message.localSender === 'Me' ||
  (walletAddress && message.sender?.toLowerCase() === walletAddress.toLowerCase());

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
  }, [isMenuVisibleForThisMessage]);

  if (isHidden) {
    return <View style={{ height: measuredHeight || 50 }} />;
  }

  return (
    <View onLayout={(event) => setMeasuredHeight(event.nativeEvent.layout.height)}>
      {/* The transform no longer includes translateX and panHandlers are removed */}
      <Animated.View
        style={{ transform: [{ scale }] }}
      >
        <View
          ref={bubbleRef}
          style={[
            styles.bubbleContainer,
            isMe ? styles.bubbleRight : styles.bubbleLeft,
            highlighted && styles.highlighted,
          ]}
        >
          {message.replyTo && typeof message.replyTo === 'object' && (
            <Pressable
              onPress={() => onQuotedPress(message.replyTo!)}
              style={styles.contentWrapper}
            >
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
              style={styles.contentWrapper}
            >
              <Image source={{ uri: message.imageUrl }} style={styles.chatImage} />
            </Pressable>
          )}

          {message.videoUrl && (
            <Pressable
              onPress={() => onVideoPress(message.videoUrl!)}
              onLongPress={handleLongPress}
              delayLongPress={300}
              style={styles.contentWrapper}
            >
              <Video
                source={{ uri: message.videoUrl }}
                style={styles.chatVideo}
                useNativeControls={false}
                resizeMode={ResizeMode.COVER}
              />
            </Pressable>
          )}

          {message.text && (
            <Pressable
              onLongPress={handleLongPress}
              delayLongPress={300}
              style={styles.contentWrapper}
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
      overflow: 'hidden',
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
    contentWrapper: {},
  });

export default MessageBubble;