import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ChatItemType } from './ChatItemsTypes';

// Initial data for the chats
const initialChats: ChatItemType[] = [
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
];

/**
 * Defines the complete shape of the context, including all state and functions.
 */
interface ChatContextType {
  chatList: ChatItemType[];
  pinnedChats: string[];
  addOrUpdateChat: (newItem: ChatItemType) => void;
  togglePinChat: (id: string) => void;
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
  const [chatList, setChatList] = useState<ChatItemType[]>(initialChats);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);

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
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};