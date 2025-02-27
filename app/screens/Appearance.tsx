import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useColorScheme } from 'react-native';

export default function AppearanceScreen({ navigation }: { navigation: any }) {
  const systemTheme = useColorScheme(); // 'light' or 'dark'
  const [selectedTheme, setSelectedTheme] = useState<'automatic' | 'dark' | 'light'>('automatic');

  const handleSelect = (option: 'automatic' | 'dark' | 'light') => {
    setSelectedTheme(option);
    // TODO: Apply the selected theme globally (e.g., via context or persistent storage)
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Appearance</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.option} onPress={() => handleSelect('automatic')}>
          <Text style={styles.optionText}>Automatic</Text>
          {selectedTheme === 'automatic' && <Text style={styles.checkMark}>✓</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={() => handleSelect('dark')}>
          <Text style={styles.optionText}>Dark</Text>
          {selectedTheme === 'dark' && <Text style={styles.checkMark}>✓</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={() => handleSelect('light')}>
          <Text style={styles.optionText}>Light</Text>
          {selectedTheme === 'light' && <Text style={styles.checkMark}>✓</Text>}
        </TouchableOpacity>
      </View>
      <Text style={styles.info}>
        Automatic uses system theme: <Text style={styles.bold}>{systemTheme}</Text>
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomColor: '#EFEFEF',
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
  },
  checkMark: {
    fontSize: 16,
    color: '#007AFF',
  },
  info: {
    marginTop: 16,
    fontSize: 14,
    color: '#888888',
  },
  bold: {
    fontWeight: '600',
  },
});
