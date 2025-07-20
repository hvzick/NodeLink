import { useEffect } from "react";
import { EventBus } from "../../ChatUtils/ChatContext";
import { Message } from "../../../backend/Local database/SQLite/MessageStructure";
import { FlatList } from "react-native";

export function useNewMessageListener(
  receiverAddress: string,
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void,
  flatListRef: React.RefObject<FlatList<any>>,
  messages: Message[]
) {
  useEffect(() => {
    const handleNewMessage = (newMsg: Message) => {
      const msgSender = newMsg.sender.toLowerCase();
      const myReceiver = receiverAddress.toLowerCase();
      if (msgSender === myReceiver) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === newMsg.id);
          if (exists) return prev;
          const updated = [...prev, newMsg].sort(
            (a, b) =>
              (a.createdAt || parseInt(a.id, 10)) -
              (b.createdAt || parseInt(b.id, 10))
          );
          return updated;
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);
      }
    };
    EventBus.on("new-message", handleNewMessage);
    return () => {
      EventBus.off("new-message", handleNewMessage);
    };
  }, [receiverAddress, setMessages, flatListRef, messages]);
}
