// HapticFeedbackScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Switch, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useThemeToggle } from '../../utils/GlobalUtils/ThemeProvider';
import { Picker } from '@react-native-picker/picker';

// Unique keys for saving all settings
const TAP_HAPTIC_KEY = 'tapHapticEnabled';
const HOLD_HAPTIC_KEY = 'holdHapticEnabled';
const TAP_SENSITIVITY_KEY = 'tapHapticSensitivity';
const HOLD_SENSITIVITY_KEY = 'holdHapticSensitivity';

type Sensitivity = 'Light' | 'Medium' | 'Heavy';

export default function HapticFeedbackScreen() { 
  const navigation = useNavigation();
  const { currentTheme } = useThemeToggle();
  const isDarkMode = currentTheme === 'dark';

  // State for all settings
  const [isTapEnabled, setIsTapEnabled] = useState(true);
  const [isHoldEnabled, setIsHoldEnabled] = useState(true);
  const [tapSensitivity, setTapSensitivity] = useState<Sensitivity>('Light');
  const [holdSensitivity, setHoldSensitivity] = useState<Sensitivity>('Heavy'); // Default to Heavy for holds
  const [isLoading, setIsLoading] = useState(true);

  // Load all saved settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [tapValue, holdValue, tapSensitivityValue, holdSensitivityValue] = await Promise.all([
          AsyncStorage.getItem(TAP_HAPTIC_KEY),
          AsyncStorage.getItem(HOLD_HAPTIC_KEY),
          AsyncStorage.getItem(TAP_SENSITIVITY_KEY),
          AsyncStorage.getItem(HOLD_SENSITIVITY_KEY),
        ]);
        
        setIsTapEnabled(tapValue !== 'false');
        setIsHoldEnabled(holdValue !== 'false');
        setTapSensitivity((tapSensitivityValue as Sensitivity) || 'Light');
        setHoldSensitivity((holdSensitivityValue as Sensitivity) || 'Heavy');

      } catch (e) {
        console.error("Failed to load haptic settings.", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  // --- HANDLER FUNCTIONS ---

  const handleTapToggle = async (newValue: boolean) => {
    setIsTapEnabled(newValue);
    if (newValue) {
      await handleTapSensitivityChange(tapSensitivity, false);
    }
    await AsyncStorage.setItem(TAP_HAPTIC_KEY, newValue.toString());
  };

  const handleHoldToggle = async (newValue: boolean) => {
    setIsHoldEnabled(newValue);
    if (newValue) {
      await handleHoldSensitivityChange(holdSensitivity, false);
    }
    await AsyncStorage.setItem(HOLD_HAPTIC_KEY, newValue.toString());
  };

  const triggerHaptic = async (sensitivity: Sensitivity) => {
    let style = Haptics.ImpactFeedbackStyle.Light;
    if (sensitivity === 'Medium') style = Haptics.ImpactFeedbackStyle.Medium;
    if (sensitivity === 'Heavy') style = Haptics.ImpactFeedbackStyle.Heavy;
    await Haptics.impactAsync(style);
  }

  const handleTapSensitivityChange = async (sensitivity: Sensitivity, shouldSave = true) => {
    setTapSensitivity(sensitivity);
    await triggerHaptic(sensitivity);
    if (shouldSave) {
        await AsyncStorage.setItem(TAP_SENSITIVITY_KEY, sensitivity);
    }
  };

  const handleHoldSensitivityChange = async (sensitivity: Sensitivity, shouldSave = true) => {
    setHoldSensitivity(sensitivity);
    await triggerHaptic(sensitivity);
    if (shouldSave) {
        await AsyncStorage.setItem(HOLD_SENSITIVITY_KEY, sensitivity);
    }
  };

  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" style={{ marginRight: 4 }} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer} pointerEvents="none">
          <Text style={styles.headerTitleText}>Haptic Feedback</Text>
        </View>
      </View>
      
      {/* Tap Settings Group */}
      <View style={styles.listContainer}>
        <View style={styles.listItem}>
          <Text style={styles.optionText}>Tap Feedback</Text>
          <Switch
            trackColor={{ false: isDarkMode ? '#2C2C2E' : '#E9E9EA', true: '#34C759' }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor={isDarkMode ? '#2C2C2E' : '#E9E9EA'}
            onValueChange={handleTapToggle}
            value={isTapEnabled}
            disabled={isLoading}
          />
        </View>
        
        {isTapEnabled && (
          <View style={[styles.listItem, { borderBottomWidth: 0 }]}>
            <Text style={styles.optionText}>Tap Sensitivity</Text>
            <Picker
              selectedValue={tapSensitivity}
              onValueChange={(itemValue) => handleTapSensitivityChange(itemValue as Sensitivity)}
              style={styles.picker}
              dropdownIconColor={isDarkMode ? '#FFFFFF' : '#8E8E93'}
              itemStyle={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
            >
              <Picker.Item label="Light" value="Light" />
              <Picker.Item label="Medium" value="Medium" />
              <Picker.Item label="Heavy" value="Heavy" />
            </Picker>
          </View>
        )}
      </View>

      {/* Hold Settings Group */}
      <View style={styles.listContainer}>
        <View style={styles.listItem}>
          <Text style={styles.optionText}>Hold Feedback</Text>
          <Switch
            trackColor={{ false: isDarkMode ? '#2C2C2E' : '#E9E9EA', true: '#34C759' }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor={isDarkMode ? '#2C2C2E' : '#E9E9EA'}
            onValueChange={handleHoldToggle}
            value={isHoldEnabled}
            disabled={isLoading}
          />
        </View>

        {isHoldEnabled && (
            <View style={[styles.listItem, { borderBottomWidth: 0 }]}>
            <Text style={styles.optionText}>Hold Sensitivity</Text>
            <Picker
              selectedValue={holdSensitivity}
              onValueChange={(itemValue) => handleHoldSensitivityChange(itemValue as Sensitivity)}
              style={styles.picker}
              dropdownIconColor={isDarkMode ? '#FFFFFF' : '#8E8E93'}
              itemStyle={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
            >
              <Picker.Item label="Light" value="Light" />
              <Picker.Item label="Medium" value="Medium" />
              <Picker.Item label="Heavy" value="Heavy" />
            </Picker>
          </View>
        )}
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
      zIndex: 1,
    },
    backButtonText: {
      fontSize: 17,
      color: '#007AFF',
    },
    headerTitleContainer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 0,
    },
    headerTitleText: {
      fontSize: 20,
      fontFamily: 'SF-Pro-Text-Medium',
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333333',
    },
    listContainer: {
      marginTop: 20,
      borderRadius: 12,
      marginHorizontal: 20,
      overflow: 'hidden',
      backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF',
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'ios' ? 14 : 0, 
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#48484A' : '#EFEFEF',
    },
    optionText: {
      fontSize: 17,
      color: isDarkMode ? '#fff' : '#000',
    },
    picker: {
      width: Platform.OS === 'ios' ? 150 : 160, // Adjusted for Android
      color: isDarkMode ? '#FFFFFF' : '#000000',
      // On Android, the dropdown items are styled by the OS.
    },
  });