import React, { useRef } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  Image,
  Keyboard,
  PanResponder,
  StyleSheet,
} from 'react-native';
import { Video } from 'expo-av';
import { triggerLightHapticFeedback } from '../GlobalUtils/TapHapticFeedback';
import { Message } from '../../backend/local database/SaveMessages';

export type MessageBubbleProps = {
  message: Message;
  onReply: (message: Message) => void;
  onImagePress: (uri: string) => void;
  onVideoPress: (uri: string) => void;
  onQuotedPress: (quoted: Message) => void;
  highlighted?: boolean;
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onReply,
  onImagePress,
  onVideoPress,
  onQuotedPress,
  highlighted = false,
}) => {
  const isMe = message.sender === 'Me';
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) =>
        Math.abs(gestureState.dx) > 5 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderGrant: () => {
        Keyboard.dismiss();
      },
      onPanResponderMove: (evt, gestureState) => {
        const dx = gestureState.dx;
        if ((isMe && dx < 0) || (!isMe && dx > 0)) {
          translateX.setValue(Math.max(Math.min(dx, 30), -30));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const dx = gestureState.dx;
        const swipeThreshold = 10;
        if ((isMe && dx < -swipeThreshold) || (!isMe && dx > swipeThreshold)) {
          onReply(message);
          triggerLightHapticFeedback();
        }
        Animated.spring(translateX, {
          toValue: 0,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.messageWrapper}>
      <Animated.View style={{ transform: [{ translateX }] }}>
        <View
          style={[
            styles.bubbleContainer,
            isMe ? styles.bubbleRight : styles.bubbleLeft,
            highlighted && { backgroundColor: '#EEFFE9' },
          ]}
          {...panResponder.panHandlers} // 👈 attached here
        >
          {message.replyTo && (
            <TouchableOpacity onPress={() => onQuotedPress(message.replyTo!)}>
              <View style={styles.replyPreview}>
                <Text style={styles.replyLabel}>Replying to:</Text>
                <Text numberOfLines={1} style={styles.replyText}>
                  {message.replyTo.text
                    ? message.replyTo.text
                    : message.replyTo.imageUrl
                    ? 'Image'
                    : message.replyTo.videoUrl
                    ? 'Video'
                    : ''}
                </Text>
              </View>
            </TouchableOpacity>
          )}
  
          {message.imageUrl && (
            <TouchableOpacity onPress={() => onImagePress(message.imageUrl ?? '')}>
              <View style={styles.imageBubble}>
                <Image source={{ uri: message.imageUrl }} style={styles.chatImage} />
              </View>
            </TouchableOpacity>
          )}
  
          {message.videoUrl && (
            <TouchableOpacity onPress={() => onVideoPress(message.videoUrl ?? '')}>
              <View style={styles.videoBubble}>
                <Video
                  source={{ uri: message.videoUrl }}
                  style={styles.chatVideo}
                  useNativeControls
                  resizeMode={'contain' as any}
                />
              </View>
            </TouchableOpacity>
          )}
  
          {message.text && <Text style={styles.messageText}>{message.text}</Text>}
        </View>
      </Animated.View>
  
      <Text style={[styles.timeTextOutside, isMe ? styles.timeTextRight : styles.timeTextLeft]}>
        {message.timestamp}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  messageWrapper: { marginBottom: 8 },
  bubbleContainer: {
    maxWidth: '75%',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
  },
  bubbleLeft: { alignSelf: 'flex-start', backgroundColor: '#fff', borderTopLeftRadius: 0 },
  bubbleRight: { alignSelf: 'flex-end', backgroundColor: '#DCF8C6', borderTopRightRadius: 0 },
  replyPreview: {
    borderLeftWidth: 2,
    borderLeftColor: '#007AFF',
    paddingLeft: 6,
    marginBottom: 4,
  },
  replyLabel: { fontSize: 11, color: '#007AFF', marginBottom: 2 },
  replyText: { fontSize: 13, color: '#555' },
  imageBubble: { marginBottom: 5 },
  chatImage: {
    width: 100,
    height: 120,
    resizeMode: 'contain',
    borderRadius: 8,
    marginBottom: 5,
  },
  videoBubble: { marginBottom: 5 },
  chatVideo: {
    width: 200,
    height: 120,
    borderRadius: 8,
    marginBottom: 5,
  },
  messageText: { fontSize: 17, lineHeight: 22, color: '#333' },
  timeTextOutside: { fontSize: 10, color: '#999', marginTop: 4 },
  timeTextRight: { alignSelf: 'flex-end' },
  timeTextLeft: { alignSelf: 'flex-start' },
});

export default MessageBubble;
