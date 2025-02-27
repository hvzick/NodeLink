import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // or any icon library you prefer
import { triggerLightHapticFeedback } from '@/utils/GlobalUtils/HapticFeedback';
type ThemeOption = 'automatic' | 'dark' | 'light';

export default function AppearanceScreen() {
  const navigation = useNavigation();
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('automatic');

  const handleSelect = (option: ThemeOption) => {
    setSelectedTheme(option);
    // TODO: Apply the selected theme globally if needed
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom header */}
      <View style={styles.headerContainer}>

        {/* Back Icon + Settings back button */}
        <TouchableOpacity style={styles.backButton} 
          onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" style={{ marginRight: 4 }} />
          <Text style={styles.backButtonText}>Settings</Text>
        </TouchableOpacity>

        {/* Centered title (via absolute positioning) */}
        <Text style={styles.headerTitle}>Appearance</Text>
      </View>

      {/* Theme options container */}
      <View style={styles.listContainer}>

        {/* Automatic option */}
        <TouchableOpacity 
        style={styles.listItem} 
        onPress={() => {
          handleSelect('automatic'),
          triggerLightHapticFeedback()
            }
          }>
          <Text style={styles.optionText}>
            Automatic
            </Text>
          {selectedTheme === 'automatic' && (
            <Ionicons name="checkmark" size={20} color="#007AFF" />
          )}
        </TouchableOpacity>

        {/* Dark option */}
        <TouchableOpacity 
        style={styles.listItem}           
        onPress={() => {
          handleSelect('dark'),
          triggerLightHapticFeedback()
            }
          }>
          <Text style={styles.optionText}>
            Dark
            </Text>
          {selectedTheme === 'dark' && (
            <Ionicons name="checkmark" size={25} color="#007AFF"/>
          )}
        </TouchableOpacity>

        {/* Light option*/}
        <TouchableOpacity
          style={[styles.listItem, { borderBottomWidth: 0 }]}
          onPress={() => {
            handleSelect('light'),
            triggerLightHapticFeedback()
            }
          }>
          <Text style={styles.optionText}>Light</Text>
          {selectedTheme === 'light' && (
            <Ionicons name="checkmark" size={20} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2', // Light gray background
  },

  headerContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    left: -10,
  },
  backButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 20, 
    fontWeight: '600',
  },
  listContainer: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 20,
    overflow: 'hidden', 
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
  },
});
