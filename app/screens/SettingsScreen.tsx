import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
  TouchableOpacity,
} from 'react-native';

// Example placeholder icon imports (replace with your own)
const trashIcon = require('../../assets/images/fc.jpg');
const phoneIcon = require('../../assets/images/fc.jpg');
const moonIcon = require('../../assets/images/fc.jpg');
const bellIcon = require('../../assets/images/fc.jpg');
const lockIcon = require('../../assets/images/fc.jpg');
const paintIcon = require('../../assets/images/fc.jpg');
const hapticIcon = require('../../assets/images/fc.jpg');

export default function SettingsScreeimages() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Reusable right arrow component
  const RightArrow = () => (
    <Image
      source={require('../../assets/images/Arrow.png')}
      style={styles.arrowIcon}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity>
          <Text style={styles.editButton}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <Image
            source={{ uri: 'https://placehold.co/56x56' }}
            style={styles.profileImage}
          />
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>Hazik</Text>
            <Text style={styles.profileAddress}>
              0xe65EAC370d1079688fe1e4B9a35A41aac2bac
            </Text>
          </View>
        </View>

        {/* Settings List */}
        {/* 1) Delete Chats */}
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#FF3B30' }]}>
              <Image source={trashIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>Delete Chats</Text>
          </View>
          <RightArrow />
        </View>

        {/* 2) Recent Calls */}
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#4CD964' }]}>
              <Image source={phoneIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>Recent Calls</Text>
          </View>
          <RightArrow />
        </View>

        {/* 3) Dark Mode (No arrow, just a Switch) */}
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#000' }]}>
              <Image source={moonIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>Dark Mode</Text>
          </View>
          <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
        </View>

        {/* 4) Notifications and Sounds */}
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#FF9500' }]}>
              <Image source={bellIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>Notifications and Sounds</Text>
          </View>
          <RightArrow />
        </View>

        {/* 5) Privacy and Security */}
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#8E8E93' }]}>
              <Image source={lockIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>Privacy and Security</Text>
          </View>
          <RightArrow />
        </View>

        {/* 6) Appearance */}
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#AF52DE' }]}>
              <Image source={paintIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>Appearance</Text>
          </View>
          <RightArrow />
        </View>

        {/* 7) Turn on Haptic Feedback */}
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#5AC8FA' }]}>
              <Image source={hapticIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>Turn on Haptic Feedback</Text>
          </View>
          <RightArrow />
        </View>

        {/* 8) Delete Account */}
        <View style={[styles.settingsItem, styles.deleteAccountItem]}>
          <Text style={[styles.itemTitle, { color: 'red' }]}>Delete Account</Text>
          <RightArrow />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  scrollContainer: {
    flex: 1,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 35,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  profileTextContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    justifyContent: 'space-between',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBackground: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
  },
  itemTitle: {
    fontSize: 16,
    color: '#333333',
  },
  deleteAccountItem: {
    marginTop: 35,
    borderBottomWidth: 0,
  },
  arrowIcon: {
    width: 7,
    height: 12,
    marginLeft: 8,
    tintColor: '#3C3C43',
  },
});
