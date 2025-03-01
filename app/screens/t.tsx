// ChatDetailScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ImageBackground,
  Image,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

type RootStackParamList = {
  ChatDetail: { conversationId: string; name: string; avatar: any };
};

type ChatDetailRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;
type ChatDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ChatDetail'>;

type Props = {
  route: ChatDetailRouteProp;
  navigation: ChatDetailNavigationProp;
};

type Message = {
  id: string;
  sender: string;
  text?: string;
  timestamp: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: string;
};

function getInitialMessages(name: string): Message[] {
  return [
    { id: '1', sender: 'Me', text: 'Hey!', timestamp: '10:00' },
    { id: '2', sender: name, text: 'Hello!', timestamp: '10:01' },
    // ... more messages ...
  ];
}

const ChatDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { conversationId, name, avatar } = route.params;
  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages(name));
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const newId = (messages.length + 1).toString();
    const newMsg: Message = {
      id: newId,
      sender: 'Me',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'Me';
    return (
      <View style={[styles.messageContainer, isMe ? styles.messageRight : styles.messageLeft]}>
        {/* Removed sender name rendering */}
        {item.imageUrl && (
          <View style={styles.imageBubble}>
            <Image source={{ uri: item.imageUrl }} style={styles.chatImage} />
            {item.fileName && (
              <Text style={styles.fileText}>
                {item.fileName} ({item.fileSize})
              </Text>
            )}
          </View>
        )}
        {item.text && <Text style={styles.messageText}>{item.text}</Text>}
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* CUSTOM HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.chatsText}>Chats</Text>
          <Image source={avatar} style={styles.detailAvatar} />
          <Text style={styles.detailUserName}>{name}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* CHAT AREA */}
      <ImageBackground style={styles.chatBackground}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.flatListContent}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message"
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: 5 },
  chatsText: { 
    color: '#037EE5', 
    fontSize: 15, 
    marginRight: 10, 
    left: -5,
    fontFamily: 'SF-Pro-Text-Regular'
  },
  detailAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 8,
  },
  detailUserName: { 
    fontSize: 20, 
    color: '#000',
    left: 5,
    fontFamily: 'SF-Pro-Text-Medium' 
  },
  headerRight: { alignItems: 'flex-end', top: -5 },
  callButton: { padding: 5, marginRight: 10 },
  chatBackground: { flex: 1, width: '100%', height: '100%' },
  flatListContent: { paddingHorizontal: 10, paddingVertical: 5 },
  messageContainer: { maxWidth: '75%', marginVertical: 5, padding: 8, borderRadius: 8 },
  messageLeft: { alignSelf: 'flex-start', backgroundColor: '#fff', borderTopLeftRadius: 0 },
  messageRight: { alignSelf: 'flex-end', backgroundColor: '#DCF8C6', borderTopRightRadius: 0 },
  messageText: { fontSize: 16, lineHeight: 22, color: '#333' },
  timestamp: { fontSize: 12, color: '#777', alignSelf: 'flex-end', marginTop: 4 },
  imageBubble: { marginBottom: 5 },
  chatImage: { width: 200, height: 120, resizeMode: 'cover', borderRadius: 8, marginBottom: 5 },
  fileText: { color: '#333', fontSize: 14 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEDED',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  textInput: { flex: 1, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 16, marginRight: 8 },
  sendButton: { backgroundColor: '#0C7B93', padding: 10, borderRadius: 20 },
});
