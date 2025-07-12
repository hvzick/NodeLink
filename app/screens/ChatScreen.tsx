// screens/ChatScreen.tsx
import React, { useRef, memo, useState, useEffect } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReanimatedSwipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { Ionicons } from "@expo/vector-icons";
import { SharedValue } from "react-native-reanimated";
import { useThemeToggle } from "../../utils/GlobalUtils/ThemeProvider";
import { triggerTapHapticFeedback } from "../../utils/GlobalUtils/TapHapticFeedback";
import { ChatItemType } from "../../utils/ChatUtils/ChatItemsTypes";
import { searchUser } from '../../backend/Supabase/SearchUser';
import RightActions from '../../utils/ChatUtils/RightActions';
import { useChat } from '../../utils/ChatUtils/ChatContext';

interface ChatItemProps {
  item: ChatItemType;
  swipeRefs: { current: { [key: string]: SwipeableMethods | null } };
  onSwipe: (id: string) => void;
  onPin: () => void;
  isPinned: boolean;
  onPress: (item: ChatItemType) => void;
}

const ChatItem = memo(
  ({ item, swipeRefs, onSwipe, onPin, isPinned, onPress }: ChatItemProps) => {
    const { currentTheme } = useThemeToggle();
    const isDarkMode = currentTheme === "dark";
    const styles = createStyles(isDarkMode);
    const isSwiping = useRef(false);

    const renderRightActions = (progress: SharedValue<number>) => {
      const handleAction = (action: string) => {
        if (swipeRefs.current) {
            swipeRefs.current[item.id]?.close?.();
        }
        console.log(`Action: ${action} performed on ${item.name}`);
        if (action === "Pin") {
          onPin();
        }
      };

      return <RightActions
        progress={progress}
        onAction={handleAction}
        isPinned={isPinned}
        styles={{
            rightActions: styles.rightActions,
            actionButton: styles.actionButton,
            actionText: styles.actionText
        }}
      />;
    };

    return (
      <ReanimatedSwipeable
        ref={ref => { if (ref && swipeRefs.current) swipeRefs.current[item.id] = ref; }}
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
              if (swipeRefs.current) {
                  swipeRefs.current[item.id]?.close?.();
              }
              onPress(item);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.chatItem}>
            <Image
              source={item.avatar}
              style={styles.avatar}
            />
            <View style={styles.chatContent}>
              <Text style={styles.chatName}>{item.name}</Text>
              <Text style={styles.chatMessage} numberOfLines={1} ellipsizeMode="tail">
                {item.message}
              </Text>
            </View>
            <View style={styles.chatTimeContainer}>
              <Text style={styles.chatTime}>{item.time}</Text>
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
  // Destructure isLoading from the useChat hook
  const { chatList, pinnedChats, togglePinChat, isLoading } = useChat();

  const swipeRefs = useRef<{ [key: string]: SwipeableMethods | null }>({});
  const { currentTheme, toggleTheme } = useThemeToggle();
  const isDarkMode = currentTheme === "dark";
  const styles = createStyles(isDarkMode);

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredChats, setFilteredChats] = useState<ChatItemType[]>([]);
  const [searchError, setSearchError] = useState("");

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    // This effect correctly updates the local filtered list whenever the
    // main chatList from the context changes.
    if (searchQuery.trim() === "") {
      setFilteredChats(chatList);
      setSearchError("");
    } else {
      const filtered = chatList.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
      setSearchError("");
    }
  }, [searchQuery, chatList]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    const user = await searchUser(query.trim());
    if (!user) {
      setSearchError("User not found");
      return;
    }
    navigation.navigate("UserProfile", {
      walletAddress: user.wallet_address,
    });
  };

  const handleSwipe = (id: string) => {
    Object.keys(swipeRefs.current).forEach((key) => {
      if (key !== id) {
        swipeRefs.current[key]?.close?.();
      }
    });
  };

  const onPinChat = (id: string) => {
    togglePinChat(id);
  };

  const handleChatPress = (item: ChatItemType) => {
    navigation.push("ChatDetail", {
      conversationId: item.id,
      name: item.name,
      avatar: item.avatar
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // You can add logic here to refetch from a server.
    // The context will handle loading from local storage automatically.
    setTimeout(() => {
        setRefreshing(false);
    }, 1000);
  };
  
  // Conditionally render a loading indicator
  if (isLoading) {
    return (
        <View style={[styles.container, styles.centered]}>
            <ActivityIndicator size="large" color={isDarkMode ? "#FFFFFF" : "#000000"} />
        </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.headerContainer}>
        <Image
          source={isDarkMode ? require('../../assets/images/logo-white.png') : require('../../assets/images/logo-black.png')}
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
          <Ionicons name={isDarkMode ? "moon" : "sunny"} size={24} color={isDarkMode ? "#FFF" : "#000"} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatItem
            item={item}
            swipeRefs={swipeRefs}
            onSwipe={handleSwipe}
            onPin={() => onPinChat(item.id)}
            isPinned={pinnedChats.includes(item.id)}
            onPress={handleChatPress}
          />
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#888" />
              <TextInput
                placeholder="Search for messages, users, or enter wallet address"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setSearchError("");
                }}
                onSubmitEditing={() => handleSearch(searchQuery)}
                returnKeyType="search"
                blurOnSubmit={false}
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
              <Text style={[styles.errorText, { color: isDarkMode ? '#ff6b6b' : '#ff0000' }]}>
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
    centered: { // Added for the loading indicator
        justifyContent: 'center',
        alignItems: 'center',
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
    avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
    chatContent: {
      flex: 1,
      flexShrink: 1,
      flexGrow: 1,
      justifyContent: 'center',
    },
    chatName: {
      fontWeight: "bold",
      fontSize: 18,
      fontFamily:  "SF-Pro-Text-Medium",
      bottom: 7,
      color: isDarkMode ? "#fff" : "#000"
    },
    chatMessage: {
      color: isDarkMode ? "#aaa" : "#777",
      fontFamily:  "SF-Pro-Text-Regular",
      fontSize: 15,
      bottom: 4,
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
    rightActions: { flexDirection: "row", alignItems: "center" },
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
      bottom: -10
    },
    errorText: {
      marginLeft: 35,
      marginTop: 5,
      fontSize: 14,
      fontFamily:  "SF-Pro-Text-Regular",
    },
  });

export default Chats;