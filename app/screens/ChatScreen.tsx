import React, { useRef, memo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReanimatedSwipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { Ionicons } from "@expo/vector-icons";
import Animated, { interpolate, useAnimatedStyle, SharedValue } from "react-native-reanimated";

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
    avatar: require("../../assets/images/favicon.png"),
  },
  {
    id: "2",
    name: "Pixsellz Team",
    message: "Hasan Web\nGIF",
    time: "9/29",
    avatar: require("../../assets/images/favicon.png"),
  },
];

const ChatItem = memo(({ item }: { item: ChatItemType }) => {
  const swipeRef = useRef<SwipeableMethods | null>(null);

  const renderRightActions = (progress: SharedValue<number>) => {
    // Using useAnimatedStyle hook to ensure safe access to sharedValue
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateX: interpolate(progress.value, [0, 1], [100, 0], {
            extrapolateRight: "clamp",
          }),
        },
      ],
      opacity: interpolate(progress.value, [0, 1], [0, 1], {
        extrapolateRight: "clamp",
      }),
    }));
  
    const handleAction = (action: string) => {
      swipeRef.current?.close?.();
      console.log(`Action: ${action} performed on ${item.name}`);
    };
  
    return (
      <Animated.View style={[styles.rightActions, animatedStyle]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#FFA500" }]}
          onPress={() => handleAction("Mute")}
        >
          <Ionicons name="volume-mute" size={20} color="white" />
          <Text style={styles.actionText}>Mute</Text>
        </TouchableOpacity>
  
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#34C759" }]}
          onPress={() => handleAction("Pin")}
        >
          <Ionicons name="pin" size={20} color="white" />
          <Text style={styles.actionText}>Pin</Text>
        </TouchableOpacity>
  
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#FF3B30" }]}
          onPress={() => handleAction("Delete")}
        >
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  

  return (
    <ReanimatedSwipeable ref={swipeRef} renderRightActions={renderRightActions}>
      <View style={styles.chatItem}>
        <Image source={item.avatar} style={styles.avatar} />
        <View style={styles.chatContent}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatMessage}>{item.message}</Text>
        </View>
        <Text style={styles.chatTime}>{item.time}</Text>
      </View>
    </ReanimatedSwipeable>
  );
});

const ChatScreen = () => (
  <GestureHandlerRootView style={styles.container}>
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#888" />
      <TextInput placeholder="Search for messages or users" style={styles.searchInput} />
    </View>
    <FlatList
      data={chats}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ChatItem item={item} />}
    />
  </GestureHandlerRootView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DDDDDD",
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderRadius: 15,
    marginBottom: 12,
    marginTop: 60,
    marginLeft: 20,
    marginRight: 20,
  },
  searchInput: { flex: 1, marginLeft: 8 },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  chatContent: { flex: 1 },
  chatName: { fontWeight: "bold", fontSize: 16 },
  chatMessage: { color: "#777" },
  chatTime: { color: "#777", fontSize: 12 },
  rightActions: { flexDirection: "row", alignItems: "center" },
  actionButton: {
    width: 75,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 22,
  },
  actionText: { color: "white", fontSize: 12, fontWeight: "bold" },
});

export default ChatScreen;
