import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App'; // Adjust the path as needed

// Define the navigation prop type for BottomNavBar. 
// (We use 'Wallet' as a default route but any route from RootStackParamList is allowed.)
type BottomNavBarNavigationProp = StackNavigationProp<RootStackParamList, 'Wallet'>;

export default function BottomNavBar() {
  const navigation = useNavigation<BottomNavBarNavigationProp>();
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.bottomNav, { backgroundColor: colorScheme === 'dark' ? "#1C1C1D" : "#EAEAEA" }]}>
      <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Wallet')}>
        <Text style={[styles.tabText, { color: colorScheme === 'light' ? "#000" : "#fff" }]}>
          Wallet
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Chats')}>
        <Text style={[styles.tabText, { color: colorScheme === 'light' ? "#000" : "#fff" }]}>
          Chats
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Settings')}>
        <Text style={[styles.tabText, { color: colorScheme === 'light' ? "#000" : "#fff" }]}>
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },
});
