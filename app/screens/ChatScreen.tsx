// ChatScreen.tsx
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  interpolate,
  useAnimatedStyle,
  SharedValue,
} from "react-native-reanimated";
import { useThemeToggle } from "../../utils/GlobalUtils/ThemeProvider";
import { triggerLightHapticFeedback } from "../../utils/GlobalUtils/HapticFeedback";
import { ChatItemType } from "../../utils/ChatUtils/ChatItemsTypes";
import { onRefresh } from "../../utils/ChatUtils/RefreshChats";
import { handlePin } from "../../utils/ChatUtils/OnPin";
import { searchUser } from '../../backend/decentralized-database/SearchUser';

const chats: ChatItemType[] = [
  { id: "1", name: "Saved Messages", message: "image.jpeg", time: "Fri", avatar: require("../../assets/images/default-user-avatar.jpg") },
  { id: "2", name: "Ahmed", message: "How u doin", time: "9/29", avatar: require("../../assets/images/default-user-avatar.jpg") },
  { id: "3", name: "Faik", message: "Sent image.jpeg", time: "Yesterday", avatar: require("../../assets/images/default-user-avatar.jpg") },
  { id: "4", name: "Babar", message: "wyd?", time: "1/20", avatar: require("../../assets/images/default-user-avatar.jpg") },
  { id: "5", name: "Hamza", message: "see u on sunday then", time: "02:20", avatar: require("../../assets/images/default-user-avatar.jpg") },
  { id: "6", name: "Hazim", message: "k ill do it", time: "6/09", avatar: require("../../assets/images/default-user-avatar.jpg") },
  { id: "7", name: "Zee", message: "lol", time: "Sat", avatar: require("../../assets/images/default-user-avatar.jpg") },
  { id: "8", name: "Zain", message: "tc bye", time: "Mon", avatar: require("../../assets/images/default-user-avatar.jpg") },
  { id: "9", name: "Faru", message: "ok bye", time: "Sat", avatar: require("../../assets/images/default-user-avatar.jpg") },
  { id: "10", name: "Mom", message: "do it", time: "11/01", avatar: require("../../assets/images/default-user-avatar.jpg") },
  { id: "11", name: "Zaid", message: "bgmi?", time: "Thu", avatar: require("../../assets/images/default-user-avatar.jpg") },
  { id: "12", name: "Waseem", message: "hi...", time: "Tue", avatar: require("../../assets/images/default-user-avatar.jpg") },
  // More chat items...
];

interface ChatItemProps {
  item: ChatItemType;
  swipeRefs: React.MutableRefObject<{ [key: string]: SwipeableMethods | null }>;
  onSwipe: (id: string) => void;
  onPin: () => void;
  isPinned: boolean;
  onPress: (item: ChatItemType) => void;
}

