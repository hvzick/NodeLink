// utils/ChatDetailUtils/MessageLongPressMenu.tsx

import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native"; // Import Alert and Clipboard
import { Ionicons } from "@expo/vector-icons";
import { Message } from "../../../backend/Local database/MessageStructure"; // Ensure this path is correct and Message has imageUrl/videoUrl
import { copyToClipboard } from "../../GlobalUtils/CopyToClipboard";

// Defines the options that can be selected from the menu
export type MenuOption = "Info" | "Reply" | "Copy" | "Delete" | "Delete Chat";

interface MessageLongPressMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onOptionSelect: (option: MenuOption) => void;
  menuPosition: { top: number; left: number; right?: number };
  isSender: boolean;
  message: Message;
  onDeleteChat: () => void; // New prop
}

const MessageLongPressMenu: React.FC<MessageLongPressMenuProps> = ({
  isVisible,
  onClose,
  onOptionSelect,
  menuPosition,
  isSender,
  message,
  onDeleteChat,
}) => {
  // Dynamically build the list of options based on message content and sender
  const menuOptions: {
    name: MenuOption;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { name: "Info", icon: "information-circle-outline" },
    { name: "Reply", icon: "arrow-undo" },
  ];

  // --- MODIFIED COPY LOGIC ---
  let copyContent: string | undefined;
  if (message.text) {
    copyContent = message.text;
  } else if (message.imageUrl) {
    copyContent = message.imageUrl; // Copy the image URL
  } else if (message.videoUrl) {
    copyContent = message.videoUrl; // Copy the video URL
  }

  // Only show 'Copy' if there is any content (text, image URL, or video URL) to copy
  if (copyContent) {
    menuOptions.push({ name: "Copy", icon: "copy-outline" });
  }
  // --- END MODIFIED COPY LOGIC ---

  // Always show 'Delete Chat' at the bottom
  menuOptions.push({ name: "Delete Chat", icon: "trash-bin-outline" });

  // Handle the 'Copy' action directly within this component
  const handleCopy = () => {
    if (copyContent) {
      copyToClipboard(copyContent);
    }
    onClose(); // Close the menu after copying
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        onPress={onClose}
        activeOpacity={1}
      >
        <View
          // Prevent menu from closing when tapping on the menu itself
          onStartShouldSetResponder={() => true}
          style={[
            styles.menuContainer,
            { top: menuPosition.top, left: menuPosition.left },
          ]}
        >
          {menuOptions.map((option) => (
            <TouchableOpacity
              key={option.name}
              style={styles.optionButton}
              onPress={() => {
                if (option.name === "Copy") {
                  handleCopy(); // Handle copy action internally
                } else if (option.name === "Delete Chat") {
                  onDeleteChat();
                  onClose();
                } else {
                  onOptionSelect(option.name); // Delegate other actions to parent (ChatDetailScreen)
                }
              }}
            >
              <Text style={styles.optionText}>{option.name}</Text>
              <Ionicons name={option.icon} size={22} color="#333" />
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  menuContainer: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden", // Ensures the border radius is respected by children
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    width: 160, // Fixed width for consistency
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    marginRight: 15,
  },
});

export default MessageLongPressMenu;
