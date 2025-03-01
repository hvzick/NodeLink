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
  KeyboardAvoidingView,
  Platform,
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
  sender: string;  // "Me" or another user's name
  text?: string;
  timestamp: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: string;
};

/** Initial messages for demonstration. */
function getInitialMessages(name: string): Message[] {
  return [
    {
      id: '1',
      sender: 'Me',
      text: 'Hey!',
      timestamp: '10:00',
    },
    {
      id: '2',
      sender: name,
      text: 'Good morning!\nDo you know what time it is?',
      timestamp: '10:01',
    },
    {
      id: '3',
      sender: 'Me',
      text: "It's morning in Tokyo 😎",
      timestamp: '10:02',
    },
  ];
}

const ChatDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { conversationId, name, avatar } = route.params;
  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages(name));
  const [newMessage, setNewMessage] = useState('');

  /** Send a new message from "Me" */
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
    console.log('send pressed');
  };

  /** Render each message bubble */
  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'Me';

    return (
      <View style={[styles.bubbleContainer, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
        {/* For incoming messages, show a name label at the top */}
        {!isMe && (
          <View style={styles.nameLabel}>
            <Text style={styles.nameText}>{item.sender}</Text>
          </View>
        )}

        {/* If there's an imageUrl, display the image above the text */}
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

        {/* Text message + inline timestamp */}
        {item.text && (
          <Text style={styles.messageText}>
            {item.text + '  '}
            <Text style={styles.timeText}>{item.timestamp}</Text>
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor:'#EDEDED' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}  // Adjust this offset as needed
      >
        {/* ---------------- CUSTOM HEADER ---------------- */}
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

        {/* ---------------- CHAT AREA ---------------- */}
        <ImageBackground style={styles.chatBackground}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.flatListContent}
          />

          {/* ---------------- BOTTOM INPUT BAR ---------------- */}
          <View style={styles.bottomBar}>
            {/* Attachment Icon */}
            <TouchableOpacity style={styles.iconContainer} onPress={() => console.log('Attach pressed')}>
              <Ionicons name="attach" size={24} color="#666" />
            </TouchableOpacity>

            {/* Text Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a Message"
                placeholderTextColor="#999"
                value={newMessage}
                onChangeText={setNewMessage}
                autoFocus={true}
              />
            </View>

            {/* Microphone Icon */}
            <TouchableOpacity style={styles.iconContainer} onPress={() => console.log('Mic pressed')}>
              <Ionicons name="mic" size={24} color="#666" />
            </TouchableOpacity>

            {/* Send Button */}
            <TouchableOpacity style={styles.iconContainer} onPress={handleSendMessage}>
              <Ionicons name="send" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDEDED' },

  // HEADER
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    top: -5,
  },
  backButton: { marginRight: 5 },
  chatsText: { 
    color: '#037EE5', 
    fontSize: 15, 
    marginRight: 10, 
    left: -5,
    fontFamily: 'SF-Pro-Text-Regular',
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
    fontFamily: 'SF-Pro-Text-Medium',
  },
  headerRight: { alignItems: 'flex-end', top: -5 },
  callButton: {
    padding: 5,
    marginRight: 10,
  },

  // CHAT BACKGROUND
  chatBackground: { flex: 1, width: '100%', height: '100%' },
  flatListContent: { paddingHorizontal: 10, paddingVertical: 5 },

  // BUBBLES
  bubbleContainer: {
    maxWidth: '75%',
    marginVertical: 5,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderTopLeftRadius: 0,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 0,
  },
  nameLabel: {
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 3,
  },
  nameText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#075E54',
  },
  messageText: {
    fontSize: 17,
    lineHeight: 22,
    color: '#333',
    fontFamily: 'SF-Pro-Text-Regular',
  },
  timeText: {
    fontSize: 10,
    color: '#999',
  },

  // IMAGE BUBBLE
  imageBubble: {
    marginBottom: 5,
  },
  chatImage: {
    width: 200,
    height: 120,
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 5,
  },
  fileText: {
    color: '#333',
    fontSize: 14,
  },

  // BOTTOM INPUT BAR
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEDED',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  iconContainer: {
    paddingHorizontal: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 6,
    borderRadius: 25,
    justifyContent: 'center',
  },
  textInput: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
  },
});
