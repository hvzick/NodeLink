import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PanResponder, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../backend/Local database/MessageStructure';
import { formatTimeForUser } from '../GlobalUtils/FormatDate';

interface MessageInfoWindowProps {
  message: Message | null;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
}

const MessageInfoWindow: React.FC<MessageInfoWindowProps> = ({ message, onClose, initialPosition = { x: 20, y: 80 } }) => {
  const infoWindowPosition = useRef(new Animated.ValueXY(initialPosition)).current;
  const infoWindowPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([
        null,
        { dx: infoWindowPosition.x, dy: infoWindowPosition.y },
      ], { useNativeDriver: false }),
      onPanResponderRelease: () => {},
    })
  ).current;

  useEffect(() => {
    if (message) {
      infoWindowPosition.setValue(initialPosition);
    }
  }, [message, initialPosition, infoWindowPosition]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.infoWindow,
        { transform: infoWindowPosition.getTranslateTransform() },
      ]}
      {...infoWindowPanResponder.panHandlers}
    >
      <View style={styles.infoHeader}>
        <Text style={styles.infoTitle}>Message Info</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close-circle" size={22} color="#888" />
        </TouchableOpacity>
      </View>
      <View style={styles.infoContent}>
        {Object.entries(message).map(([key, value]) => {
          if (value === null || value === undefined || value === '') return null;
          if (key === 'createdAt') {
            if (typeof value === 'number' || value instanceof Date) {
              const dateObj = value instanceof Date ? value : new Date(value);
              return (
                <React.Fragment key={key}>
                  <Text selectable style={styles.infoLabel}>
                    Sent Date: <Text style={styles.infoValue}>{dateObj.toLocaleDateString()}</Text>
                  </Text>
                  <Text selectable style={styles.infoLabel}>
                    Sent Time: <Text style={styles.infoValue}>{formatTimeForUser(value)}</Text>
                  </Text>
                </React.Fragment>
              );
            }
            return null;
          }
          return (
            <Text key={key} selectable style={styles.infoLabel}>
              {key}: <Text style={styles.infoValue}>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</Text>
            </Text>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  infoWindow: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 80,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
  },
  infoContent: {
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#444',
    marginBottom: 2,
  },
  infoValue: {
    color: '#000',
    fontWeight: '500',
  },
});

export default MessageInfoWindow; 