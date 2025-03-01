import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ImageBackground,
  Image,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import handleAttachment, { Message as AttachmentMessage } from '../../utils/ChatUtils/InsertAttachment';
import { triggerHoldHapticFeedback } from '@/utils/GlobalUtils/HoldHapticFeedback';
import { triggerLightHapticFeedback } from '@/utils/GlobalUtils/HapticFeedback';

type RootStackParamList = {
  ChatDetail: { conversationId: string; name: string; avatar: any };
};

type ChatDetailRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;
type ChatDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ChatDetail'>;

type Props = {
  route: ChatDetailRouteProp;
  navigation: ChatDetailNavigationProp;
};

export type Message = {
  id: string;
  sender: string;
  text?: string;
  timestamp: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: string;
  videoUrl?: string;
  audioUrl?: string;
};

const ChatDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { conversationId, name, avatar } = route.params;
  // Dummy initial messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'Alice',
      text: "Hey, how's it going?",
      timestamp: '10:00 AM',
    },
    {
      id: '2',
      sender: 'Me',
      text: "I'm good, thanks! How about you?",
      timestamp: '10:01 AM',
    },
    {
      id: '3',
      sender: 'Alice',
      text: "Doing well. Just working on some projects.",
      timestamp: '10:02 AM',
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  // New state to hold the selected attachment (if any)
  const [attachment, setAttachment] = useState<Omit<Message, 'id'> | null>(null);
  const flatListRef = useRef<FlatList>(null);

  /** Send a new message from "Me" when Send is pressed */
  const handleSendMessage = () => {
    if (!newMessage.trim() && !attachment) return; // Nothing to send

    const newId = (messages.length + 1).toString();
    let combinedMsg: Message = {
      id: newId,
      sender: 'Me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Merge text if entered
    if (newMessage.trim()) {
      combinedMsg.text = newMessage;
    }
    // Merge attachment data if selected
    if (attachment) {
      combinedMsg = { ...combinedMsg, ...attachment };
    }

    setMessages([...messages, combinedMsg]);
    setNewMessage('');
    setAttachment(null); // Clear the attachment after sending
    console.log('send pressed');
    triggerLightHapticFeedback();
  };

  /** Render each message bubble */
  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'Me';

    return (
      <View style={styles.messageWrapper}>
        <View style={[styles.bubbleContainer, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
          {!isMe && (
            <View style={styles.nameLabel}>
              <Text style={styles.nameText}>{item.sender}</Text>
            </View>
          )}
          {item.imageUrl && (
            <View style={styles.imageBubble}>
              <Image source={{ uri: item.imageUrl }} style={styles.chatImage} />
              {item.fileName && (
                <Text style={styles.fileText}>
                  {item.fileName} {item.fileSize ? `(${item.fileSize})` : ''}
                </Text>
              )}
            </View>
          )}
          {item.text && (
            <Text style={styles.messageText}>
              {item.text}
            </Text>
          )}
        </View>
        <Text style={[styles.timeTextOutside, isMe ? styles.timeTextRight : styles.timeTextLeft]}>
          {item.timestamp}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#EDEDED' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* CUSTOM HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.chatsText}>Chats</Text>
            <Image source={avatar} style={styles.detailAvatar} />
            <Text style={styles.detailUserName}>{name}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.callButton}>
              <Ionicons name="call-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.encryptedText}>End-to-end encrypted</Text>

        {/* CHAT AREA */}
        <ImageBackground style={styles.chatBackground} source={{ uri: 'https://via.placeholder.com/400' }}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.flatListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Display a preview of the selected attachment (if any) */}
          {attachment && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewText}>Attachment selected: {attachment.fileName}</Text>
            </View>
          )}

          {/* BOTTOM INPUT BAR */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={async () => {
                const att = await handleAttachment();
                if (att) {
                  setAttachment(att);
                }
              }}
            >
              <Ionicons name="attach" size={24} color="#666" />
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a Message"
                placeholderTextColor="#999"
                value={newMessage}
                onChangeText={setNewMessage}
                autoFocus={true}
              />
            </View>

            <TouchableOpacity style={styles.iconContainer} onPress={() => console.log('Mic pressed')}>
              <Ionicons name="mic" size={24} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconContainer} onPress={handleSendMessage}>
              <Ionicons name="send" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDEDED' },
  // HEADER
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', top: -5 },
  backButton: { marginRight: 5 },
  chatsText: {
    color: '#037EE5',
    fontSize: 15,
    marginRight: 10,
    left: -5,
    fontFamily: 'SF-Pro-Text-Regular',
  },
  detailAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  detailUserName: { fontSize: 20, color: '#000', left: 5, fontFamily: 'SF-Pro-Text-Medium' },
  headerRight: { alignItems: 'flex-end', top: -5 },
  callButton: { padding: 5, marginRight: 10 },
  // CHAT BACKGROUND
  chatBackground: { flex: 1, width: '100%', height: '100%' },
  flatListContent: { paddingHorizontal: 10, paddingVertical: 5 },
  // MESSAGE WRAPPER
  messageWrapper: { marginBottom: 8 },
  // BUBBLES
  bubbleContainer: {
    maxWidth: '75%',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
  },
  bubbleLeft: { alignSelf: 'flex-start', backgroundColor: '#fff', borderTopLeftRadius: 0 },
  bubbleRight: { alignSelf: 'flex-end', backgroundColor: '#DCF8C6', borderTopRightRadius: 0 },
  nameLabel: { backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 3 },
  nameText: { fontSize: 13, fontWeight: 'bold', color: '#075E54' },
  messageText: { fontSize: 17, lineHeight: 22, color: '#333', fontFamily: 'SF-Pro-Text-Regular' },
  timeTextOutside: { fontSize: 10, color: '#999', marginTop: 4 },
  timeTextRight: { alignSelf: 'flex-end' },
  timeTextLeft: { alignSelf: 'flex-start' },
  
  // IMAGE BUBBLE
  imageBubble: { marginBottom: 5 },
  chatImage: { 
    width: 100, 
    height: 120, 
    resizeMode: 'contain', 
    borderRadius: 8, 
    marginBottom: 5 
  },
  fileText: { color: '#333', fontSize: 14 },

  // BOTTOM INPUT BAR
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEDED',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  iconContainer: { paddingHorizontal: 8 },
  inputWrapper: { flex: 1, backgroundColor: '#fff', marginHorizontal: 6, borderRadius: 25, justifyContent: 'center', paddingHorizontal: 10 },
  textInput: { paddingVertical: 8, fontSize: 16 },
  // ENCRYPTION NOTICE
  encryptedText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 10,
    fontSize: 13,
    fontFamily: 'SF-Pro-Text-Regular',
  },
  // Attachment preview
  previewContainer: {
    padding: 8,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  previewText: { fontSize: 14, color: '#333' },
});
