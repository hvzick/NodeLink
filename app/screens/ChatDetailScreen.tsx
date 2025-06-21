// screens/ChatDetailScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  FlatList, Image, ImageBackground, KeyboardAvoidingView, Keyboard, Modal, PanResponder,
  Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity,
  TouchableWithoutFeedback, View, Clipboard, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import handleAttachment from '../../utils/ChatDetailUtils/InsertAttachment';
import { triggerTapHapticFeedback } from '../../utils/GlobalUtils/TapHapticFeedback';
import { Message } from '../../backend/local database/MessageStructure';
import {
  insertMessage,
  fetchMessagesByConversation,
  deleteMessage,
} from '../../backend/local database/MessageIndex';
import MessageBubble from '../../utils/ChatDetailUtils/MessageBubble';
import { useThemeToggle } from '../../utils/GlobalUtils/ThemeProvider';
import { useChat } from '../../utils/ChatUtils/ChatContext';
import { ChatItemType } from '../../utils/ChatUtils/ChatItemsTypes';
import MessageLongPressMenu, { MenuOption } from '../../utils/ChatDetailUtils/MessageLongPressMenu';
import { RootStackParamList } from '../App'; // Assuming App is in the parent directory

type ChatDetailRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;
type ChatDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ChatDetail'>;

type Props = {
  route: ChatDetailRouteProp;
  navigation: ChatDetailNavigationProp;
};

const ChatDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { conversationId, name, avatar } = route.params;
  const { addOrUpdateChat } = useChat();
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<Omit<Message, 'id'> | null>(null);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessageForMenu, setSelectedMessageForMenu] = useState<Message | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const flatListRef = useRef<FlatList>(null);
  const { currentTheme } = useThemeToggle();
  const styles = getStyles(currentTheme);
  const modalPanResponder = useRef(PanResponder.create({ onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 20, onPanResponderRelease: (_, gestureState) => { if (gestureState.dy > 100) { setSelectedImage(null); setSelectedVideo(null); } }, })).current;
  const keyboardDismissPanResponder = useRef(PanResponder.create({ onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 20, onPanResponderRelease: (_, gestureState) => { if (gestureState.dy > 50) Keyboard.dismiss(); }, })).current;

  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const fetchedMessages = await fetchMessagesByConversation(conversationId);
        setMessages(fetchedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        Alert.alert('Error', 'Could not load messages.');
      } finally {
        setIsLoading(false);
      }
    };
    loadMessages();
  }, [conversationId]);

  useEffect(() => { if (messages.length > 0) { setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100); } }, [messages]);
  useEffect(() => { const eventName = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'; const keyboardListener = Keyboard.addListener(eventName, () => { setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50); }); return () => keyboardListener.remove(); }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachment) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const combinedMsg: Message = { id: Date.now().toString(), conversationId, sender: 'Me', timestamp, ...(newMessage.trim() && { text: newMessage }), ...(attachment && { ...attachment }), ...(replyMessage && { replyTo: replyMessage }) };
    const updatedChatItem: ChatItemType = { id: conversationId, name, message: combinedMsg.text || (combinedMsg.imageUrl ? 'Image' : 'Video'), time: timestamp, avatar };
    addOrUpdateChat(updatedChatItem);
    setMessages(prev => [...prev, combinedMsg]);
    setNewMessage(''); setAttachment(null); setReplyMessage(null);
    triggerTapHapticFeedback();
    try { await insertMessage(combinedMsg); } catch (error) { console.error('Error inserting message:', error); }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try { await deleteMessage(messageId); setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId)); } catch (error) { console.error("Failed to delete message:", error); Alert.alert("Error", "Could not delete message."); }
  };

  // [FIX] Updated the handleLongPress function to accept the 'layout' object.
  const handleLongPress = (message: Message, layout: { x: number; y: number; width: number; height: number; }) => {
    const menuWidth = 180;
    const screenWidth = Dimensions.get('window').width;

    // Use layout.x instead of position.left
    let menuLeftPosition = layout.x;

    // If the message is on the right, align the menu to the right of the bubble
    if (message.sender === 'Me') {
      menuLeftPosition = layout.x + layout.width - menuWidth;
    }

    // Keep menu on screen
    if (menuLeftPosition < 10) menuLeftPosition = 10;
    if (menuLeftPosition + menuWidth > screenWidth - 10) menuLeftPosition = screenWidth - menuWidth - 10;

    setSelectedMessageForMenu(message);
    // Use layout.y and layout.height to position the menu below the bubble
    setMenuPosition({ top: layout.y + layout.height, left: menuLeftPosition });
    setMenuVisible(true);
  };

  const handleQuotedPress = (quoted: Message) => {
    const index = messages.findIndex((msg) => msg.id === quoted.id);
    if (index !== -1) { flatListRef.current?.scrollToIndex({ index, animated: true }); setHighlightedMessageId(quoted.id); setTimeout(() => setHighlightedMessageId(null), 1500); }
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleOptionSelect = (option: MenuOption) => {
    if (!selectedMessageForMenu) return;
    switch (option) {
      case 'Reply': setReplyMessage(selectedMessageForMenu); break;
      case 'Copy': if (selectedMessageForMenu.text) Clipboard.setString(selectedMessageForMenu.text); break;
      case 'Delete': handleDeleteMessage(selectedMessageForMenu.id); break;
      case 'Forward': console.log('Forwarding message:', selectedMessageForMenu.id); break;
    }
    closeMenu();
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      onReply={setReplyMessage}
      onImagePress={setSelectedImage}
      onVideoPress={setSelectedVideo}
      onQuotedPress={handleQuotedPress}
      onLongPress={handleLongPress} // This function now matches the expected type
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {menuVisible && selectedMessageForMenu && ( <MessageLongPressMenu isVisible={menuVisible} onClose={closeMenu} onOptionSelect={handleOptionSelect} menuPosition={menuPosition} message={selectedMessageForMenu} isSender={selectedMessageForMenu.sender === 'Me'} /> )}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={currentTheme === 'dark' ? '#FFF' : '#007AFF'} />
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
        <ImageBackground style={styles.chatBackground} source={{ uri: 'https://i.pinimg.com/564x/85/70/f6/8570f6339d3189914b16dab461e1b8c6.jpg' }} {...keyboardDismissPanResponder.panHandlers}>
          {isLoading ? ( <View style={styles.loadingContainer}><ActivityIndicator size="large" color={currentTheme === 'dark' ? '#FFF' : '#000'} /></View> ) : ( <FlatList data={messages} renderItem={renderMessage} keyExtractor={(item) => item.id} contentContainerStyle={styles.flatListContent} ref={flatListRef} keyboardShouldPersistTaps="handled" /> )}
          {replyMessage && ( <View style={styles.replyContainer}><TouchableOpacity onPress={() => handleQuotedPress(replyMessage)}><Text style={styles.replyPreviewText}> Replying to: {replyMessage.text ? replyMessage.text.substring(0, 30) : (replyMessage.imageUrl ? 'Image' : 'Video')} </Text></TouchableOpacity><TouchableOpacity onPress={() => setReplyMessage(null)}><Ionicons name="close" size={20} color={currentTheme === 'dark' ? '#FFF' : '#333'} /></TouchableOpacity></View> )}
          <View style={styles.bottomBar}><TouchableOpacity style={styles.iconContainer} onPress={async () => { const att = await handleAttachment(); if (att) setAttachment({ ...att, conversationId }); }}><Ionicons name="attach" size={24} color={currentTheme === 'dark' ? '#FFF' : '#666'} /></TouchableOpacity><View style={styles.inputWrapper}><TextInput style={styles.textInput} placeholder="Type a Message" placeholderTextColor={currentTheme === 'dark' ? '#AAA' : '#999'} value={newMessage} onChangeText={setNewMessage} /></View><TouchableOpacity style={styles.iconContainer} onPress={() => console.log('Mic pressed')}><Ionicons name="mic" size={24} color={currentTheme === 'dark' ? '#FFF' : '#666'} /></TouchableOpacity><TouchableOpacity style={styles.iconContainer} onPress={handleSendMessage}><Ionicons name="send" size={24} color={currentTheme === 'dark' ? '#FFF' : '#666'} /></TouchableOpacity></View>
        </ImageBackground>
        <Modal visible={!!selectedImage} transparent onRequestClose={() => setSelectedImage(null)}><View style={styles.modalContainer} {...modalPanResponder.panHandlers}><TouchableOpacity style={styles.modalClose} onPress={() => setSelectedImage(null)}><Ionicons name="close" size={32} color="#fff" /></TouchableOpacity>{selectedImage && <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />}</View></Modal>
        <Modal visible={!!selectedVideo} transparent onRequestClose={() => setSelectedVideo(null)}><View style={styles.modalContainer} {...modalPanResponder.panHandlers}><TouchableOpacity style={styles.modalClose} onPress={() => setSelectedVideo(null)}><Ionicons name="close" size={32} color="#fff" /></TouchableOpacity>{selectedVideo && <Video source={{ uri: selectedVideo }} style={styles.fullScreenVideo} useNativeControls resizeMode={"contain" as any} />}</View></Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme === 'dark' ? '#121212' : '#F5F5F5' },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F7F7F7', paddingHorizontal: 10, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: theme === 'dark' ? '#333' : '#ccc', },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  detailAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  detailUserName: { fontSize: 17, fontWeight: '600', color: theme === 'dark' ? '#FFF' : '#000' },
  headerRight: { alignItems: 'flex-end' },
  callButton: { padding: 5, marginRight: 10 },
  chatBackground: { flex: 1 },
  flatListContent: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 10 },
  replyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F0F0F0', borderLeftColor: '#007AFF', borderLeftWidth: 4, padding: 8, marginHorizontal: 10, borderRadius: 8, marginBottom: 4 },
  replyPreviewText: { flex: 1, fontSize: 14, color: theme === 'dark' ? '#FFF' : '#333' },
  bottomBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F7F7F7', paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme === 'dark' ? '#333' : '#ccc' },
  iconContainer: { paddingHorizontal: 8 },
  inputWrapper: { flex: 1, backgroundColor: theme === 'dark' ? '#3A3A3C' : '#FFFFFF', marginHorizontal: 6, borderRadius: 20, justifyContent: 'center', paddingHorizontal: 15 },
  textInput: { paddingVertical: Platform.OS === 'ios' ? 10 : 8, fontSize: 16, color: theme === 'dark' ? '#FFF' : '#000' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '95%', height: '80%', resizeMode: 'contain' },
  fullScreenVideo: { width: '95%', height: '80%' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default ChatDetailScreen;