const RightActions = ({ progress, onAction, isPinned, styles }: { 
  progress: SharedValue<number>, 
  onAction: (action: string) => void, 
  isPinned: boolean,
  styles: any 
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const animatedTranslateX = interpolate(
      progress.value,
      [0, 1],
      [100, 0],
      { extrapolateRight: "clamp" }
    );
    return { transform: [{ translateX: animatedTranslateX }] };
  });

  return (
    <Animated.View style={[styles.rightActions, animatedStyle]}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: "#F09A37" }]}
        onPress={() => onAction("Mute")}
      >
        <Image 
          source={require("../../assets/images/mute.png")} 
          style={{ width: 30, height: 30, resizeMode: "contain" }} 
        />
        <Text style={styles.actionText}>Mute</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: isPinned ? "#999" : "#1EBE1E" }]}
        onPress={() => onAction("Pin")}
      >
        <Image 
          source={require("../../assets/images/pin.png")} 
          style={{ width: 30, height: 30, resizeMode: "contain" }} 
        />
        <Text style={styles.actionText}>{isPinned ? "Unpin" : "Pin"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: "#FE3B30" }]}
        onPress={() => onAction("Delete")}
      >
        <Image 
          source={require("../../assets/images/delete.png")} 
          style={{ width: 30, height: 30, resizeMode: "contain" }} 
        />
        <Text style={styles.actionText}>Delete</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ChatItem = memo(
  ({ item, swipeRefs, onSwipe, onPin, isPinned, onPress }: ChatItemProps) => {
    const { currentTheme } = useThemeToggle();
    const isDarkMode = currentTheme === "dark";
    const styles = createStyles(isDarkMode);
    const isSwiping = useRef(false);

    const renderRightActions = (progress: SharedValue<number>) => {
      const handleAction = (action: string) => {
        swipeRefs.current[item.id]?.close?.();
        console.log(`Action: ${action} performed on ${item.name}`);
        if (action === "Pin") {
          onPin();
        }
      };

      return <RightActions progress={progress} onAction={handleAction} isPinned={isPinned} styles={styles} />;
    };

    return (
      <ReanimatedSwipeable
        ref={ref => { swipeRefs.current[item.id] = ref; }}
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
              swipeRefs.current[item.id]?.close?.();
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
              <Text style={styles.chatMessage}>{item.message}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
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
  const swipeRefs = useRef<{ [key: string]: SwipeableMethods | null }>({});
  const { currentTheme, toggleTheme } = useThemeToggle();
  const isDarkMode = currentTheme === "dark";
  const styles = createStyles(isDarkMode);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [chatList, setChatList] = useState<ChatItemType[]>(chats);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredChats, setFilteredChats] = useState<ChatItemType[]>(chats);
  const [searchError, setSearchError] = useState("");

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Add useEffect to handle chat filtering
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChats(chatList);
      setSearchError("");
    } else {
      // Always filter chats while searching
      const filtered = chatList.filter(chat => 
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
      // Don't show error for local chat searches
      setSearchError("");
    }
  }, [searchQuery, chatList]);

  const handleSearch = async (query: string) => {
    setSearchError(""); // Clear any previous error
    // Check if the query looks like a wallet address (starts with 0x and has 42 characters)
    if (query.startsWith('0x') && query.length >= 15) {
      try {
        // Search for user in Gun.js database
        const user = await searchUser(query);
        if (!user || !user.walletAddress) {
          setSearchError("User not found");
          return;
        }
        // Navigate to UserProfile with the found user's wallet address
        navigation.navigate('UserProfile', { walletAddress: query });
      } catch (error) {
        // console.error("❌ User not found:", error);
        setSearchError("User not found");
      }
    }
  };

  const handleSwipe = (id: string) => {
    Object.keys(swipeRefs.current).forEach((key) => {
      if (key !== id) {
        swipeRefs.current[key]?.close?.();
      }
    });
  };

  const onPinChat = (id: string) => {
    handlePin(id, setPinnedChats, setChatList);
  };

  const handleChatPress = (item: ChatItemType) => {
    navigation.push("ChatDetail", { 
      conversationId: item.id, 
      name: item.name, 
      avatar: item.avatar 
    });
  };

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
            triggerLightHapticFeedback();
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
                  onPress={() => {
                    setSearchQuery("");
                    setFilteredChats(chatList);
                    setSearchError("");
                  }}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
    avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
    chatContent: { flex: 1 },
    chatName: { 
      fontWeight: "bold", 
      fontSize: 18, 
      fontFamily: "SF-Pro-Text-Medium",
      bottom: 7,
      color: isDarkMode ? "#fff" : "#000" 
    },
    chatMessage: { 
      color: isDarkMode ? "#aaa" : "#777",
      fontFamily: "SF-Pro-Text-Regular",
      fontSize: 15,
      bottom: 4
    },
    chatTime: { 
      color: isDarkMode ? "#aaa" : "#777", 
      fontSize: 14,
      marginBottom: 30,
      top: 5
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
      fontFamily: "SF-Pro-Text-Regular",
    },
  });

export default Chats;
