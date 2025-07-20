// utils/ChatDetailUtils/handleLongPress.ts

import { Dimensions } from "react-native";
import { Message } from "../../../backend/Local database/SQLite/MessageStructure";
import { ChatDetailHandlerDependencies } from "./HandleDependencies";

export const handleLongPress = (
  dependencies: ChatDetailHandlerDependencies,
  msg: Message,
  layout: { x: number; y: number; width: number; height: number }
) => {
  const {
    messages: allMessages,
    setMenuVisible,
    setSelectedMessageForMenu,
    setMenuPosition,
  } = dependencies;
  const screenHeight = Dimensions.get("window").height;
  const estimatedMenuHeight = 200; // This value is crucial to verify

  let verticalTopPosition;

  const messageIndexInRawList = allMessages.findIndex((m) => m.id === msg.id);
  const isOneOfLastTwoMessages =
    messageIndexInRawList !== -1 &&
    messageIndexInRawList >= allMessages.length - 2;

  const spaceBelowMessage = screenHeight - (layout.y + layout.height);
  const isTooCloseToBottom = spaceBelowMessage < estimatedMenuHeight + 20;

  if (isOneOfLastTwoMessages || isTooCloseToBottom) {
    verticalTopPosition = layout.y - estimatedMenuHeight - 10;
    if (verticalTopPosition < 20) {
      verticalTopPosition = layout.y + layout.height + 10;
    }
  } else {
    verticalTopPosition = layout.y + layout.height + 10;
  }

  setSelectedMessageForMenu(msg);
  setMenuPosition({ x: layout.x, y: layout.y, width: layout.width, height: layout.height });
  setMenuVisible(true);
};
