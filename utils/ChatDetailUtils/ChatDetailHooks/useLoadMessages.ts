import { useEffect } from "react";
import { ensureDatabaseInitialized } from "../../../backend/Local database/SQLite/InitialiseDatabase";
import { fetchMessagesByConversation } from "../../../backend/Local database/SQLite/MessageIndex";
import { Message } from "../../../backend/Local database/SQLite/MessageStructure";
import { FlatList } from "react-native";

export function useLoadMessages(
  conversationId: string,
  setMessages: (messages: Message[]) => void,
  flatListRef: React.RefObject<FlatList<any>>,
  setIsLoading: (loading: boolean) => void
) {
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      await ensureDatabaseInitialized();
      const fetched = await fetchMessagesByConversation(conversationId);
      setMessages(
        fetched.sort(
          (a, b) =>
            (a.createdAt || parseInt(a.id, 10)) -
            (b.createdAt || parseInt(b.id, 10))
        )
      );
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
      setIsLoading(false);
    };
    loadMessages();
  }, [conversationId, setMessages, flatListRef, setIsLoading]);
}
