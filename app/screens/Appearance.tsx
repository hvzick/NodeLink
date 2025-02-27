// AppearanceScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { triggerLightHapticFeedback } from '@/utils/GlobalUtils/HapticFeedback';
import { useThemeToggle, ThemeOption as GlobalThemeOption } from '../../utils/GlobalUtils/ThemeProvider';

type LocalThemeOption = 'automatic' | 'dark' | 'light';

export default function AppearanceScreen() {
  const navigation = useNavigation();
  const [selectedTheme, setSelectedTheme] = useState<LocalThemeOption>('automatic');
  const { currentTheme, setTheme } = useThemeToggle();

  const handleSelect = (option: LocalThemeOption) => {
    setSelectedTheme(option);
    const themeToSet: GlobalThemeOption = option === 'automatic' ? 'system' : option;
    setTheme(themeToSet);
    triggerLightHapticFeedback();
    console.log(`Theme selected: ${option}`, currentTheme);
  };

  // Dynamic colors based on currentTheme
  const containerBackground = currentTheme === 'dark' ? '#1C1C1D' : '#F2F2F2';
  const headerBackground = currentTheme === 'dark' ? '#1C1C1D' : '#F2F2F2';
  const headerTitleColor = currentTheme === 'dark' ? '#fff' : '#333333';
  const listContainerBackground = currentTheme === 'dark' ? '#121212' : '#FFFFFF';
  const optionTextColor = currentTheme === 'dark' ? '#fff' : '#333333';
  const listItemBorderColor = currentTheme === 'dark' ? '#333' : '#EFEFEF';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: containerBackground }]}>
      <View style={[styles.headerContainer, { backgroundColor: headerBackground }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" style={{ marginRight: 4 }} />
          <Text style={styles.backButtonText}>Settings</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: headerTitleColor }]}>Appearance</Text>
      </View>
      <View style={[styles.listContainer, { backgroundColor: listContainerBackground }]}>
        <TouchableOpacity style={[styles.listItem, { borderBottomColor: listItemBorderColor }]} onPress={() => handleSelect('automatic')}>
          <Text style={[styles.optionText, { color: optionTextColor }]}>Automatic</Text>
          {selectedTheme === 'automatic' && (
            <Ionicons name="checkmark" size={22} color="#007AFF" />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.listItem, { borderBottomColor: listItemBorderColor }]} onPress={() => handleSelect('dark')}>
          <Text style={[styles.optionText, { color: optionTextColor }]}>Dark</Text>
          {selectedTheme === 'dark' && (
            <Ionicons name="checkmark" size={22} color="#007AFF" />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.listItem, { borderBottomWidth: 0 }]} onPress={() => handleSelect('light')}>
          <Text style={[styles.optionText, { color: optionTextColor }]}>Light</Text>
          {selectedTheme === 'light' && (
            <Ionicons name="checkmark" size={22} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: { width: 100, flexDirection: 'row', alignItems: 'center', left: -10 },
  backButtonText: { fontSize: 17, color: '#007AFF' },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'SF-Pro-Text-Medium',
    fontWeight: '600',
  },
  listContainer: {
    marginTop: 20,
    borderRadius: 8,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  optionText: { fontSize: 16 },
});
