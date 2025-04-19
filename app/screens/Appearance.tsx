// AppearanceScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { triggerLightHapticFeedback } from '@/utils/GlobalUtils/HapticFeedback';
import { useThemeToggle, ThemeOption as GlobalThemeOption } from '../../utils/GlobalUtils/ThemeProvider';

type LocalThemeOption = 'automatic' | 'dark' | 'light';

export default function AppearanceScreen() {
  const navigation = useNavigation();
  const { currentTheme, userTheme, setTheme } = useThemeToggle();
  const isDarkMode = currentTheme === 'dark';
  const [selectedTheme, setSelectedTheme] = useState<LocalThemeOption>('automatic');

  // Sync local state with userTheme (mapping 'system' to 'automatic')
  useEffect(() => {
    setSelectedTheme(userTheme === 'system' ? 'automatic' : userTheme);
  }, [userTheme]);

  const handleSelect = (option: LocalThemeOption) => {
    setSelectedTheme(option);
    const themeToSet: GlobalThemeOption = option === 'automatic' ? 'system' : option;
    setTheme(themeToSet);
    triggerLightHapticFeedback();
    console.log(`Theme selected: ${option}`, userTheme);
  };

  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" style={{ marginRight: 4 }} />
          <Text style={styles.backButtonText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appearance</Text>
      </View>
      <View style={styles.listContainer}>
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => handleSelect('automatic')}
        >
          <Text style={styles.optionText}>Automatic</Text>
          {selectedTheme === 'automatic' && (
            <Ionicons name="checkmark" size={22} color="#007AFF" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => handleSelect('dark')}
        >
          <Text style={styles.optionText}>Dark</Text>
          {selectedTheme === 'dark' && (
            <Ionicons name="checkmark" size={22} color="#007AFF" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.listItem, { borderBottomWidth: 0 }]}
          onPress={() => handleSelect('light')}
        >
          <Text style={styles.optionText}>Light</Text>
          {selectedTheme === 'light' && (
            <Ionicons name="checkmark" size={22} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1C1C1D' : '#F2F2F2',
    },
    headerContainer: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      height: 40,
      paddingHorizontal: 16,
      backgroundColor: isDarkMode ? '#1C1C1D' : '#F2F2F2',
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
      fontFamily: 'SF-Pro-Text-Medium',
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333333',
    },
    listContainer: {
      marginTop: 10,
      borderRadius: 8,
      marginHorizontal: 20,
      overflow: 'hidden',
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#EFEFEF',
    },
    optionText: {
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#333333',
    },
  });
