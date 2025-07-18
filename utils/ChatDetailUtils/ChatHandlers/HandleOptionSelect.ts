// utils/ChatDetailUtils/handleOptionSelect.ts

import { Alert } from "react-native";
import { Message } from "../../../backend/Local database/SQLite/MessageStructure";
import { ChatDetailHandlerDependencies } from "./HandleDependencies";
import { MenuOption } from "./HandleMessageLongPressMenu"; // Import MenuOption type
import { copyToClipboard } from "../../GlobalUtils/CopyToClipboard"; // This utility needs to exist
import { handleDeleteMessage } from "./HandleDeleteMessage"; // Import the specific delete handler
import { closeLongPressMenu } from "./CloseLongPressMenu"; // Import the specific close menu handler

export const handleOptionSelect = async (
  dependencies: ChatDetailHandlerDependencies,
  option: MenuOption,
  selectedMessageForMenu: Message // Pass the selected message explicitly
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
    case "Forward":
      console.log("Forwarding message:", selectedMessageForMenu);
      break;
  }
  closeLongPressMenu(dependencies); // Call the specific close menu handler
};
