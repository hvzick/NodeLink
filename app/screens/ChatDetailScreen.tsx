// screens/ChatDetailScreen.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FlatList, Image, ImageBackground, KeyboardAvoidingView, Keyboard, Modal, PanResponder,
  Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity,
  TouchableWithoutFeedback, View, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
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
import { RootStackParamList } from '../App';
import { copyToClipboard } from '../../utils/GlobalUtils/CopyToClipboard';

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

 const modalPanResponder = useRef(
  PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 20; // vertical movement
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 80 || gestureState.dy < -80) {
        // swipe down or up
        setSelectedImage(null);
        setSelectedVideo(null);
      }
    },
  })
).current;


  const keyboardDismissPanResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 20,
    onPanResponderRelease: (_, gs) => {
      if (gs.dy > 50) Keyboard.dismiss();
    },
  })).current;

useEffect(() => {
  const loadMessages = async () => {
    setIsLoading(true);
    const fetched = await fetchMessagesByConversation(conversationId);
    fetched.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
    setMessages(fetched);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100); // delay ensures rendering completes first
    setIsLoading(false);
  };
  loadMessages();
}, [conversationId]);


  const isMessage = (item: any): item is Message => item && 'sender' in item && 'id' in item;

  const dataWithSeparators = useMemo(() => {
    const list: (Message | { type: 'date'; date: string; id: string })[] = [];
    let lastDate = '';
    messages.forEach((msg) => {
      const msgDate = new Date(parseInt(msg.id));
      const dateString = msgDate.toDateString();
      if (dateString !== lastDate) {
        list.push({ type: 'date', date: formatDateHeader(msgDate), id: `sep-${dateString}` });
        lastDate = dateString;
      }
      list.push(msg);
    });
    return list;
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachment) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg: Message = {
      id: Date.now().toString(),
      conversationId,
      sender: 'Me',
      timestamp,
      ...(newMessage.trim() && { text: newMessage }),
      ...(attachment && attachment),
      ...(replyMessage && { replyTo: replyMessage }),
    };

    setMessages(prev => [...prev, msg]);
    setNewMessage('');
    setAttachment(null);
    setReplyMessage(null);
    triggerTapHapticFeedback();

    try {
      await insertMessage(msg);
    } catch (e) {
      console.error("Insert error:", e);
    }

    const preview: ChatItemType = {
      id: conversationId,
      name,
      message: msg.text || (msg.imageUrl ? 'Image' : 'Video'),
      time: timestamp,
      avatar,
    };
    addOrUpdateChat(preview);
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
      );
    }
    if (!isMessage(item)) return null;
    return (
      <MessageBubble
        message={item}
        onReply={setReplyMessage}
        onImagePress={setSelectedImage}
        onVideoPress={setSelectedVideo}
        onQuotedPress={handleQuotedPress}
        onLongPress={handleLongPress}
        highlighted={item.id === highlightedMessageId}
      />
    );
  };

  const handleQuotedPress = (quoted: Message) => {
    const index = dataWithSeparators.findIndex(item => isMessage(item) && item.id === quoted.id);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
      setHighlightedMessageId(quoted.id);
      setTimeout(() => setHighlightedMessageId(null), 1500);
    }
  };

