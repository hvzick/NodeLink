// screens/ChatDetailScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import handleAttachment from '../../utils/ChatUtils/InsertAttachment';
import { triggerTapHapticFeedback } from '../../utils/GlobalUtils/TapHapticFeedback';
import { initializeDatabase, insertMessage, fetchMessages, Message } from '../../backend/local database/SaveMessages';
import MessageBubble from '../../utils/ChatUtils/MessageBubble';
import { useThemeToggle } from '../../utils/GlobalUtils/ThemeProvider';
import { useChat } from '../../utils/ChatUtils/ChatContext'; // Import the useChat hook
import { ChatItemType } from '../../utils/ChatUtils/ChatItemsTypes'; // Import the main chat item type

type RootStackParamList = {
  ChatDetail: { conversationId: string; name: string; avatar: any };
};

type ChatDetailRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;
type ChatDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ChatDetail'>;

type Props = {
  route: ChatDetailRouteProp;
  navigation: ChatDetailNavigationProp;
};

const ChatDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { conversationId, name, avatar } = route.params;

  // Get the global chat update function from the context
  const { addOrUpdateChat } = useChat();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<Omit<Message, 'id'> | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { currentTheme } = useThemeToggle();
  const styles = getStyles(currentTheme);

  // Pan responder for modals
  const modalPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dy) > 20,
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100) {
          if (selectedImage) setSelectedImage(null);
          if (selectedVideo) setSelectedVideo(null);
        }
      },
    })
  ).current;

  // Pan responder to dismiss keyboard
  const keyboardDismissPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dy) > 20,
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 50) {
          Keyboard.dismiss();
        }
      },
    })
  ).current;

  // Initialize DB and load messages on mount
  useEffect(() => {
    (async () => {
      await initializeDatabase();
      try {
        const fetchedMessages: Message[] = await fetchMessages(conversationId);
        setMessages(fetchedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    })();
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: false });
    }
  }, [messages]);

  // Keyboard show listener
  useEffect(() => {
    const eventName = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardListener = Keyboard.addListener(eventName, () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);
    });
    return () => {
      keyboardListener.remove();
    };
  }, []);

  const handleQuotedPress = (quoted: Message) => {
    const index = messages.findIndex((msg) => msg.id === quoted.id);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
      setHighlightedMessageId(quoted.id);
      setTimeout(() => setHighlightedMessageId(null), 1500);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachment) return;
    const newId = Date.now().toString();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let combinedMsg: Message = {
      id: newId,
      conversationId,
      sender: 'Me',
      timestamp,
    };

    if (newMessage.trim()) combinedMsg.text = newMessage;
    if (attachment) combinedMsg = { ...combinedMsg, ...attachment };
    if (replyMessage) combinedMsg.replyTo = replyMessage;

    // --- Start of Key Changes ---

    // 1. Create a ChatItemType object to send to the global context.
    // This represents the updated state for the ChatScreen list.
    const updatedChatItem: ChatItemType = {
        id: conversationId,
        name: name,
        // Show a snippet of the new message.
        message: combinedMsg.text || (combinedMsg.imageUrl ? 'Image' : 'Video'),
        time: timestamp,
        avatar: avatar,
    };

    // 2. Call the global update function.
    // This will update the chat list and move this chat to the top.
    addOrUpdateChat(updatedChatItem);

    // --- End of Key Changes ---

    // Update local state for this screen and clear inputs
    setMessages([...messages, combinedMsg]);
    setNewMessage('');
    setAttachment(null);
    setReplyMessage(null);
    triggerTapHapticFeedback();

    try {
      await insertMessage(combinedMsg);
      // Refetching might be redundant if local state update is sufficient,
      // but it ensures data consistency with the database.
      const fetchedMessages = await fetchMessages(conversationId);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error inserting message:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      onReply={(msg) => setReplyMessage(msg)}
      onImagePress={(uri) => setSelectedImage(uri)}
      onVideoPress={(uri) => setSelectedVideo(uri)}
      onQuotedPress={handleQuotedPress}
      highlighted={item.id === highlightedMessageId}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* HEADER */}
          <View style={styles.headerContainer}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={24} color={currentTheme === 'dark' ? '#FFF' : '#007AFF'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.chatsText}>Chats</Text>
              </TouchableOpacity>
              <Image source={avatar} style={styles.detailAvatar} />
              <Text style={styles.detailUserName}>{name}</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.callButton} onPress={() => {}}>
                <Ionicons name="call-outline" size={24} color={currentTheme === 'dark' ? '#FFF' : '#000'} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ImageBackground
            style={styles.chatBackground}
            source={{ uri: 'https://i.pinimg.com/564x/85/70/f6/8570f6339d3189914b16dab461e1b8c6.jpg' }}
            {...keyboardDismissPanResponder.panHandlers}
          >
            <Text style={styles.encryptedText}>End-to-end encrypted</Text>
            <FlatList
              keyboardShouldPersistTaps="always"
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.flatListContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
            
            {/* Reply preview */}
            {replyMessage && (
              <View style={styles.replyContainer}>
                <TouchableOpacity onPress={() => handleQuotedPress(replyMessage)}>
                  <Text style={styles.replyPreviewText}>
                    Replying to:{' '}
                    {replyMessage.text ? replyMessage.text : (replyMessage.imageUrl ? 'Image' : 'Video')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setReplyMessage(null)}>
                  <Ionicons name="close" size={20} color={currentTheme === 'dark' ? '#FFF' : '#333'} />
                </TouchableOpacity>
              </View>
            )}

            {/* Attachment preview */}
            {attachment && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewText}>Attachment selected</Text>
              </View>
            )}

            {/* BOTTOM INPUT BAR */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.iconContainer}
                onPress={async () => {
                  const att = await handleAttachment();
                  if (att) setAttachment({ ...att, conversationId });
                }}
              >
                <Ionicons name="attach" size={24} color={currentTheme === 'dark' ? '#FFF' : '#666'} />
              </TouchableOpacity>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type a Message"
                  placeholderTextColor={currentTheme === 'dark' ? '#AAA' : '#999'}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  onFocus={() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50)}
                />
              </View>
              <TouchableOpacity style={styles.iconContainer} onPress={() => console.log('Mic pressed')}>
                <Ionicons name="mic" size={24} color={currentTheme === 'dark' ? '#FFF' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconContainer} onPress={handleSendMessage}>
                <Ionicons name="send" size={24} color={currentTheme === 'dark' ? '#FFF' : '#666'} />
              </TouchableOpacity>
            </View>
          </ImageBackground>

          {/* Modals for image/video preview */}
          <Modal visible={!!selectedImage} transparent onRequestClose={() => setSelectedImage(null)}>
            <View style={styles.modalContainer} {...modalPanResponder.panHandlers}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedImage(null)}>
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
              {selectedImage && <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />}
            </View>
          </Modal>
          <Modal visible={!!selectedVideo} transparent onRequestClose={() => setSelectedVideo(null)}>
            <View style={styles.modalContainer} {...modalPanResponder.panHandlers}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedVideo(null)}>
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
              {selectedVideo && (
                <Video
                  source={{ uri: selectedVideo }}
                  style={styles.fullScreenVideo}
                  useNativeControls
                  resizeMode={"contain" as any}
                />
              )}
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

