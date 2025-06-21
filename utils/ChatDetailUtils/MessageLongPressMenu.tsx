import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../backend/local database/SaveMessages';

// Defines the options that can be selected from the menu
export type MenuOption = 'Reply' | 'Copy' | 'Delete' | 'Forward';

interface MessageLongPressMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onOptionSelect: (option: MenuOption) => void;
  menuPosition: { top: number; left: number; right?: number };
  isSender: boolean;
  message: Message;
}

const MessageLongPressMenu: React.FC<MessageLongPressMenuProps> = ({
  isVisible,
  onClose,
  onOptionSelect,
  menuPosition,
  isSender,
  message,
}) => {
  // Dynamically build the list of options based on message content and sender
  const menuOptions: { name: MenuOption; icon: keyof typeof Ionicons.glyphMap }[] = [
    { name: 'Reply', icon: 'arrow-undo' },
  ];

  // Only show 'Copy' if there is text to copy
  if (message.text) {
    menuOptions.push({ name: 'Copy', icon: 'copy-outline' });
  }

  // 'Forward' is always an option
  menuOptions.push({ name: 'Forward', icon: 'arrow-redo' });

  // Only the sender can delete their own message
  if (isSender) {
    menuOptions.push({ name: 'Delete', icon: 'trash-outline' });
  }

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      {/* The overlay allows dismissing the menu by tapping anywhere else on the screen */}
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
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
              onPress={() => onOptionSelect(option.name)}
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
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden', // Ensures the border radius is respected by children
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    width: 160, // Fixed width for consistency
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    marginRight: 15,
  },
});

export default MessageLongPressMenu;
