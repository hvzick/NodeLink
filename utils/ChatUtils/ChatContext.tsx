// utils/ChatUtils/ChatContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatItemType } from "./ChatItemsTypes";
import { EventBus } from "./EventBus"; // Make sure you are using named import
import { fetchMessagesByConversation } from "../../backend/Local database/SQLite/MessageIndex";

const ASYNC_STORAGE_KEY = "chat_list_storage";

// --- TYPE DEFINITION UPDATED HERE ---
// The interface now correctly includes the 'deleteChat' function.
interface ChatContextType {
  chatList: ChatItemType[];
  pinnedChats: string[];
  addOrUpdateChat: (newItem: ChatItemType) => void;
  togglePinChat: (id: string) => void;
  deleteChat: (id: string) => void;
  isLoading: boolean;
}

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined
);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chatList, setChatList] = useState<ChatItemType[]>([]);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedChats = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
        let chatListToLoad = [];
        if (storedChats) {
          chatListToLoad = JSON.parse(storedChats);
        }
        // For each chat, fetch the latest message from the database
        const updatedChatList = await Promise.all(
          chatListToLoad.map(async (chat: ChatItemType) => {
            const messages = await fetchMessagesByConversation(chat.id);
            const lastMsg = messages[messages.length - 1];
            if (lastMsg) {
              return {
                ...chat,
                message:
                  lastMsg.text ||
                  lastMsg.imageUrl ||
                  lastMsg.videoUrl ||
                  "Attachment",
                time: lastMsg.createdAt
                  ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : chat.time,
              };
            }
            return chat;
          })
        );
        setChatList(updatedChatList);
      } catch (error) {
        console.error("Failed to load chats from storage", error);
        setChatList([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const saveData = async () => {
        try {
          const jsonValue = JSON.stringify(chatList);
          await AsyncStorage.setItem(ASYNC_STORAGE_KEY, jsonValue);
        } catch (error) {
          console.error("Failed to save chats to storage", error);
        }
      };
      saveData();
    }
  }, [chatList, isLoading]);

  useEffect(() => {
    const handleExternalAddChat = (newChat: ChatItemType) => {
      addOrUpdateChat(newChat);
    };
    EventBus.on("add-chat", handleExternalAddChat);
    return () => {
      EventBus.off("add-chat", handleExternalAddChat);
    };
  }, []);

  const addOrUpdateChat = (newItem: ChatItemType) => {
    setChatList((prevList) => {
      const existingChatIndex = prevList.findIndex(
        (chat) => chat.id === newItem.id
      );
      let newList = [...prevList];
      if (existingChatIndex > -1) {
        const existingChat = newList.splice(existingChatIndex, 1)[0];
        const updatedChat = {
          ...existingChat,
          message: newItem.message,
          time: newItem.time,
        };
        newList.unshift(updatedChat);
      } else {
        newList.unshift(newItem);
      }
      return newList;
    });
  };

  const togglePinChat = (id: string) => {
    const newPinnedChats = pinnedChats.includes(id)
      ? pinnedChats.filter((pinnedId) => pinnedId !== id)
      : [...pinnedChats, id];

    setPinnedChats(newPinnedChats);

    setChatList((prevList) => {
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

  const deleteChat = (id: string) => {
    setChatList((prevList) => prevList.filter((chat) => chat.id !== id));
    setPinnedChats((prevPinned) =>
      prevPinned.filter((pinnedId) => pinnedId !== id)
    );
    console.log(`Chat with id: ${id} deleted.`);
  };

  // --- CONTEXT VALUE UPDATED HERE ---
  // The value object now provides the deleteChat function to the context.
  const value = {
    chatList,
    pinnedChats,
    addOrUpdateChat,
    togglePinChat,
    deleteChat, // This line is added
    isLoading,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
export { EventBus };
