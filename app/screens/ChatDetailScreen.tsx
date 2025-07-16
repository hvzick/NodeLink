// screens/ChatDetailScreen.tsx
import React, { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import {
  FlatList, Image, ImageBackground, KeyboardAvoidingView, Keyboard, Modal, PanResponder, Animated,
  Platform, StyleSheet, Text, TextInput, TouchableOpacity,
  View, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import handleAttachment from '../../utils/ChatDetailUtils/InsertAttachment';
import { Message } from '../../backend/Local database/MessageStructure';
import { fetchMessagesByConversation } from '../../backend/Local database/MessageIndex';
import MessageBubble from '../../utils/ChatDetailUtils/MessageBubble';
import { useThemeToggle } from '../../utils/GlobalUtils/ThemeProvider';
import { EventBus, useChat } from '../../utils/ChatUtils/ChatContext';

import { ChatDetailHandlerDependencies } from '../../utils/ChatDetailUtils/ChatHandlers/HandleDependencies';
import { handleSendMessage } from '../../utils/ChatDetailUtils/ChatHandlers/HandleSendMessage';
import { handleLongPress } from '../../utils/ChatDetailUtils/ChatHandlers/HandleLongPress';
import { handleOptionSelect } from '../../utils/ChatDetailUtils/ChatHandlers/HandleOptionSelect';
import { closeLongPressMenu } from '../../utils/ChatDetailUtils/ChatHandlers/CloseLongPressMenu';
import { handleQuotedPress } from '../../utils/ChatDetailUtils/ChatHandlers/HandleQuotedPress';
import MessageLongPressMenu, { MenuOption } from '../../utils/ChatDetailUtils/ChatHandlers/HandleMessageLongPressMenu';
import { formatDateHeader, formatTimeForUser } from '../../utils/GlobalUtils/FormatDate';
import { RootStackParamList } from '../App';

import { ensureDatabaseInitialized } from '../../backend/Local database/InitialiseDatabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../backend/Supabase/Supabase';
import { deriveSharedKeyWithUser } from '../../backend/Encryption/SharedKey';
import { playSendTone, initConversationTones } from '../../utils/NotificationsSettings/ConversationTones';
import { deleteMessage } from '../../backend/Local database/DeleteMessage';
import MessageInfoWindow from '../../utils/ChatDetailUtils/MessageInfoWindow';


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
  const receiverAddress = conversationId.replace('convo_', '');
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<Message | null>(null);
  const infoWindowPosition = useRef(new Animated.ValueXY({ x: 20, y: 80 })).current;
  const infoWindowPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([
        null,
        { dx: infoWindowPosition.x, dy: infoWindowPosition.y },
      ], { useNativeDriver: false }),
      onPanResponderRelease: () => {},
    })
  ).current;

  const flatListRef = useRef<FlatList>(null);
  const { currentTheme } = useThemeToggle();
  const styles = getStyles(currentTheme);

 const handlerDependencies: ChatDetailHandlerDependencies = useMemo(() => ({
  conversationId, name, avatar, addOrUpdateChat,
  messages, setMessages, newMessage, setNewMessage,
  attachment, setAttachment, replyMessage, setReplyMessage,
  setSelectedImage, setSelectedVideo,
  setHighlightedMessageId, setMenuVisible,
  setSelectedMessageForMenu, setMenuPosition,
  flatListRef,
  userAddress: userAddress ?? '', // Ensures it's always a string
  receiverAddress
}), [
  conversationId, name, avatar, addOrUpdateChat,
  messages, setMessages, newMessage, setNewMessage,
  attachment, setAttachment, replyMessage, setReplyMessage,
  setSelectedImage, setSelectedVideo,
  setHighlightedMessageId, setMenuVisible,
  setSelectedMessageForMenu, setMenuPosition,
  flatListRef,
  userAddress,             // ✅ Add this
  receiverAddress          // ✅ Add this
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
      await ensureDatabaseInitialized(); // <-- always await this first!
      const fetched = await fetchMessagesByConversation(conversationId);
      setMessages(fetched.sort((a, b) => (a.createdAt || parseInt(a.id, 10)) - (b.createdAt || parseInt(b.id, 10))));
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
      setIsLoading(false);
    };
    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    const fetchUserAddress = async () => {
      const address = await AsyncStorage.getItem('walletAddress');
      setUserAddress(address);
    };
    fetchUserAddress();
  }, []);

  useEffect(() => {
    // Compare local and Supabase public keys for the receiver
    const checkAndSyncPublicKey = async () => {
      try {
        // 1. Load local user profile for receiver
        const localProfileRaw = await AsyncStorage.getItem(`user_profile_${receiverAddress}`);
        let localPublicKey = null;
        if (localProfileRaw) {
          const localProfile = JSON.parse(localProfileRaw);
          localPublicKey = localProfile.publicKey;
        }

        // 2. Fetch current public key from Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('public_key')
          .eq('wallet_address', receiverAddress)
          .single();
        if (error || !data?.public_key) {
          console.warn('Could not fetch public key from Supabase:', error);
          return;
        }
        const supabasePublicKey = data.public_key;

        // 3. Compare
        if (localPublicKey !== supabasePublicKey) {
          console.warn('Public key mismatch detected. Reloading user data and re-deriving shared key.');
          // Reload user data and update local cache
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('wallet_address', receiverAddress)
            .single();
          if (!userError && userData) {
            await AsyncStorage.setItem(`user_profile_${receiverAddress}`, JSON.stringify(userData));
          }
          // Re-derive and store the shared key
          const newSharedKey = await deriveSharedKeyWithUser(receiverAddress);
          if (newSharedKey) {
            await AsyncStorage.setItem(`shared_key_${receiverAddress}`, newSharedKey);
            console.log('🔑 Re-derived and stored new shared key for', receiverAddress);
          }
        }
      } catch (err) {
        console.error('Error checking/syncing public key:', err);
      }
    };
    checkAndSyncPublicKey();
  }, [receiverAddress]);

  useEffect(() => {
    if (infoMessage) {
      infoWindowPosition.setValue({ x: 20, y: 80 });
    }
  }, [infoMessage]);

  // --- NEW: Function to handle tapping on the user's profile in the header ---
  const handleProfilePress = () => {
    // The conversationId is expected to be in the format "convo_WALLET_ADDRESS"
    const walletAddress = conversationId.replace('convo_', '');
    if (walletAddress) {
      navigation.navigate('UserProfile', { walletAddress });
    } else {
      console.warn("Could not determine wallet address from conversationId:", conversationId);
    }
  };

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

  const handleSendMessageWrapper = async () => {
    await playSendTone();
    handleSendMessage(handlerDependencies);
  };
  const handleQuotedPressWrapper = (quoted: Message) => handleQuotedPress(handlerDependencies, quoted, dataWithSeparators, isMessage);
  const handleLongPressWrapper = (msg: Message, layout: { x: number; y: number; width: number; height: number }) => handleLongPress(handlerDependencies, msg, layout);
  const closeLongPressMenuWrapper = () => closeLongPressMenu(handlerDependencies);
  
  const handleOptionSelectWrapper = async (option: MenuOption) => {
    if (!selectedMessageForMenu) return;

    if (option === 'Reply') {
      handleReply(selectedMessageForMenu);
      closeLongPressMenuWrapper();
      return;
    }

    if (option === 'Info') {
      setInfoMessage(selectedMessageForMenu);
      closeLongPressMenuWrapper();
      return;
    }

    await handleOptionSelect(handlerDependencies, option, selectedMessageForMenu);
  };

  const clearAttachmentPreview = () => {
    setAttachment(null);
  };
  
  useEffect(() => {
  const handleNewMessage = (newMsg: Message) => {
    const msgSender = newMsg.sender.toLowerCase();
    const myReceiver = receiverAddress.toLowerCase();
    if (msgSender === myReceiver) {
      setMessages(prev => {
        const exists = prev.some(m => m.id === newMsg.id);
        if (exists) return prev;
        const updated = [...prev, newMsg].sort((a, b) =>
          (a.createdAt || parseInt(a.id, 10)) - (b.createdAt || parseInt(b.id, 10))
        );
        return updated;
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  };

  EventBus.on('new-message', handleNewMessage);

  return () => {
    EventBus.off('new-message', handleNewMessage);
  };
}, [receiverAddress]);

  useEffect(() => {
    // Initialize conversation tones on mount
    initConversationTones();
  }, []);


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
        {/* --- MODIFICATION: The user avatar and name are now tappable --- */}
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileTapArea} onPress={handleProfilePress}>
            <Image source={avatar || { uri: 'https://via.placeholder.com/40' }} style={styles.detailAvatar} />
            <Text style={styles.detailUserName} onPress={handleProfilePress}>{name}</Text>
          </TouchableOpacity>
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
          onDeleteChat={async () => {
            if (!selectedMessageForMenu) return;
            await deleteMessage(selectedMessageForMenu.id);
            setMessages((prev) => prev.filter((msg) => msg.id !== selectedMessageForMenu.id));
            closeLongPressMenuWrapper();
          }}
        />
      )}

      {/* Info Window */}
      <MessageInfoWindow message={infoMessage} onClose={() => setInfoMessage(null)} />

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
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    profileTapArea: { // Added style for the new tappable area
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: { paddingRight: 10 }, // Adjusted padding for better spacing
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
    infoWindow: {
      position: 'absolute',
      left: 20,
      right: 20,
      top: 80,
      zIndex: 10,
      backgroundColor: theme === 'dark' ? '#222' : '#fff',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 8,
    },
    infoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    infoTitle: {
      fontWeight: 'bold',
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#222',
    },
    infoContent: {
      marginTop: 4,
    },
    infoLabel: {
      fontSize: 13,
      color: theme === 'dark' ? '#aaa' : '#444',
      marginBottom: 2,
    },
    infoValue: {
      color: theme === 'dark' ? '#fff' : '#000',
      fontWeight: '500',
    },
  });

export default ChatDetailScreen;
