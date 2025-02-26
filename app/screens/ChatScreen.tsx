import { StyleSheet } from "react-native";
import React, { useRef, memo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReanimatedSwipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { Ionicons } from "@expo/vector-icons";
import {
  interpolate,
  useAnimatedStyle,
  SharedValue,
} from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { useColorScheme } from "react-native";

interface ChatItemType {
  id: string;
  name: string;
  message: string;
  time: string;
  unread?: number;
  avatar: any;
}

const chats: ChatItemType[] = [
  {
    id: "1",
    name: "Saved Messages",
    message: "image.jpeg",
    time: "Fri",
    avatar: require("../../assets/images/fc.jpg"),
  },
  {
    id: "2",
    name: "two",
    message: "Hasan Web",
    time: "9/29",
    avatar: require("../../assets/images/fc.jpg"),
  },
  {
    id: "3",
    name: "three",
    message: "image.jpeg",
    time: "Fri",
    avatar: require("../../assets/images/fc.jpg"),
  },
  {
    id: "4",
    name: "four",
    message: "Hasan Web",
    time: "9/29",
    avatar: require("../../assets/images/fc.jpg"),
  },  {
    id: "5",
    name: "one",
    message: "image.jpeg",
    time: "Fri",
    avatar: require("../../assets/images/fc.jpg"),
  },
  {
    id: "6",
    name: "two",
    message: "Hasan Web",
    time: "9/29",
    avatar: require("../../assets/images/fc.jpg"),
  },
  {
    id: "7",
    name: "three",
    message: "image.jpeg",
    time: "Fri",
    avatar: require("../../assets/images/fc.jpg"),
  },
  {
    id: "8",
    name: "four",
    message: "Hasan Web",
    time: "9/29",
    avatar: require("../../assets/images/fc.jpg"),
  },  {
    id: "9",
    name: "one",
    message: "image.jpeg",
    time: "Fri",
    avatar: require("../../assets/images/fc.jpg"),
  },
  {
    id: "10",
    name: "two",
    message: "Hasan Web",
    time: "9/29",
    avatar: require("../../assets/images/fc.jpg"),
  },
  {
    id: "11",
    name: "three",
    message: "image.jpeg",
    time: "Fri",
    avatar: require("../../assets/images/fc.jpg"),
  },
  {
    id: "12",
    name: "four",
    message: "Hasan Web",
    time: "9/29",
    avatar: require("../../assets/images/fc.jpg"),
  },
  // More chat items...
];

const ChatItem = memo(({ item, swipeRefs, onSwipe, onPin, isPinned }: { 
  item: ChatItemType; 
  swipeRefs: React.MutableRefObject<{ [key: string]: SwipeableMethods | null }>; 
  onSwipe: (id: string) => void; 
  onPin: () => void;
  isPinned: boolean;
}) => {
  const isDarkMode = useColorScheme() === "dark";
  const styles = createStyles(isDarkMode);

  const renderRightActions = (progress: SharedValue<number>) => {
    const animatedStyle = useAnimatedStyle(() => {
      const animatedTranslateX = interpolate(progress.value, [0, 1], [100, 0], {
        extrapolateRight: "clamp",
      });
      return { transform: [{ translateX: animatedTranslateX }] };
    });
    
    const handleAction = (action: string) => {
      swipeRefs.current[item.id]?.close?.();
      console.log(`Action: ${action} performed on ${item.name}`);
    };

    return (
      <Animated.View style={[styles.rightActions, animatedStyle]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#F09A37" }]}
          onPress={() => handleAction("Mute")}
        >
          <Image 
            source={require("../../assets/images/mute.png")} 
            style={{ width: 30, height: 30, resizeMode: "contain" }} 
          />
          <Text style={styles.actionText}>Mute</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: isPinned ? "#999" : "#1EBE1E" }]}
          onPress={() => {
                onPin();
                handleAction("Pin")
              }
            }
           >
          <Image 
            source={require("../../assets/images/pin.png")} 
            style={{ width: 30, height: 30, resizeMode: "contain" }} 
          />
          <Text style={styles.actionText}>{isPinned ? "Unpin" : "Pin"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#FE3B30" }]}
          onPress={() => handleAction("Delete")}
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

  return (
    <ReanimatedSwipeable
      ref={(ref) => (swipeRefs.current[item.id] = ref)}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={() => onSwipe(item.id)}
    >
      <View style={styles.chatItem}>
        <Image source={item.avatar} style={styles.avatar} />
        <View style={styles.chatContent}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatMessage}>{item.message}</Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.chatTime}>{item.time}</Text>
        {isPinned && (
          <Image 
            source={require("../../assets/images/pinned-logo-white.png")} 
            style={[styles.pinned]}
            resizeMode="contain"
          />
        )}
      </View>
      </View>
      
    </ReanimatedSwipeable>
  );
});

const Chats = () => {
  const swipeRefs = useRef<{ [key: string]: SwipeableMethods | null }>({});
  const isDarkMode = useColorScheme() === "dark";
  const styles = createStyles(isDarkMode);

  const [pinnedChats, setPinnedChats] = useState<string[]>([]);

  const handleSwipe = (id: string) => {
    Object.keys(swipeRefs.current).forEach((key) => {
      if (key !== id) {
        swipeRefs.current[key]?.close?.();
      }
    });
  };

  const handlePin = (id: string) => {
    setPinnedChats((prevPinnedChats) =>
      prevPinnedChats.includes(id)
        ? prevPinnedChats.filter((chatId) => chatId !== id)
        : [...prevPinnedChats, id]
    );
  };
  const sortedChats = [...chats].sort((a, b) => (pinnedChats.includes(b.id) ? 1 : 0) - (pinnedChats.includes(a.id) ? 1 : 0));


  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.headerContainer}>
        <Image 
          source={isDarkMode ? require('../../assets/images/logo-white.png') : require('../../assets/images/logo-black.png')} 
          style={styles.chatAppLogo} 
        />
        <Text style={styles.nodeLinkName}>NodeLink</Text>
      </View>
      <FlatList
        data={sortedChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatItem 
            item={item} 
            swipeRefs={swipeRefs} 
            onSwipe={handleSwipe}
            onPin={() => handlePin(item.id)}
            isPinned={pinnedChats.includes(item.id)}
          />
        )}
        ListHeaderComponent={
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#888" />
            <TextInput placeholder="Search for messages or users" style={styles.searchInput} />
          </View>
        }
      />
    </GestureHandlerRootView>
  );
};

const createStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: isDarkMode ? "#121212" : "#fff",
    },

    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center", // Center the NodeLink text
      marginTop: 55,
      marginBottom: 10,
      position: "relative",
    },

    chatAppLogo: {
      width: 45,
      height: 45,
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
      color: isDarkMode ? "#fff" : "#999",
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

    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
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
    pinned : {
      width: 25,
      height: 25,
      bottom: 15,
    },
    actionText: { 
      color: "white", 
      fontSize: 12,
      fontWeight: "bold",
      marginTop: -5,
      bottom: -10  // 🔹 Moves text down without affecting the icon
    },
    
  });


  
export default Chats;