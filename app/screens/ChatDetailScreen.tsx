import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  PanResponder,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useIsFocused } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import handleAttachment from "../../utils/ChatDetailUtils/InsertAttachment";
import { Message } from "../../backend/Local database/SQLite/MessageStructure";
import { fetchMessagesByConversation } from "../../backend/Local database/SQLite/MessageIndex";
import MessageBubble from "../../utils/ChatDetailUtils/MessageBubble";
import { useThemeToggle } from "../../utils/GlobalUtils/ThemeProvider";
import { EventBus, useChat } from "../../utils/ChatUtils/ChatContext";
import { markMessagesAsRead } from "../../backend/Local database/SQLite/MarkMessagesAsRead";
import { BlurView } from "expo-blur";
import { ChatDetailHandlerDependencies } from "../../utils/ChatDetailUtils/ChatHandlers/HandleDependencies";
import { handleSendMessage } from "../../utils/ChatDetailUtils/ChatHandlers/HandleSendMessage";
import { handleOptionSelect } from "../../utils/ChatDetailUtils/ChatHandlers/HandleOptionSelect";
import { handleQuotedPress } from "../../utils/ChatDetailUtils/ChatHandlers/HandleQuotedPress";
import {
  toggleMessageSelection,
  exitSelectionMode,
} from "../../utils/ChatDetailUtils/ChatHandlers/HandleSelectMessage";
import {
  handleBulkDelete,
  handleSelectAll,
} from "../../backend/Local database/SQLite/DeleteMultipleMessages";
import MessageLongPressMenu, {
  MenuOption,
} from "../../utils/ChatDetailUtils/ChatHandlers/HandleMessageLongPressMenu";
import { formatDateHeader } from "../../utils/GlobalUtils/FormatDate";
import { RootStackParamList } from "../App";
import { ensureDatabaseInitialized } from "../../backend/Local database/SQLite/InitialiseDatabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../backend/Supabase/Supabase";
import {
  deriveSharedKeyWithUser,
  getCompressedPublicKey,
} from "../../backend/E2E-Encryption/SharedKey";
import {
  playSendTone,
  initConversationTones,
} from "../../utils/NotificationsSettings/ConversationTones";
import { deleteMessage } from "../../backend/Local database/SQLite/DeleteMessage";
import MessageInfoWindow from "../../utils/ChatDetailUtils/MessageInfoWindow";

// Enhanced SwipeToQuoteWrapper component
const SwipeToQuoteWrapper: React.FC<{
  message: any;
  onQuote: (message: any) => void;
  children: React.ReactNode;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}> = ({ message, onQuote, children, onSwipeStart, onSwipeEnd }) => {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const [swiping, setSwiping] = React.useState(false);

  const velocityThreshold = 0.3;
  const distanceThreshold = 40;
  const maxTranslate = 80;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontalSwipe =
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        const isRightSwipe = gestureState.dx > 0;
        const hasMinimumDistance = Math.abs(gestureState.dx) > 10;

        return isHorizontalSwipe && isRightSwipe && hasMinimumDistance;
      },

      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const isHorizontalSwipe =
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 3;
        const isRightSwipe = gestureState.dx > 0;
        const hasSignificantDistance = gestureState.dx > 20;

        return isHorizontalSwipe && isRightSwipe && hasSignificantDistance;
      },

      onPanResponderGrant: () => {
        setSwiping(true);
        onSwipeStart?.();
        translateX.setOffset(0);
        translateX.setValue(0);
      },

      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          const clampedValue = Math.min(gestureState.dx, maxTranslate);
          translateX.setValue(clampedValue);
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        setSwiping(false);
        onSwipeEnd?.();

        const swipeDistance = gestureState.dx;
        const swipeVelocity = gestureState.vx;
        const verticalMovement = Math.abs(gestureState.dy);

        const isSuccessfulSwipe =
          swipeDistance > distanceThreshold &&
          swipeVelocity > velocityThreshold &&
          verticalMovement < 60;

        if (isSuccessfulSwipe) {
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: 70,
              duration: 120,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: 180,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (typeof onQuote === "function" && message) {
              onQuote(message);
            }
          });
        } else {
          Animated.timing(translateX, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        setSwiping(false);
        onSwipeEnd?.();
        Animated.timing(translateX, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateX }],
          elevation: swiping ? 2 : 0,
          shadowOpacity: swiping ? 0.1 : 0,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
};

