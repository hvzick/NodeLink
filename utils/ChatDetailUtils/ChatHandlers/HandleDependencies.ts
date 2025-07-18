// utils/ChatDetailUtils/ChatHandlers/HandleDependencies.ts

import React from "react";
import { Message } from "../../../backend/Local database/SQLite/MessageStructure";
import { ChatItemType } from "../../ChatUtils/ChatItemsTypes";
import { FlatList } from "react-native";

export interface ChatDetailHandlerDependencies {
  conversationId: string;
  name: string;
  avatar: any;

  userAddress: string; // ✅ Added
  receiverAddress: string; // ✅ Added

  addOrUpdateChat: (chatItem: ChatItemType) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  attachment: Partial<Message> | null;
  setAttachment: React.Dispatch<React.SetStateAction<Partial<Message> | null>>;
  replyMessage: Message | null;
  setReplyMessage: React.Dispatch<React.SetStateAction<Message | null>>;
  setSelectedImage: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedVideo: React.Dispatch<React.SetStateAction<string | null>>;
  setHighlightedMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  setMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedMessageForMenu: React.Dispatch<
    React.SetStateAction<Message | null>
  >;
  setMenuPosition: React.Dispatch<
    React.SetStateAction<{ top: number; left: number; right?: number }>
  >;
  flatListRef: React.RefObject<FlatList<any> | null>; // Allows null
}
