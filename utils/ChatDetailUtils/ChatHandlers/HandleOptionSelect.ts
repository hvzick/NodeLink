// utils/ChatDetailUtils/ChatHandlers/handleOptionSelect.ts

import { Alert } from "react-native";
import { Message } from "../../../backend/Local database/SQLite/MessageStructure";
import { ChatDetailHandlerDependencies } from "./HandleDependencies";
import { MenuOption } from "./HandleMessageLongPressMenu";
import { copyToClipboard } from "../../GlobalUtils/CopyToClipboard";
import { handleDeleteMessage } from "./HandleDeleteMessage";
import { closeLongPressMenu } from "./HandleCloseLongPressMenu";
import { handleSelectMessage } from "./HandleSelectMessage";

export const handleOptionSelect = async (
  dependencies: ChatDetailHandlerDependencies,
  option: MenuOption,
  selectedMessageForMenu: Message
) => {
  const { setReplyMessage } = dependencies;

  if (!selectedMessageForMenu) return;

  switch (option) {
    case "Reply":
      setReplyMessage(selectedMessageForMenu);
      break;
    case "Delete":
      await handleDeleteMessage(dependencies, selectedMessageForMenu.id);
      break;
    case "Copy":
      let contentToCopy = "";
      if (selectedMessageForMenu.text)
        contentToCopy = selectedMessageForMenu.text;
      else if (selectedMessageForMenu.imageUrl)
        contentToCopy = selectedMessageForMenu.imageUrl;
      else if (selectedMessageForMenu.videoUrl)
        contentToCopy = selectedMessageForMenu.videoUrl;

      if (contentToCopy) {
        await copyToClipboard(contentToCopy);
        Alert.alert("Copied!", "Content copied to clipboard.");
      } else {
        Alert.alert("Info", "Nothing to copy from this message.");
      }
      break;
    case "Select":
      handleSelectMessage(dependencies, selectedMessageForMenu.id);
      break;
  }
  closeLongPressMenu(dependencies);
};