type ChatDetailRouteProp = RouteProp<RootStackParamList, "ChatDetail">;
type ChatDetailNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ChatDetail"
>;

type Props = {
  route: ChatDetailRouteProp;
  navigation: ChatDetailNavigationProp;
};

const ChatDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { conversationId, name, avatar } = route.params;
  const { addOrUpdateChat } = useChat();
  const isFocused = useIsFocused();
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachment, setAttachment] = useState<Partial<Message> | null>(null);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessageForMenu, setSelectedMessageForMenu] =
    useState<Message | null>(null);
  const [menuPosition, setMenuPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const receiverAddress = conversationId.replace("convo_", "");
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<Message | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
    new Set()
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true); // Added for swipe handling

  const infoWindowPosition = useRef(
    new Animated.ValueXY({ x: 20, y: 80 })
  ).current;
  const flatListRef = useRef<FlatList<any>>(null);
  const { currentTheme } = useThemeToggle();
  const styles = getStyles(currentTheme);

  const handlerDependencies: ChatDetailHandlerDependencies = useMemo(
    () => ({
      conversationId,
      name,
      avatar,
      addOrUpdateChat,
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
      userAddress: userAddress ?? "",
      receiverAddress,
      setIsSelectionMode,
      setSelectedMessages,
    }),
    [
      conversationId,
      name,
      avatar,
      addOrUpdateChat,
      messages,
      newMessage,
      attachment,
      replyMessage,
      userAddress,
      receiverAddress,
    ]
  );

  // Swipe handlers
  const handleSwipeStart = useCallback(() => {
    setScrollEnabled(false);
  }, []);

  const handleSwipeEnd = useCallback(() => {
    setTimeout(() => setScrollEnabled(true), 100);
  }, []);

  const toggleMessageSelectionWrapper = useCallback(
    (messageId: string) => {
      toggleMessageSelection(handlerDependencies, messageId);
    },
    [handlerDependencies]
  );

  const exitSelectionModeWrapper = useCallback(() => {
    exitSelectionMode(handlerDependencies);
  }, [handlerDependencies]);

  const deleteSelectedMessagesWrapper = useCallback(async () => {
    await handleBulkDelete(handlerDependencies, selectedMessages);
  }, [handlerDependencies, selectedMessages]);

  const handleSelectAllWrapper = useCallback(() => {
    handleSelectAll(handlerDependencies, messages, selectedMessages);
  }, [handlerDependencies, messages, selectedMessages]);

  // Mark messages as read when screen is focused
  useEffect(() => {
    if (!isFocused) return;

    const markAsRead = async () => {
      try {
        await markMessagesAsRead(conversationId);
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
      }
    };

    markAsRead();

    const handleNewMessage = (message: any) => {
      if (message.conversationId === conversationId && isFocused) {
        setTimeout(markAsRead, 100);
      }
    };

    EventBus.on("new-message", handleNewMessage);
    return () => EventBus.off("new-message", handleNewMessage);
  }, [conversationId, isFocused]);

  const onEndReached = useCallback(async () => {
    try {
      await markMessagesAsRead(conversationId);
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  }, [conversationId]);

  const cancelReply = useCallback(() => {
    setReplyMessage(null);
  }, []);

  const modalPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 20,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.dy < -80) {
          setSelectedImage(null);
          setSelectedVideo(null);
        }
      },
    })
  ).current;

  const keyboardDismissPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 20,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 50) Keyboard.dismiss();
      },
    })
  ).current;

  // Load messages sorted newest-first for inverted FlatList
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      await ensureDatabaseInitialized();
      const fetched = await fetchMessagesByConversation(conversationId);

      const sortedMessages = fetched.sort(
        (a, b) =>
          (b.createdAt || parseInt(b.id, 10)) -
          (a.createdAt || parseInt(a.id, 10))
      );

      setMessages(sortedMessages);
      setIsLoading(false);
    };
    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    const fetchUserAddress = async () => {
      const address = await AsyncStorage.getItem("walletAddress");
      setUserAddress(address);
      if (address) {
        const raw = await AsyncStorage.getItem(`crypto_key_pair_${address}`);
        const old = await AsyncStorage.getItem(`old_private_key_${address}`);
        if (raw) {
          const keyPair = JSON.parse(raw);
          if (old && old !== keyPair.privateKey) {
            const newSharedKey = await deriveSharedKeyWithUser(receiverAddress);
            if (newSharedKey) {
              await AsyncStorage.setItem(
                `shared_key_${receiverAddress}`,
                newSharedKey
              );
            }
            await AsyncStorage.removeItem(`old_private_key_${address}`);
          }
        }
      }
    };
    fetchUserAddress();
  }, [receiverAddress]);

  useEffect(() => {
    const checkAndSyncPublicKey = async () => {
      try {
        const localProfileRaw = await AsyncStorage.getItem(
          `user_profile_${receiverAddress}`
        );
        let localPublicKey = null;
        if (localProfileRaw) {
          const localProfile = JSON.parse(localProfileRaw);
          if (localProfile.public_key) {
            localPublicKey = getCompressedPublicKey(localProfile.public_key);
          } else if (localProfile.publicKey) {
            localPublicKey = getCompressedPublicKey(localProfile.publicKey);
          }
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("public_key")
          .eq("wallet_address", receiverAddress)
          .single();
        if (error || !data?.public_key) return;

        const supabasePublicKey = getCompressedPublicKey(data.public_key);

        if (localPublicKey !== supabasePublicKey) {
          const { data: userData, error: userError } = await supabase
            .from("profiles")
            .select("*")
            .eq("wallet_address", receiverAddress)
            .single();
          if (!userError && userData) {
            await AsyncStorage.setItem(
              `user_profile_${receiverAddress}`,
              JSON.stringify(userData)
            );
          }
          const newSharedKey = await deriveSharedKeyWithUser(receiverAddress);
          if (newSharedKey) {
            await AsyncStorage.setItem(
              `shared_key_${receiverAddress}`,
              newSharedKey
            );
          }
        }
      } catch (err) {
        console.error("Error checking/syncing public key:", err);
      }
    };
    checkAndSyncPublicKey();
  }, [receiverAddress]);

  useEffect(() => {
    if (infoMessage) {
      infoWindowPosition.setValue({ x: 20, y: 80 });
    }
  }, [infoMessage, infoWindowPosition]);

  const handleProfilePress = () => {
    const walletAddress = conversationId.replace("convo_", "");
    if (walletAddress) {
      navigation.navigate("UserProfile", { walletAddress });
    }
  };

  const isMessage = (item: any): item is Message =>
    item && "sender" in item && "id" in item;

  // Build date separators for newest-first (inverted) array
  const dataWithSeparators = useMemo(() => {
    const list: (Message | { type: "date"; date: string; id: string })[] = [];

    messages.forEach((msg, index) => {
      const msgDate = new Date(msg.createdAt || parseInt(msg.id, 10));
      const dateString = msgDate.toDateString();

      const nextDateString =
        index < messages.length - 1
          ? new Date(
              messages[index + 1].createdAt ||
                parseInt(messages[index + 1].id, 10)
            ).toDateString()
          : null;

      const shouldAddDateSeparator =
        index === messages.length - 1 || dateString !== nextDateString;

      list.push(msg);

      if (shouldAddDateSeparator) {
        list.push({
          type: "date",
          date: formatDateHeader(msgDate),
          id: `sep-${dateString}-${index}`,
        });
      }
    });

    return list;
  }, [messages]);

  const handleSendMessageWrapper = async () => {
    await playSendTone();
    handleSendMessage(handlerDependencies);
  };

  const handleQuotedPressWrapper = (quoted: Message) =>
    handleQuotedPress(
      handlerDependencies,
      quoted,
      dataWithSeparators,
      isMessage
    );

  // Updated handleLongPressWrapper with fixes
  const handleLongPressWrapper = (
    msg: Message,
    layout: { x: number; y: number; width: number; height: number }
  ) => {
    // Defer state updates to avoid insertion effect conflicts
    requestAnimationFrame(() => {
      setMenuPosition({
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
      });
      setSelectedMessageForMenu(msg);
      setHighlightedMessageId(msg.id);

      // Set menu visible last to ensure other states are ready
      setTimeout(() => setMenuVisible(true), 0);
    });
  };

  // Updated closeLongPressMenuWrapper with fixes
  const closeLongPressMenuWrapper = () => {
    // Close menu immediately, defer other cleanup
    setMenuVisible(false);

    requestAnimationFrame(() => {
      setHighlightedMessageId(null);
      setSelectedMessageForMenu(null);
    });
  };

  const handleOptionSelectWrapper = async (option: MenuOption) => {
    if (!selectedMessageForMenu) return;

    if (option === "Info") {
      setInfoMessage(selectedMessageForMenu);
      closeLongPressMenuWrapper();
      return;
    }

    await handleOptionSelect(
      handlerDependencies,
      option,
      selectedMessageForMenu
    );
  };

  const clearAttachmentPreview = () => setAttachment(null);

  // Handle new messages - prepend to newest-first array
  useEffect(() => {
    const handleNewMessage = (newMsg: Message) => {
      if (newMsg.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [newMsg, ...prev];
        });
      }
    };

    EventBus.on("new-message", handleNewMessage);
    return () => EventBus.off("new-message", handleNewMessage);
  }, [conversationId]);

  // Handle received messages
  useEffect(() => {
    const handleReceivedMessage = (newMsg: Message) => {
      const msgSender = newMsg.sender.toLowerCase();
      const myReceiver = receiverAddress.toLowerCase();
      if (msgSender === myReceiver) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [newMsg, ...prev];
        });
      }
    };

    EventBus.on("new-message", handleReceivedMessage);
    return () => EventBus.off("new-message", handleReceivedMessage);
  }, [receiverAddress]);

  useEffect(() => {
    initConversationTones();
  }, []);

  const repliedMessages = useMemo(() => {
    const map: Record<string, Message> = {};
    messages.forEach((msg) => {
      map[msg.id] = msg;
    });
    return map;
  }, [messages]);

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === "date") {
      return (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
      );
    }
    if (!isMessage(item)) return null;

    const isSelected = selectedMessages.has(item.id);
    const isHighlighted =
      item.id === highlightedMessageId || item.id === replyMessage?.id;

    return (
      <SwipeToQuoteWrapper
        message={item}
        onQuote={setReplyMessage}
        onSwipeStart={handleSwipeStart}
        onSwipeEnd={handleSwipeEnd}
      >
        <View style={styles.messageBubble}>
          {/* Selection indicator */}
          {isSelectionMode && (
            <TouchableOpacity
              style={styles.selectionIndicator}
              onPress={() => toggleMessageSelectionWrapper(item.id)}
            >
              <View
                style={[
                  styles.selectionCircle,
                  isSelected && styles.selectedCircle,
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              if (isSelectionMode) {
                toggleMessageSelectionWrapper(item.id);
              }
            }}
            style={[
              styles.messageContainer,
              isSelectionMode && styles.selectionModeMessage,
              isSelected && styles.selectedMessage,
            ]}
            activeOpacity={isSelectionMode ? 0.7 : 1}
          >
            <MessageBubble
              message={item}
              chatRecipientName={name}
              repliedMessages={repliedMessages}
              onImagePress={(uri) => handlerDependencies.setSelectedImage(uri)}
              onVideoPress={(uri) => handlerDependencies.setSelectedVideo(uri)}
              onQuotedPress={handleQuotedPressWrapper}
              onLongPress={isSelectionMode ? () => {} : handleLongPressWrapper}
              highlighted={isHighlighted}
              isMenuVisibleForThisMessage={
                menuVisible && selectedMessageForMenu?.id === item.id
              }
            />
          </TouchableOpacity>
        </View>
      </SwipeToQuoteWrapper>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        {isSelectionMode ? (
          <>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={exitSelectionModeWrapper}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.selectionCount}>
                {selectedMessages.size} selected
              </Text>
            </View>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={handleSelectAllWrapper}
            >
              <Text style={styles.selectAllText}>
                {selectedMessages.size === messages.length
                  ? "Deselect All"
                  : "Select All"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileTapArea}
                onPress={handleProfilePress}
              >
                <Image
                  source={avatar || { uri: "https://via.placeholder.com/40" }}
                  style={styles.detailAvatar}
                />
                <Text style={styles.detailUserName}>{name}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Long Press Menu */}
      {menuVisible && selectedMessageForMenu && (
        <MessageLongPressMenu
          isVisible={menuVisible}
          onClose={closeLongPressMenuWrapper}
          onOptionSelect={handleOptionSelectWrapper}
          menuPosition={menuPosition}
          message={selectedMessageForMenu}
          isSender={selectedMessageForMenu.sender === "Me"}
          clearHighlight={() => setHighlightedMessageId(null)}
          onDeleteChat={async () => {
            if (!selectedMessageForMenu) return;
            await deleteMessage(selectedMessageForMenu.id);
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== selectedMessageForMenu.id)
            );
            closeLongPressMenuWrapper();

            const updatedMessages = await fetchMessagesByConversation(
              conversationId
            );
            const lastMsg = updatedMessages[updatedMessages.length - 1];
            if (lastMsg) {
              addOrUpdateChat({
                id: conversationId,
                name,
                message:
                  lastMsg.text ||
                  lastMsg.imageUrl ||
                  lastMsg.videoUrl ||
                  "Attachment",
                time: lastMsg.createdAt
                  ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "",
                avatar,
              });
            }
          }}
        />
      )}

      {/* Info Window */}
      <MessageInfoWindow
        message={infoMessage}
        onClose={() => setInfoMessage(null)}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ImageBackground
          style={styles.chatBackground}
          source={{ uri: "https://via.placeholder.com/400" }}
          {...keyboardDismissPanResponder.panHandlers}
        >
          {menuVisible && (
            <BlurView
              style={StyleSheet.absoluteFill}
              intensity={1000}
              tint={currentTheme === "dark" ? "dark" : "light"}
            />
          )}
          {isLoading ? (
            <ActivityIndicator size="large" color="#999" style={{ flex: 1 }} />
          ) : (
            <FlatList
              ref={flatListRef}
              data={dataWithSeparators}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.flatListContent}
              scrollEnabled={scrollEnabled}
              extraData={[
                replyMessage,
                selectedMessages,
                isSelectionMode,
                highlightedMessageId,
              ]}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.1}
              inverted
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10,
              }}
            />
          )}

          {/* Reply Container */}
          {replyMessage && !isSelectionMode && (
            <View style={styles.replyContainer}>
              <View style={{ flex: 1 }}>
                <Text style={styles.replyingToUser}>
                  Replying to{" "}
                  {replyMessage.sender?.toLowerCase() ===
                  userAddress?.toLowerCase()
                    ? "You"
                    : name}
                </Text>
                <Text style={styles.replyPreviewText} numberOfLines={1}>
                  {replyMessage.text ||
                    (replyMessage.imageUrl ? "Image" : "Video")}
                </Text>
              </View>
              <TouchableOpacity onPress={cancelReply}>
                <Ionicons name="close-circle" size={22} color="#999" />
              </TouchableOpacity>
            </View>
          )}

          {/* Attachment Preview */}
          {attachment && !isSelectionMode && (
            <View style={styles.previewContainer}>
              {attachment.imageUrl && (
                <Image
                  source={{ uri: attachment.imageUrl }}
                  style={{ width: 100, height: 100, borderRadius: 8 }}
                />
              )}
              {attachment.videoUrl && (
                <Video
                  source={{ uri: attachment.videoUrl }}
                  style={{ width: 100, height: 100, borderRadius: 8 }}
                  resizeMode={ResizeMode.COVER}
                  useNativeControls
                />
              )}
              <TouchableOpacity
                onPress={clearAttachmentPreview}
                style={{ position: "absolute", top: 5, right: 5 }}
              >
                <Ionicons name="close-circle" size={24} color="red" />
              </TouchableOpacity>
            </View>
          )}

          {/* Full Screen Media Modal */}
          {(selectedImage || selectedVideo) && (
            <Modal visible transparent animationType="fade">
              <View
                style={styles.modalContainer}
                {...modalPanResponder.panHandlers}
              >
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
          {isSelectionMode ? (
            <View style={styles.selectionBottomBar}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={deleteSelectedMessagesWrapper}
                disabled={selectedMessages.size === 0}
              >
                <Ionicons name="trash" size={24} color="#FF3B30" />
                <Text style={[styles.deleteButtonText, { color: "#FF3B30" }]}>
                  Delete ({selectedMessages.size})
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.iconContainer}
                onPress={async () => {
                  const att = await handleAttachment();
                  if (att) {
                    handlerDependencies.setAttachment({
                      imageUrl: att.imageUrl,
                      videoUrl: att.videoUrl,
                    });
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
              <TouchableOpacity
                style={styles.iconContainer}
                onPress={() => console.log("Mic pressed")}
              >
                <Ionicons name="mic" size={24} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconContainer}
                onPress={handleSendMessageWrapper}
              >
                <Ionicons name="send" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          )}
        </ImageBackground>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;

const getStyles = (theme: "light" | "dark") =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === "dark" ? "#222" : "#EDEDED",
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme === "dark" ? "#222" : "#F2F2F2",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderBottomColor: theme === "dark" ? "#444" : "#ccc",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    profileTapArea: {
      flexDirection: "row",
      alignItems: "center",
    },
    backButton: {
      paddingRight: 10,
    },
    detailAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 8,
    },
    detailUserName: {
      fontSize: 20,
      color: theme === "dark" ? "#FFF" : "#000",
      left: 5,
      fontFamily: "SF-Pro-Text-Medium",
    },
    callButton: {
      padding: 5,
      marginRight: 10,
    },
    chatBackground: {
      flex: 1,
      width: "100%",
      height: "100%",
    },
    flatListContent: {
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    replyingToUser: {
      fontWeight: "bold",
      color: "#007AFF",
      fontSize: 13,
    },
    replyContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme === "dark" ? "#2C2C2E" : "#F0F0F0",
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginHorizontal: 10,
      borderLeftColor: "#007AFF",
      borderLeftWidth: 4,
      borderRadius: 8,
    },
    replyPreviewText: {
      fontSize: 14,
      color: theme === "dark" ? "#B0B0B0" : "#555",
    },
    previewContainer: {
      padding: 8,
      backgroundColor: theme === "dark" ? "#222" : "#fff",
      marginHorizontal: 10,
      borderRadius: 8,
      marginBottom: 8,
    },
    iconContainer: {
      paddingHorizontal: 8,
    },
    inputWrapper: {
      flex: 1,
      backgroundColor: theme === "dark" ? "#333" : "#fff",
      marginHorizontal: 6,
      borderRadius: 25,
      justifyContent: "center",
      paddingHorizontal: 10,
    },
    textInput: {
      paddingVertical: 8,
      fontSize: 16,
      color: theme === "dark" ? "#FFF" : "#000",
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.9)",
      justifyContent: "center",
      alignItems: "center",
    },
    fullScreenImage: {
      width: "90%",
      height: "70%",
    },
    cancelButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    cancelText: {
      fontSize: 16,
      fontWeight: "500",
      color: "#ff0000ff",
    },
    fullScreenVideo: {
      width: "90%",
      height: "70%",
    },
    modalClose: {
      position: "absolute",
      top: 40,
      right: 20,
      zIndex: 1,
    },
    dateSeparator: {
      alignSelf: "center",
      marginVertical: 10,
      backgroundColor: theme === "dark" ? "#333" : "#CCC",
      padding: 6,
      borderRadius: 10,
    },
    dateText: {
      fontSize: 12,
      fontWeight: "bold",
      color: theme === "dark" ? "#fff" : "#000",
    },
    messageBubble: {
      marginVertical: 2,
    },
    selectionIndicator: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: [{ translateY: -12 }],
      zIndex: 10,
    },
    selectionCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#007AFF",
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
    },
    selectedCircle: {
      backgroundColor: "#007AFF",
      borderColor: "#007AFF",
    },
    messageContainer: {
      marginLeft: 0,
    },
    selectionModeMessage: {
      marginLeft: 40,
    },
    selectedMessage: {
      backgroundColor:
        theme === "dark" ? "rgba(0, 122, 255, 0.1)" : "rgba(0, 122, 255, 0.05)",
      borderRadius: 8,
    },
    selectionCount: {
      fontSize: 18,
      fontWeight: "600",
      color: theme === "dark" ? "#FFF" : "#000",
      marginLeft: 10,
    },
    selectAllButton: {
      padding: 8,
    },
    selectAllText: {
      color: "#007AFF",
      fontSize: 16,
      fontWeight: "500",
    },
    bottomBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme === "dark" ? "#222" : "#EDEDED",
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: theme === "dark" ? "#444" : "#ccc",
      height: 64,
    },
    selectionBottomBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme === "dark" ? "#222" : "#EDEDED",
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: theme === "dark" ? "#444" : "#ccc",
      height: 64,
    },
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme === "dark" ? "#333" : "#F8F8F8",
      minHeight: 40,
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: "500",
      marginLeft: 8,
    },
  });