const handleLongPress = (msg: Message, layout: { x: number; y: number; width: number; height: number }) => {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const menuWidth = 180;
  const menuHeight = 130; // Estimate height of your menu
  const topMargin = 10;

  const left = Math.max(10, Math.min(screenWidth - menuWidth - 10, msg.sender === 'Me' ? layout.x + layout.width - menuWidth : layout.x));

  let top = layout.y + layout.height;
  if (top + menuHeight > screenHeight) {
    top = layout.y - menuHeight - topMargin;
    if (top < topMargin) top = topMargin; // keep on screen
  }

  setSelectedMessageForMenu(msg);
  setMenuPosition({ top, left });
  setMenuVisible(true);
};

  const handleOptionSelect = async (option: MenuOption) => {
    if (!selectedMessageForMenu) return;
    switch (option) {
      case 'Reply':
        setReplyMessage(selectedMessageForMenu);
        break;
      case 'Delete':
        await handleDeleteMessage(selectedMessageForMenu.id);
        break;
      case 'Copy':
        if (selectedMessageForMenu.text) await copyToClipboard(selectedMessageForMenu.text);
        break;
      case 'Forward':
        console.log('Forwarding message:', selectedMessageForMenu);
        break;
    }
    setMenuVisible(false);
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await deleteMessage(id);
      setMessages(msgs => msgs.filter(m => m.id !== id));
    } catch {
      Alert.alert('Error', 'Could not delete message');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Image source={avatar} style={styles.detailAvatar} />
          <Text style={styles.detailUserName}>{name}</Text>
        </View>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {menuVisible && selectedMessageForMenu && (
        <MessageLongPressMenu
          isVisible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onOptionSelect={handleOptionSelect}
          menuPosition={menuPosition}
          message={selectedMessageForMenu}
          isSender={selectedMessageForMenu.sender === 'Me'}
        />
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ImageBackground
          style={styles.chatBackground}
          source={{ uri: 'https://via.placeholder.com/400' }}
          {...keyboardDismissPanResponder.panHandlers}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#999" style={{ flex: 1 }} />
          ) : (
            <FlatList
              ref={flatListRef}
              data={dataWithSeparators}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.flatListContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
          )}

          {replyMessage && (
            <View style={styles.replyContainer}>
              <TouchableOpacity onPress={() => handleQuotedPress(replyMessage)}>
                <Text style={styles.replyPreviewText}>
                  Replying to: {replyMessage.text || (replyMessage.imageUrl ? 'Image' : 'Video')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setReplyMessage(null)}>
                <Ionicons name="close" size={20} />
              </TouchableOpacity>
            </View>
          )}

          {/* Attachment Preview */}
          {attachment && (
            <View style={styles.previewContainer}>
              {attachment.imageUrl && (
                <Image source={{ uri: attachment.imageUrl }} style={{ width: 100, height: 100, borderRadius: 8 }} />
              )}
              {attachment.videoUrl && (
                <Video
                  source={{ uri: attachment.videoUrl }}
                  style={{ width: 100, height: 100, borderRadius: 8 }}
                   resizeMode={ResizeMode.COVER}
                  useNativeControls
                />
              )}
              <TouchableOpacity onPress={() => setAttachment(null)} style={{ position: 'absolute', top: 5, right: 5 }}>
                <Ionicons name="close-circle" size={24} color="red" />
              </TouchableOpacity>
            </View>
          )}
          {/* Fullscreen Media Viewer */}
          {(selectedImage || selectedVideo) && (
            <Modal visible transparent animationType="fade">
              <View style={styles.modalContainer} {...modalPanResponder.panHandlers}>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => {
                    setSelectedImage(null);
                    setSelectedVideo(null);
                  }}
                >
                  <Ionicons name="close-circle" size={32} color="white" />
                </TouchableOpacity>

                {selectedImage ? (
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                  />
                ) : selectedVideo ? (
                  <Video
                    source={{ uri: selectedVideo }}
                    style={styles.fullScreenVideo}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                  />
                ) : null}
              </View>
            </Modal>
          )}

          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={async () => {
                const att = await handleAttachment();
                if (att) {
                  const safeAttachment = { ...att, conversationId, sender: 'Me', timestamp: '', text: '' };
                  delete (safeAttachment as any).id;
                  setAttachment(safeAttachment);
                }
              }}
            >
              <Ionicons name="attach" size={24} color="#666" />
            </TouchableOpacity>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message"
                placeholderTextColor="#999"
                value={newMessage}
                onChangeText={setNewMessage}
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

const formatDateHeader = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString();
};
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
      resizeMode: 'contain',
    },
    modalClose: {
      position: 'absolute',
      top: 40,
      right: 20,
      zIndex: 1,
    },
    dateSeparator: {
      alignSelf: 'center',
      marginVertical: 10,
      backgroundColor: theme === 'dark' ? '#333' : '#CCC',
      padding: 6,
      borderRadius: 10,
    },
    dateText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme === 'dark' ? '#fff' : '#000',
    },
  });


export default ChatDetailScreen;