/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// screens/ChatScreen.tsx
import React, { useRef, memo, useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  RefreshControl,
  View,
  Text,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { Ionicons } from "@expo/vector-icons";
import { SharedValue } from "react-native-reanimated";
import { useThemeToggle } from "../../utils/GlobalUtils/ThemeProvider";
import { triggerTapHapticFeedback } from "../../utils/GlobalUtils/TapHapticFeedback";
import { ChatItemType } from "../../utils/ChatUtils/ChatItemsTypes";
import { searchUser } from "../../backend/Supabase/SearchUser";
import RightActions, { SwipeAction } from "../../utils/ChatUtils/RightActions";
import { useChat, EventBus } from "../../utils/ChatUtils/ChatContext";
import { handleDeleteChat } from "../../utils/ChatUtils/DeleteChat";
import {
  loadChatProfiles,
  UserProfileCache,
} from "../../utils/ChatUtils/HandleRefresh";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUnreadMessageCounts } from "../../backend/Local database/SQLite/GetUnreadCounts";
import { markMessagesAsRead } from "../../backend/Local database/SQLite/MarkMessagesAsRead";

interface ChatItemProps {
  item: ChatItemType;
  currentName: string;
  currentAvatar: any;
  swipeRefs: { current: { [key: string]: SwipeableMethods | null } };
  onSwipe: (id: string) => void;
  onPin: () => void;
  onDelete: () => void;
  isPinned: boolean;
  onPress: (item: ChatItemType) => void;
  unreadCount?: number;
}

