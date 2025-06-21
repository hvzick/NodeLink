// screens/ChatDetailScreen.tsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  FlatList, Image, ImageBackground, KeyboardAvoidingView, Keyboard, Modal, PanResponder,
  Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity,
  View, ActivityIndicator
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import handleAttachment from '../../utils/ChatDetailUtils/InsertAttachment';
import { Message } from '../../backend/local database/MessageStructure';
import { fetchMessagesByConversation } from '../../backend/local database/MessageIndex';
import MessageBubble from '../../utils/ChatDetailUtils/MessageBubble';
import { useThemeToggle } from '../../utils/GlobalUtils/ThemeProvider';
import { useChat } from '../../utils/ChatUtils/ChatContext';

import { ChatDetailHandlerDependencies } from '../../utils/ChatDetailUtils/ChatHandlers/HandleDependencies';
import { handleSendMessage } from '../../utils/ChatDetailUtils/ChatHandlers/HandleSendMessage';
import { handleLongPress } from '../../utils/ChatDetailUtils/ChatHandlers/HandleLongPress';
import { handleOptionSelect } from '../../utils/ChatDetailUtils/ChatHandlers/HandleOptionSelect';
import { closeLongPressMenu } from '../../utils/ChatDetailUtils/ChatHandlers/CloseLongPressMenu';
import { handleQuotedPress } from '../../utils/ChatDetailUtils/ChatHandlers/HandleQuotedPress';
import MessageLongPressMenu, { MenuOption } from '../../utils/ChatDetailUtils/ChatHandlers/HandleMessageLongPressMenu';
import { formatDateHeader } from '../../utils/ChatDetailUtils/FormatDate';
import { RootStackParamList } from '../App';


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
  const [attachment, setAttachment] = useState<Partial<Message> | null>(null);
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

  const handlerDependencies: ChatDetailHandlerDependencies = useMemo(() => ({
    conversationId, name, avatar, addOrUpdateChat,
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    attachment,
    setAttachment,
    replyMessage,
    setReplyMessage,
    setSelectedImage,
    setSelectedVideo,
    setHighlightedMessageId,
    setMenuVisible,
    setSelectedMessageForMenu,
    setMenuPosition,
    flatListRef,
  }), [
    conversationId, name, avatar, addOrUpdateChat,
    messages,
    setMessages, setNewMessage, setAttachment, setReplyMessage,
    replyMessage,
    newMessage, attachment,
    setSelectedImage, setSelectedVideo,
    setHighlightedMessageId, setMenuVisible,
    setSelectedMessageForMenu, setMenuPosition,
    flatListRef,
  ]);
  
  const handleReply = useCallback((message: Message) => {
    setReplyMessage(message);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyMessage(null);
  }, []);

  const modalPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.dy < -80) {
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
      setMessages(fetched.sort((a, b) => (a.createdAt || parseInt(a.id, 10)) - (b.createdAt || parseInt(b.id, 10))));
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
      setIsLoading(false);
    };
    loadMessages();
  }, [conversationId]);

  const isMessage = (item: any): item is Message => item && 'sender' in item && 'id' in item;

  const dataWithSeparators = useMemo(() => {
    const list: (Message | { type: 'date'; date: string; id: string })[] = [];
    let lastDate = '';
    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt || parseInt(msg.id, 10));
      const dateString = msgDate.toDateString();
      if (dateString !== lastDate) {
        list.push({ type: 'date', date: formatDateHeader(msgDate), id: `sep-${dateString}` });
        lastDate = dateString;
      }
      list.push(msg);
    });
    return list;
  }, [messages]);

  const handleSendMessageWrapper = () => handleSendMessage(handlerDependencies);
  const handleQuotedPressWrapper = (quoted: Message) => handleQuotedPress(handlerDependencies, quoted, dataWithSeparators, isMessage);
  const handleLongPressWrapper = (msg: Message, layout: { x: number; y: number; width: number; height: number }) => handleLongPress(handlerDependencies, msg, layout);
  const closeLongPressMenuWrapper = () => closeLongPressMenu(handlerDependencies);
  
  const handleOptionSelectWrapper = async (option: MenuOption) => {
    if (!selectedMessageForMenu) return;

    // --- SOLUTION: Check the option variable directly ---
    if (option === 'Reply') {
      handleReply(selectedMessageForMenu);
      closeLongPressMenuWrapper();
      return;
    }
    // ----------------------------------------------------

    await handleOptionSelect(handlerDependencies, option, selectedMessageForMenu);
  };

  const clearAttachmentPreview = () => {
    setAttachment(null);
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
        onImagePress={(uri) => handlerDependencies.setSelectedImage(uri)}
        onVideoPress={(uri) => handlerDependencies.setSelectedVideo(uri)}
        onQuotedPress={handleQuotedPressWrapper}
        onLongPress={handleLongPressWrapper}
        highlighted={item.id === highlightedMessageId || item.id === replyMessage?.id}
        isMenuVisibleForThisMessage={menuVisible && selectedMessageForMenu?.id === item.id}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Image source={avatar || { uri: 'https://via.placeholder.com/40' }} style={styles.detailAvatar} />
          <Text style={styles.detailUserName}>{name}</Text>
        </View>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Long Press Menu */}
      {menuVisible && selectedMessageForMenu && (
        <MessageLongPressMenu
          isVisible={menuVisible}
          onClose={closeLongPressMenuWrapper}
          onOptionSelect={handleOptionSelectWrapper}
          menuPosition={menuPosition}
          message={selectedMessageForMenu}
          isSender={selectedMessageForMenu.sender === 'Me'}
        />
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
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
              extraData={replyMessage}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
          )}

          {replyMessage && (
            <View style={styles.replyContainer}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.replyingToUser}>Replying to {replyMessage.sender === 'Me' ? 'Yourself' : name}</Text>
                    <Text style={styles.replyPreviewText} numberOfLines={1}>
                        {replyMessage.text || (replyMessage.imageUrl ? 'Image' : 'Video')}
                    </Text>
                </View>
                <TouchableOpacity onPress={cancelReply}>
                    <Ionicons name="close-circle" size={22} color="#999" />
                </TouchableOpacity>
            </View>
          )}

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
              <TouchableOpacity onPress={clearAttachmentPreview} style={{ position: 'absolute', top: 5, right: 5 }}>
                <Ionicons name="close-circle" size={24} color="red" />
              </TouchableOpacity>
            </View>
          )}

          {(selectedImage || selectedVideo) && (
            <Modal visible transparent animationType="fade">
              <View style={styles.modalContainer} {...modalPanResponder.panHandlers}>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => {
                    handlerDependencies.setSelectedImage(null);
                    handlerDependencies.setSelectedVideo(null);
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

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={async () => {
                const att = await handleAttachment();
                if (att) {
                  const safeAttachment: Partial<Message> = { imageUrl: att.imageUrl, videoUrl: att.videoUrl };
                  handlerDependencies.setAttachment(safeAttachment);
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
            <TouchableOpacity style={styles.iconContainer} onPress={handleSendMessageWrapper}>
              <Ionicons name="send" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
    replyingToUser: {
        fontWeight: 'bold',
        color: '#007AFF',
        fontSize: 13,
    },
    replyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F0F0F0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 10,
        borderLeftColor: '#007AFF',
        borderLeftWidth: 4,
        borderRadius: 8,
    },
    replyPreviewText: {
        fontSize: 14,
        color: theme === 'dark' ? '#B0B0B0' : '#555',
    },
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