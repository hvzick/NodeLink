// utils/ChatDetailUtils/MessageLongPressMenu.tsx

import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Message } from "../../../backend/Local database/SQLite/MessageStructure";
import { copyToClipboard } from "../../GlobalUtils/CopyToClipboard";

export type MenuOption = "Info" | "Reply" | "Copy" | "Delete" | "Select";

interface MessageLongPressMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onOptionSelect: (option: MenuOption) => void;
  menuPosition: { x: number; y: number; width: number; height: number };
  isSender: boolean;
  message: Message;
  onDeleteChat: () => void;
  clearHighlight: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const OPTION_HEIGHT = 48;
const ARROW_SIZE = 10;
const MENU_WIDTH = 180;
const PADDING = 8;
const MARGIN = 4;

// Define colors for each option
const getOptionColors = (optionName: MenuOption) => {
  switch (optionName) {
    case "Info":
      return { color: "#8E8E93", bgColor: "#F2F2F7" };
    case "Reply":
      return { color: "#34C759", bgColor: "#F0FFF4" };
    case "Copy":
      return { color: "#FF9500", bgColor: "#FFF8F0" };
    case "Select":
      return { color: "#007AFF", bgColor: "#F0F8FF" };
    case "Delete":
      return { color: "#FF3B30", bgColor: "#FFF0F0" };
    default:
      return { color: "#007AFF", bgColor: "#F0F8FF" };
  }
};

const MessageLongPressMenu: React.FC<MessageLongPressMenuProps> = ({
  isVisible,
  onClose,
  onOptionSelect,
  menuPosition,
  isSender,
  message,
  onDeleteChat,
  clearHighlight,
}) => {
  // Remove all animation logic

  // Fix: Use proper Ionicons type instead of string
  const menuOptions: {
    name: MenuOption;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { name: "Info", icon: "information-circle-outline" },
    { name: "Reply", icon: "arrow-undo" },
  ];

  let copyContent: string | undefined;
  if (message.text) copyContent = message.text;
  else if (message.imageUrl) copyContent = message.imageUrl;
  else if (message.videoUrl) copyContent = message.videoUrl;
  if (copyContent) menuOptions.push({ name: "Copy", icon: "copy-outline" });

  menuOptions.push({ name: "Select", icon: "checkmark-circle-outline" });
  menuOptions.push({ name: "Delete", icon: "trash-bin-outline" });

  const handleClose = () => {
    onClose();
    clearHighlight();
  };

  const handleOption = (opt: MenuOption) => {
    // Handle immediate actions first
    if (opt === "Copy" && copyContent) {
      copyToClipboard(copyContent);
    }

    // Defer state-dependent actions
    requestAnimationFrame(() => {
      if (opt === "Delete") {
        onDeleteChat();
      } else if (opt !== "Copy") {
        onOptionSelect(opt);
      }
      handleClose();
    });
  };

  // compute menu height
  const menuHeight = menuOptions.length * OPTION_HEIGHT + ARROW_SIZE;

  // decide above or below
  const spaceBelow = screenHeight - (menuPosition.y + menuPosition.height);
  const showBelow = spaceBelow > menuHeight + MARGIN;

  const top = showBelow
    ? menuPosition.y + menuPosition.height + MARGIN
    : menuPosition.y - menuHeight - MARGIN;
  let left = isSender
    ? menuPosition.x + menuPosition.width - MENU_WIDTH
    : menuPosition.x;
  left = Math.max(PADDING, Math.min(left, screenWidth - MENU_WIDTH - PADDING));

  const arrowTop = showBelow ? -ARROW_SIZE : menuHeight - ARROW_SIZE;
  const arrowLeft = menuPosition.x + menuPosition.width / 2 - left - ARROW_SIZE;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* Static backdrop */}
      <View style={[styles.backdrop, { backgroundColor: "rgba(0,0,0,0.4)" }]}>
        <TouchableOpacity
          style={styles.touchableBackdrop}
          onPress={handleClose}
          activeOpacity={1}
        >
          <View style={[styles.menu, { top, left }]}>
            <View
              style={[
                styles.arrow,
                showBelow ? styles.arrowUp : styles.arrowDown,
                { top: arrowTop, left: arrowLeft },
              ]}
            />
            {menuOptions.map((opt, idx) => {
              const { color, bgColor } = getOptionColors(opt.name);
              return (
                <TouchableOpacity
                  key={opt.name}
                  style={[
                    styles.option,
                    { backgroundColor: bgColor },
                    idx < menuOptions.length - 1 && styles.separator,
                  ]}
                  onPress={() => handleOption(opt.name)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={color}
                    style={styles.icon}
                  />
                  <Text
                    style={[
                      styles.text,
                      { color },
                      opt.name === "Delete" && styles.deleteText,
                    ]}
                  >
                    {opt.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    position: "relative",
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  touchableBackdrop: {
    flex: 1,
  },
  menu: {
    position: "absolute",
    width: MENU_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  arrow: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    zIndex: 1,
  },
  arrowUp: {
    borderBottomWidth: ARROW_SIZE,
    borderBottomColor: "#fff",
  },
  arrowDown: {
    borderTopWidth: ARROW_SIZE,
    borderTopColor: "#fff",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    height: OPTION_HEIGHT,
    paddingHorizontal: 12,
  },
  separator: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  icon: {
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    flex: 1,
    fontWeight: "500",
  },
  deleteText: {
    fontWeight: "600",
  },
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
    overflow: "hidden",
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    width: 160,
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    marginRight: 15,
  },
  selectOption: {
    backgroundColor: "#F8F9FF",
  },
  selectOptionText: {
    color: "#007AFF",
    fontWeight: "500",
  },
});

export default MessageLongPressMenu;