// Styles function remains the same
const getStyles = (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme === 'dark' ? '#222' : '#EDEDED' },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme === 'dark' ? '#222' : '#F2F2F2',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? '#444' : '#ccc',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', top: -5 },
    backButton: { marginRight: 5 },
    chatsText: {
      color: theme === 'dark' ? '#FFF' : '#037EE5',
      fontSize: 15,
      marginRight: 10,
      left: -5,
      fontFamily: 'SF-Pro-Text-Regular',
    },
    detailAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
    detailUserName: {
      fontSize: 20,
      color: theme === 'dark' ? '#FFF' : '#000',
      left: 5,
      fontFamily: 'SF-Pro-Text-Medium',
    },
    headerRight: { alignItems: 'flex-end', top: -5 },
    callButton: { padding: 5, marginRight: 10 },
    encryptedText: {
      textAlign: 'center',
      color: theme === 'dark' ? '#AAA' : '#999',
      marginVertical: 10,
      fontSize: 13,
      fontFamily: 'SF-Pro-Text-Regular',
      backgroundColor: 'transparent',
    },
    chatBackground: { flex: 1, width: '100%', height: '100%' },
    flatListContent: { paddingHorizontal: 10, paddingVertical: 5 },
    replyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#333' : '#F5FFF2',
      borderLeftColor: '#007AFF',
      borderLeftWidth: 2,
      padding: 8,
      marginHorizontal: 10,
      borderRadius: 8,
      marginBottom: 4,
    },
    replyPreviewText: { flex: 1, fontSize: 14, color: theme === 'dark' ? '#FFF' : '#333' },
    previewContainer: {
      padding: 8,
      backgroundColor: theme === 'dark' ? '#222' : '#fff',
      marginHorizontal: 10,
      borderRadius: 8,
      marginBottom: 8,
    },
    previewText: { fontSize: 14, color: theme === 'dark' ? '#FFF' : '#333' },
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#222' : '#EDEDED',
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: theme === 'dark' ? '#444' : '#ccc',
    },
    iconContainer: { paddingHorizontal: 8 },
    inputWrapper: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#333' : '#fff',
      marginHorizontal: 6,
      borderRadius: 25,
      justifyContent: 'center',
      paddingHorizontal: 10,
    },
    textInput: { paddingVertical: 8, fontSize: 16, color: theme === 'dark' ? '#FFF' : '#000' },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullScreenImage: {
      width: '90%',
      height: '70%',
      resizeMode: 'contain',
    },
    fullScreenVideo: {
      width: '90%',
      height: '70%',
    },
    modalClose: {
      position: 'absolute',
      top: 40,
      right: 20,
      zIndex: 1,
    },
  });

export default ChatDetailScreen;
