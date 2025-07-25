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
  ActivityIndicator,
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
import { liveSearchUsers } from "../../backend/Supabase/SearchUser";
import RightActions, { SwipeAction } from "../../utils/ChatUtils/RightActions";
import { useChat, EventBus } from "../../utils/ChatUtils/ChatContext";
import { handleDeleteChat } from "../../utils/ChatUtils/DeleteChat";
import {
  loadChatProfiles,
  UserProfileCache,
} from "../../utils/ChatUtils/HandleRefresh";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUnreadMessageCounts } from "../../backend/Local database/SQLite/GetUnreadCounts";

// Debounce utility function
const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

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

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Original states
  const [refreshing, setRefreshing] = useState(false);
  const [filteredChats, setFilteredChats] = useState<ChatItemType[]>([]);
  const [profileData, setProfileData] = useState<
    Record<string, UserProfileCache>
  >({});
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

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
      console.log("Loading unread message counts...");
      const counts = await getUnreadMessageCounts();
      setUnreadCounts(counts);
      console.log("Unread counts loaded:", counts);
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
      console.log("Chat screen focused, refreshing unread counts...");
      loadUnreadCounts();
    }, [loadUnreadCounts])
  );

  // Listen for new messages to update unread counts
  useEffect(() => {
    const handleNewMessage = () => {
      console.log("New message received, updating unread counts...");
      loadUnreadCounts();
    };

    EventBus.on("new-message", handleNewMessage);
    return () => {
      EventBus.off("new-message", handleNewMessage);
    };
  }, [loadUnreadCounts]);

  // Debounced live search function
  const debouncedLiveSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length === 0) {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        console.log(`Searching for: "${query}"`);
        const results = await liveSearchUsers(query.trim(), 8);
        setSearchResults(results);
        setShowSearchResults(true);
        setSearchError("");
        console.log(`Found ${results.length} users`);
      } catch (error) {
        console.error("❌ Live search failed:", error);
        setSearchError("Search failed. Please try again.");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300), // 300ms debounce
    []
  );

  // Handle search input change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setSearchError("");

    if (text.trim().length > 0) {
      // Show loading immediately when user starts typing
      if (!isSearching) {
        setIsSearching(true);
      }
      // Trigger live search for new users
      debouncedLiveSearch(text);
    } else {
      // Clear search results when input is empty
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
    }
  };

  // Handle search result selection
  const handleSearchResultPress = (user: any) => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setIsSearching(false);
    navigation.navigate("UserProfile", { walletAddress: user.wallet_address });
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setIsSearching(false);
    setSearchError("");
  };

  const handleRefresh = useCallback(async () => {
    console.log("Pull-to-refresh triggered");
    setRefreshing(true);
    try {
      const newProfileData = await loadChatProfiles(chatList);
      setProfileData((prevData) => ({ ...prevData, ...newProfileData }));
      await loadUnreadCounts(); // Refresh unread counts
    } catch (error) {
      console.error("❌ Pull-to-refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [chatList, loadUnreadCounts]);

  useEffect(() => {
    const performInitialFetch = async () => {
      console.log("-----Performing initial profile fetch...");
      try {
        const newProfileData = await loadChatProfiles(chatList);
        setProfileData((prevData) => ({ ...prevData, ...newProfileData }));
        setInitialFetchDone(true);
        console.log("Initial profile fetch completed");
      } catch (error) {
        console.error("❌ Initial profile fetch failed:", error);
        setInitialFetchDone(true);
      }
    };

    if (!isLoading && chatList.length > 0 && !initialFetchDone) {
      performInitialFetch();
    }
  }, [isLoading, chatList, initialFetchDone]);

  // Handle initial profile data setup (only when chatList changes)
  useEffect(() => {
    const initialProfiles: Record<string, UserProfileCache> = {};
    let hasNewProfiles = false;

    chatList.forEach((chat) => {
      if (!profileData[chat.id]) {
        initialProfiles[chat.id] = {
          name: chat.name,
          avatar: chat.avatar?.uri || null,
        };
        hasNewProfiles = true;
      }
    });

    if (hasNewProfiles) {
      setProfileData((prevData) => ({ ...prevData, ...initialProfiles }));
    }
  }, [chatList]); // Only depend on chatList changes

  // Handle chat filtering (when search query changes)
  useEffect(() => {
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
  }, [searchQuery, chatList, profileData]); // Keep profileData here since we need it for filtering

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

  // Update your SearchResults component to use dynamic styling
  const SearchResults = () => {
    if (!showSearchResults || (searchQuery.trim().length === 0 && !isSearching))
      return null;

    // Calculate dynamic height based on results
    const getContainerHeight = () => {
      if (isSearching) return 80; // Height for loading state
      if (searchResults.length === 0) return 120; // Height for no results

      // Calculate based on number of results (each item ~70px + padding)
      const itemHeight = 70;
      const maxItems = 5; // Show max 5 items before scrolling
      const actualItems = Math.min(searchResults.length, maxItems);
      return actualItems * itemHeight + 20; // +20 for padding
    };

    const dynamicStyles = StyleSheet.create({
      dynamicContainer: {
        ...styles.searchResultsContainer,
        height: getContainerHeight(),
        overflow: "hidden",
        maxHeight: searchResults.length > 5 ? 370 : undefined, // Only limit if more than 5 items
      },
    });

    return (
      <View style={dynamicStyles.dynamicContainer}>
        {/* Your existing content */}
        {isSearching && (
          <View style={styles.searchLoadingContainer}>
            <ActivityIndicator
              size="small"
              color={isDarkMode ? "#007AFF" : "#007AFF"}
            />
            <Text style={styles.searchLoadingText}>Searching users...</Text>
          </View>
        )}

        {!isSearching &&
          searchResults.length === 0 &&
          searchQuery.trim().length > 0 && (
            <View style={styles.noResultsContainer}>
              <Ionicons
                name="search"
                size={24}
                color={isDarkMode ? "#8E8E93" : "#6D6D80"}
              />
              <Text style={styles.noResultsText}>
                No users found for &quot;{searchQuery}&quot;
              </Text>
              <Text style={styles.noResultsSubtext}>
                Try searching with @username or wallet address
              </Text>
            </View>
          )}

        {!isSearching && searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.wallet_address || item.username}
            renderItem={({ item, index }) => {
              // Your existing renderItem logic
              const isUsernameSearch = searchQuery.startsWith("@");
              const isWalletSearch =
                searchQuery.length > 10 &&
                (searchQuery.startsWith("0x") || searchQuery.includes("..."));

              let primaryText = "";
              let secondaryText = "";

              if (isUsernameSearch) {
                primaryText = item.name || item.username;
                secondaryText = `@${item.username}`;
              } else if (isWalletSearch) {
                primaryText = item.name || item.username;
                secondaryText = `${item.wallet_address.substring(
                  0,
                  6
                )}...${item.wallet_address.substring(
                  item.wallet_address.length - 4
                )}`;
              } else {
                primaryText = item.name || item.username;
                secondaryText = `@${item.username}`;
              }

              // Check if this is the last item
              const isLastItem = index === searchResults.length - 1;

              return (
                <TouchableOpacity
                  style={[
                    styles.searchResultItem,
                    isLastItem && styles.searchResultItemLast, // Remove border for last item
                  ]}
                  onPress={() => handleSearchResultPress(item)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={
                      item.avatar
                        ? { uri: item.avatar }
                        : require("../../assets/images/default-user-avatar.jpg")
                    }
                    style={styles.searchResultAvatar}
                  />
                  <View style={styles.searchResultContent}>
                    <Text style={styles.searchResultName}>{primaryText}</Text>
                    <Text style={styles.searchResultUsername}>
                      {secondaryText}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isDarkMode ? "#8E8E93" : "#6D6D80"}
                  />
                </TouchableOpacity>
              );
            }}
            scrollEnabled={searchResults.length > 5} // Only enable scroll if more than 5 items
            style={styles.searchResultsList}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true} // Important for nested FlatList
          />
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => {
            // Go back to base chats page
            clearSearch();
            triggerTapHapticFeedback();
          }}
          style={styles.logoTouchable}
          activeOpacity={0.7}
        >
          <Image
            source={
              isDarkMode
                ? require("../../assets/images/logo-white.png")
                : require("../../assets/images/logo-black.png")
            }
            style={styles.chatAppLogo}
          />
        </TouchableOpacity>
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
        data={showSearchResults ? [] : filteredChats} // Hide chats when showing search results
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
                placeholder="Search users or chats..."
                placeholderTextColor={isDarkMode ? "#8E8E93" : "#6D6D80"}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearchChange}
                onSubmitEditing={() => {
                  if (searchResults.length > 0) {
                    handleSearchResultPress(searchResults[0]);
                  }
                }}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {(searchQuery.length > 0 || isSearching) && (
                <TouchableOpacity
                  onPress={clearSearch}
                  style={styles.clearButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={20} color="#888" />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results */}
            <SearchResults />

            {searchError ? (
              <Text style={styles.errorText}>{searchError}</Text>
            ) : null}
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        keyboardShouldPersistTaps="handled"
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
    logoTouchable: {
      position: "absolute",
      left: 20,
      padding: 5, // Add some padding for better touch area
      borderRadius: 22, // Make it circular touch area
    },
    chatAppLogo: {
      width: 40,
      height: 40,
      resizeMode: "contain",
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
      backgroundColor: isDarkMode ? "#2C2C2E" : "#E5E5E7",
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 20,
      marginBottom: 12,
      marginTop: 10,
      marginLeft: 20,
      marginRight: 20,
    },
    searchInput: {
      fontSize: 17,
      flex: 1,
      fontFamily: "SF-Pro-Text-Regular",
      marginLeft: 10,
      color: isDarkMode ? "#fff" : "#000",
      paddingVertical: 0,
    },
    clearButton: {
      padding: 5,
      marginLeft: 5,
    },
    // In your createStyles function, update the searchResultsContainer
    searchResultsContainer: {
      backgroundColor: isDarkMode ? "#2C2C2E" : "#FFFFFF",
      marginHorizontal: 20,
      marginBottom: 10,
      borderRadius: 12,
      minHeight: 60, // Add minimum height
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      overflow: "hidden",
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },

    searchLoadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    searchLoadingText: {
      color: isDarkMode ? "#FFFFFF" : "#000000",
      fontSize: 16,
      marginLeft: 10,
      fontFamily: "SF-Pro-Text-Regular",
    },
    noResultsContainer: {
      padding: 24,
      alignItems: "center",
    },
    noResultsText: {
      color: isDarkMode ? "#FFFFFF" : "#000000",
      fontSize: 16,
      fontWeight: "600",
      marginTop: 8,
      marginBottom: 4,
      textAlign: "center",
    },
    noResultsSubtext: {
      color: isDarkMode ? "#8E8E93" : "#6D6D80",
      fontSize: 14,
      textAlign: "center",
      fontFamily: "SF-Pro-Text-Regular",
    },
    searchResultItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDarkMode ? "#3C3C3E" : "#E5E5E7",
    },
    searchResultItemLast: {
      borderBottomWidth: 0, // Remove border for last item
    },
    searchResultAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 12,
    },
    searchResultContent: {
      flex: 1,
    },
    searchResultName: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#FFFFFF" : "#000000",
      marginBottom: 2,
      fontFamily: "SF-Pro-Text-Medium",
    },
    searchResultUsername: {
      fontSize: 14,
      color: isDarkMode ? "#8E8E93" : "#6D6D80",
      fontFamily: "SF-Pro-Text-Regular",
    },
    searchResultsList: {
      maxHeight: 280,
    },
    // Existing styles
    // Update these two styles in your createStyles function:
    chatItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      paddingLeft: 15,
      borderBottomWidth: StyleSheet.hairlineWidth, // Changed from 1 to StyleSheet.hairlineWidth
      borderColor: isDarkMode ? "#333" : "#ddd",
      backgroundColor: isDarkMode ? "#121212" : "#fff",
      height: 80, // Changed from minHeight/maxHeight to fixed height
    },
    rightActions: {
      flexDirection: "row",
      alignItems: "center",
      height: 80, // Match the chatItem height exactly
      borderBottomWidth: StyleSheet.hairlineWidth, // Add matching border
      borderColor: isDarkMode ? "#333" : "#ddd", // Add matching border color
      backgroundColor: isDarkMode ? "#121212" : "#fff", // Add matching background
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
    matchIndicator: {
      fontSize: 10,
      color: isDarkMode ? "#6D6D80" : "#8E8E93",
      fontStyle: "italic",
      marginTop: 2,
    },
    chatName: {
      fontWeight: "bold",
      fontSize: 18,
      fontFamily: "SF-Pro-Text-Medium",
      bottom: 5,
      color: isDarkMode ? "#fff" : "#000",
    },
    chatNameUnread: {
      fontWeight: "800",
    },
    chatMessage: {
      color: isDarkMode ? "#aaa" : "#777",
      fontFamily: "SF-Pro-Text-Regular",
      fontSize: 12,
      bottom: 0,
    },
    chatMessageUnread: {
      color: isDarkMode ? "#fff" : "#000",
      fontWeight: "600",
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
      color: isDarkMode ? "#ff6b6b" : "#ff0000",
    },
  });

export default Chats;
