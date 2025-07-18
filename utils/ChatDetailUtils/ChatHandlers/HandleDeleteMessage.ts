// utils/ChatDetailUtils/handleDeleteMessage.ts

import { Alert } from "react-native";
import { deleteMessage } from "../../../backend/Local database/SQLite/MessageIndex";
import { ChatDetailHandlerDependencies } from "./HandleDependencies";

export const handleDeleteMessage = async (
  dependencies: ChatDetailHandlerDependencies,
  id: string
) => {
  const { setMessages } = dependencies;
  try {
    await deleteMessage(id);
    setMessages((msgs) => msgs.filter((m) => m.id !== id));
  } catch {
    Alert.alert("Error", "Could not delete message");
  }
};
