// utils/ChatUtils/ChatContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatItemType } from './ChatItemsTypes';
import { EventBus } from './EventBus';
const ASYNC_STORAGE_KEY = 'chat_list_storage';

// The predefined chats have been removed. The list now starts empty on first launch.
const initialChats: ChatItemType[] = [];

/**
 * Defines the complete shape of the context, including all state and functions.
 * isLoading is added to handle asynchronous loading from storage.
 */
interface ChatContextType {
  chatList: ChatItemType[];
  pinnedChats: string[];
  addOrUpdateChat: (newItem: ChatItemType) => void;
  togglePinChat: (id: string) => void;
  isLoading: boolean;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chatList, setChatList] = useState<ChatItemType[]>([]);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Added for persistence

  // Effect to load data from AsyncStorage on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedChats = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
        if (storedChats) {
          setChatList(JSON.parse(storedChats));
        } else {
          setChatList(initialChats); // Fallback to the (now empty) initial data
        }
      } catch (error) {
        console.error("Failed to load chats from storage", error);
        setChatList(initialChats); // Fallback on error
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Effect to save data to AsyncStorage whenever chatList changes
  useEffect(() => {
    // We don't want to save during the initial loading phase
    if (!isLoading) {
      const saveData = async () => {
        try {
          // Note: Storing require() results in AsyncStorage is not ideal for production.
          // For a robust solution, avatar paths should be URIs.
          const jsonValue = JSON.stringify(chatList);
          await AsyncStorage.setItem(ASYNC_STORAGE_KEY, jsonValue);
        } catch (error) {
          console.error("Failed to save chats to storage", error);
        }
      };
      saveData();
    }
  }, [chatList, isLoading]);

  // Effect to listen for external events to add a chat
  useEffect(() => {
    const handleExternalAddChat = (newChat: ChatItemType) => {
        addOrUpdateChat(newChat);
    };
    EventBus.on('add-chat', handleExternalAddChat);
    return () => {
        EventBus.off('add-chat', handleExternalAddChat);
    };
  }, []); // Empty array ensures this effect runs only once

  // Using your addOrUpdateChat logic
  const addOrUpdateChat = (newItem: ChatItemType) => {
    setChatList(prevList => {
      const existingChatIndex = prevList.findIndex(chat => chat.id === newItem.id);
      let newList = [...prevList];

      if (existingChatIndex > -1) {
        const existingChat = newList.splice(existingChatIndex, 1)[0];
        const updatedChat = { ...existingChat, message: newItem.message, time: newItem.time };
        newList.unshift(updatedChat);
      } else {
        newList.unshift(newItem);
      }
      return newList;
    });
  };

  // Using your togglePinChat logic
  const togglePinChat = (id: string) => {
    const newPinnedChats = pinnedChats.includes(id)
      ? pinnedChats.filter(pinnedId => pinnedId !== id)
      : [...pinnedChats, id];
    
    setPinnedChats(newPinnedChats);

    setChatList(prevList => {
      const newList = [...prevList];
      newList.sort((a, b) => {
        const aIsPinned = newPinnedChats.includes(a.id);
        const bIsPinned = newPinnedChats.includes(b.id);
        
        if (aIsPinned === bIsPinned) return 0;
        return aIsPinned ? -1 : 1;
      });
      return newList;
    });
  };
  
  const value = {
    chatList,
    pinnedChats,
    addOrUpdateChat,
    togglePinChat,
    isLoading,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
