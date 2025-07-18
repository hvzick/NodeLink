// utils/ChatDetailUtils/handleQuotedPress.ts

import { Message } from "../../../backend/Local database/SQLite/MessageStructure";
import { ChatDetailHandlerDependencies } from "./HandleDependencies";

type FlatListItem = Message | { type: "date"; date: string; id: string };

export const handleQuotedPress = (
  dependencies: ChatDetailHandlerDependencies,
  quoted: Message,
  dataWithSeparators: FlatListItem[], // Use the specific type for dataWithSeparators
  isMessage: (item: any) => item is Message // The type guard function
) => {
  const { flatListRef, setHighlightedMessageId } = dependencies;
  const index = dataWithSeparators.findIndex(
    (item) => isMessage(item) && item.id === quoted.id
  );
  if (index !== -1) {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5,
    });
    setHighlightedMessageId(null); // Clear highlight on scroll start, set it after delay
    setTimeout(() => setHighlightedMessageId(quoted.id), 300); // Set highlight after slight delay
    setTimeout(() => setHighlightedMessageId(null), 1800); // Remove highlight after total 1.8s
  }
};