const ChatItem = memo(
  ({
    item,
    currentName,
    currentAvatar,
    swipeRefs,
    onSwipe,
    onPin,
    onDelete,
    isPinned,
    onPress,
    unreadCount = 0,
  }: ChatItemProps) => {
    const { currentTheme } = useThemeToggle();
    const isDarkMode = currentTheme === "dark";
    const styles = createStyles(isDarkMode);
    const isSwiping = useRef(false);

    const renderRightActions = (progress: SharedValue<number>) => {
      const handleAction = (action: SwipeAction) => {
        if (swipeRefs.current) {
          swipeRefs.current[item.id]?.close?.();
        }
        if (action === "Pin") onPin();
        else if (action === "Delete") onDelete();
        else if (action === "Mute")
          console.log(`Mute action for ${currentName}`);
      };

      return (
        <RightActions
          progress={progress}
          onAction={handleAction}
          isPinned={isPinned}
          styles={{
            rightActions: styles.rightActions,
            actionButton: styles.actionButton,
            actionText: styles.actionText,
          }}
        />
      );
    };

    return (
      <ReanimatedSwipeable
        ref={(ref) => {
          if (ref && swipeRefs.current) swipeRefs.current[item.id] = ref;
        }}
        renderRightActions={renderRightActions}
        overshootRight={false}
        onSwipeableWillOpen={() => {
          isSwiping.current = true;
          onSwipe(item.id);
        }}
        onSwipeableClose={() => {
          isSwiping.current = false;
        }}
      >
        <TouchableOpacity
          delayPressIn={200}
          onPress={() => {
            if (!isSwiping.current) {
              onPress({ ...item, name: currentName, avatar: currentAvatar });
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.chatItem}>
            <View style={styles.avatarContainer}>
              <Image source={currentAvatar} style={styles.avatar} />
              {/* Unread badge */}
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount.toString()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.chatContent}>
              <Text
                style={[
                  styles.chatName,
                  unreadCount > 0 && styles.chatNameUnread,
                ]}
              >
                {currentName}
              </Text>
              <Text
                style={[
                  styles.chatMessage,
                  unreadCount > 0 && styles.chatMessageUnread,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.message}
              </Text>
            </View>
            <View style={styles.chatTimeContainer}>
              <Text
                style={[
                  styles.chatTime,
                  unreadCount > 0 && styles.chatTimeUnread,
                ]}
              >
                {item.time}
              </Text>
              {isPinned && (
                <Image
                  source={require("../../assets/images/pinned-logo-white.png")}
                  style={styles.pinned}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </ReanimatedSwipeable>
    );
  }
);

const Chats = () => {
  const { chatList, pinnedChats, togglePinChat, deleteChat, isLoading } =
    useChat();
  const swipeRefs = useRef<{ [key: string]: SwipeableMethods | null }>({});
  const { currentTheme, toggleTheme } = useThemeToggle();
  const isDarkMode = currentTheme === "dark";
  const styles = createStyles(isDarkMode);

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadWalletAddress = async () => {
      const address = await AsyncStorage.getItem("walletAddress");
      setWalletAddress(address);
    };
    loadWalletAddress();
  }, []);

  // Function to load unread counts from SQLite
  const loadUnreadCounts = useCallback(async () => {
    try {
      console.log("📊 Loading unread message counts...");
      const counts = await getUnreadMessageCounts();
      setUnreadCounts(counts);
      console.log("✅ Unread counts loaded:", counts);
    } catch (error) {
      console.error("❌ Failed to load unread counts:", error);
    }
  }, []);

  // Load unread counts when component mounts
  useEffect(() => {
    loadUnreadCounts();
  }, [loadUnreadCounts]);

  // Refresh unread counts when screen comes into focus (when returning from ChatDetail)
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Chat screen focused, refreshing unread counts...");
      loadUnreadCounts();
    }, [loadUnreadCounts])
  );

  // Listen for new messages to update unread counts
  useEffect(() => {
    const handleNewMessage = () => {
      console.log("🔔 New message received, updating unread counts...");
      loadUnreadCounts();
    };

    EventBus.on("new-message", handleNewMessage);
    return () => {
      EventBus.off("new-message", handleNewMessage);
    };
  }, [loadUnreadCounts]);

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredChats, setFilteredChats] = useState<ChatItemType[]>([]);
  const [searchError, setSearchError] = useState("");
  const [profileData, setProfileData] = useState<
    Record<string, UserProfileCache>
  >({});
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleRefresh = useCallback(async () => {
    console.log("🔄 Pull-to-refresh triggered");
    setRefreshing(true);
    try {
      const newProfileData = await loadChatProfiles(chatList);
      setProfileData((prevData) => ({ ...prevData, ...newProfileData }));
      await loadUnreadCounts(); // Refresh unread counts
      console.log("✅ Pull-to-refresh completed");
    } catch (error) {
      console.error("❌ Pull-to-refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [chatList, loadUnreadCounts]);

  useEffect(() => {
    const performInitialFetch = async () => {
      console.log("🔄 Performing initial profile fetch...");
      try {
        const newProfileData = await loadChatProfiles(chatList);
        setProfileData((prevData) => ({ ...prevData, ...newProfileData }));
        setInitialFetchDone(true);
        console.log("✅ Initial profile fetch completed");
      } catch (error) {
        console.error("❌ Initial profile fetch failed:", error);
        setInitialFetchDone(true);
      }
    };

    if (!isLoading && chatList.length > 0 && !initialFetchDone) {
      performInitialFetch();
    }
  }, [isLoading, chatList, initialFetchDone]);

  useEffect(() => {
    const initialProfiles: Record<string, UserProfileCache> = {};
    chatList.forEach((chat) => {
      initialProfiles[chat.id] = {
        name: chat.name,
        avatar: chat.avatar?.uri || null,
      };
    });
    setProfileData((prevData) => ({ ...prevData, ...initialProfiles }));

    if (searchQuery.trim() === "") {
      setFilteredChats(chatList);
      setSearchError("");
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = chatList.filter((chat) => {
        const currentName = profileData[chat.id]?.name || chat.name;
        return currentName.toLowerCase().includes(lowercasedQuery);
      });
      setFilteredChats(filtered);
    }
  }, [searchQuery, chatList]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    const user = await searchUser(query.trim());
    if (!user) {
      setSearchError("User not found");
      return;
    }
    navigation.navigate("UserProfile", { walletAddress: user.wallet_address });
  };

  const handleSwipe = (id: string) => {
    Object.keys(swipeRefs.current).forEach((key) => {
      if (key !== id) swipeRefs.current[key]?.close?.();
    });
  };

  const handleChatPress = async (item: ChatItemType) => {
    const currentProfile = profileData[item.id];
    const name = currentProfile?.name || item.name;
    const avatar = currentProfile?.avatar
      ? { uri: currentProfile.avatar }
      : item.avatar;

    // Clear unread count immediately when opening chat (for immediate UI feedback)
    if (unreadCounts[item.id] > 0) {
      setUnreadCounts((prev) => ({ ...prev, [item.id]: 0 }));
    }

    navigation.push("ChatDetail", {
      conversationId: item.id,
      name: name,
      avatar: avatar,
    });
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.headerContainer}>
        <Image
          source={
            isDarkMode
              ? require("../../assets/images/logo-white.png")
              : require("../../assets/images/logo-black.png")
          }
          style={styles.chatAppLogo}
        />
        <Text style={styles.nodeLinkName}>NodeLink</Text>
        <TouchableOpacity
          onPress={() => {
            toggleTheme();
            triggerTapHapticFeedback();
          }}
          style={styles.themeIconContainer}
        >
          <Ionicons
            name={isDarkMode ? "moon" : "sunny"}
            size={24}
            color={isDarkMode ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const currentProfile = profileData[item.id];
          const name = currentProfile?.name || item.name;
          const avatar = currentProfile?.avatar
            ? { uri: currentProfile.avatar }
            : item.avatar;
          const unreadCount = unreadCounts[item.id] || 0;

          return (
            <ChatItem
              item={item}
              currentName={name}
              currentAvatar={avatar}
              swipeRefs={swipeRefs}
              onSwipe={handleSwipe}
              onPin={() => togglePinChat(item.id)}
              onDelete={() =>
                handleDeleteChat(item.id, name, () => deleteChat(item.id))
              }
              isPinned={pinnedChats.includes(item.id)}
              onPress={handleChatPress}
              unreadCount={unreadCount}
            />
          );
        }}
        ListHeaderComponent={
          <View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#888" />
              <TextInput
                placeholder="Search..."
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setSearchError("");
                }}
                onSubmitEditing={() => handleSearch(searchQuery)}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#888" />
                </TouchableOpacity>
              )}
            </View>
            {searchError ? (
              <Text
                style={[
                  styles.errorText,
                  { color: isDarkMode ? "#ff6b6b" : "#ff0000" },
                ]}
              >
                {searchError}
              </Text>
            ) : null}
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </GestureHandlerRootView>
  );
};

const createStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1C1C1D" : "#F1F1F1",
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 55,
      marginBottom: 10,
      position: "relative",
    },
    chatAppLogo: {
      width: 40,
      height: 40,
      resizeMode: "contain",
      position: "absolute",
      left: 20,
    },
    nodeLinkName: {
      fontSize: 25,
      fontWeight: "bold",
      fontFamily: "MontserratAlternates-Regular",
      color: isDarkMode ? "#FFFFFF" : "#000",
    },
    themeIconContainer: {
      position: "absolute",
      right: 20,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#6666" : "#D1D1D3",
      paddingHorizontal: 30,
      paddingVertical: 8,
      borderRadius: 15,
      marginBottom: 12,
      marginTop: 10,
      marginLeft: 20,
      marginRight: 20,
    },
    searchInput: {
      fontSize: 17,
      flex: 1,
      fontFamily: "SF-Pro-Text-Regular",
      marginLeft: 15,
      color: isDarkMode ? "#fff" : "#000",
    },
    clearButton: {
      padding: 5,
    },
    chatItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      paddingLeft: 15,
      borderBottomWidth: 1,
      borderColor: isDarkMode ? "#333" : "#ddd",
      backgroundColor: isDarkMode ? "#121212" : "#fff",
      minHeight: 80,
      maxHeight: 80,
    },
    avatarContainer: {
      position: "relative",
      marginRight: 12,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    unreadBadge: {
      position: "absolute",
      top: -5,
      right: -5,
      backgroundColor: "#FF3B30",
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: isDarkMode ? "#121212" : "#fff",
    },
    unreadBadgeText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "bold",
      textAlign: "center",
    },
    chatContent: {
      flex: 1,
      flexShrink: 1,
      flexGrow: 1,
      justifyContent: "center",
    },
    chatName: {
      fontWeight: "bold",
      fontSize: 18,
      fontFamily: "SF-Pro-Text-Medium",
      bottom: 5,
      color: isDarkMode ? "#fff" : "#000",
    },
    chatNameUnread: {
      fontWeight: "800", // Make bolder for unread
    },
    chatMessage: {
      color: isDarkMode ? "#aaa" : "#777",
      fontFamily: "SF-Pro-Text-Regular",
      fontSize: 12,
      bottom: 0,
    },
    chatMessageUnread: {
      color: isDarkMode ? "#fff" : "#000",
      fontWeight: "600", // Make bolder for unread
    },
    chatTimeContainer: {
      alignItems: "flex-end",
      marginLeft: 10,
      flexShrink: 0,
    },
    chatTime: {
      color: isDarkMode ? "#aaa" : "#777",
      fontSize: 14,
      marginBottom: 30,
      top: 5,
    },
    chatTimeUnread: {
      color: "#007AFF",
      fontWeight: "600",
    },
    rightActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    actionButton: {
      width: 75,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 22,
      flexDirection: "column",
    },
    pinned: {
      width: 25,
      height: 25,
      bottom: 15,
    },
    actionText: {
      color: "white",
      fontSize: 12,
      fontWeight: "bold",
      marginTop: -5,
      bottom: -10,
    },
    errorText: {
      marginLeft: 35,
      marginTop: 5,
      fontSize: 14,
      fontFamily: "SF-Pro-Text-Regular",
    },
  });

export default Chats;
