// SettingsScreen.tsx
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Appearance: undefined;
};

type SettingsNavigationProp = StackNavigationProp<SettingsStackParamList, 'SettingsMain'>;

const trashIcon = require('../../assets/images/fc.jpg');
const phoneIcon = require('../../assets/images/fc.jpg');
const moonIcon = require('../../assets/images/fc.jpg');
const bellIcon = require('../../assets/images/fc.jpg');
const lockIcon = require('../../assets/images/fc.jpg');
const paintIcon = require('../../assets/images/fc.jpg');
const hapticIcon = require('../../assets/images/fc.jpg');

import ArrowSVG from '../../assets/images/arrow-icon.svg';
import ProfileArrowSvg from '../../assets/images/profile-arrow-icon.svg';

export default function SettingsScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigation = useNavigation<SettingsNavigationProp>();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const RightArrow = () => (
    <ArrowSVG width={styles.arrowIcon.width} height={styles.arrowIcon.height} />
  );

  const ProfileRightArrow = () => (
    <ProfileArrowSvg
      width={styles.profileArrowIcon.width}
      height={styles.profileArrowIcon.height}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity>
          <Text style={styles.editButton}>Copy Address</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.profileContainer}>
          <Image
            source={{ uri: '../../assets/images/profile-picture.png' }}
            style={styles.profileImage}
          />
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>Hazik</Text>
            <Text style={styles.profileAddress}>
              0xe65EAC370d1079688fe1e4B9a35A41aac2bac
            </Text>
          </View>
          <ProfileRightArrow />
        </View>
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#FF3B30' }]}>
              <Image source={trashIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>Delete Chats</Text>
          </View>
          <RightArrow />
        </View>
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#4CD964' }]}>
              <Image source={phoneIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>Recent Calls</Text>
          </View>
          <RightArrow />
        </View>
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#000' }]}>
              <Image source={moonIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>Change Theme</Text>
          </View>
          <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
        </View>
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#FF9500' }]}>
              <Image source={bellIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>Notifications and Sounds</Text>
          </View>
          <RightArrow />
        </View>
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#8E8E93' }]}>
              <Image source={lockIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>Privacy and Security</Text>
          </View>
          <RightArrow />
        </View>
        {/* Appearance option navigates to the Appearance screen */}
        <TouchableOpacity onPress={() => navigation.navigate('Appearance')}>
          <View style={styles.settingsItem}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconBackground, { backgroundColor: '#AF52DE' }]}>
                <Image source={paintIcon} style={styles.icon} />
              </View>
              <Text style={styles.itemTitle}>Appearance</Text>
            </View>
            <RightArrow />
          </View>
        </TouchableOpacity>
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#5AC8FA' }]}>
              <Image source={hapticIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>Turn on Haptic Feedback</Text>
          </View>
          <RightArrow />
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 25,
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
    height: 120,
    marginBottom: 35,
  },
  profileImage: {
    width: 75,
    height: 75,
    borderRadius: 40,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  profileTextContainer: {
    flex: 1,
    paddingRight: 15,
    paddingLeft: 5
  },
  profileName: {
    fontSize: 19,
    fontFamily: 'SF-Pro-Text-Medium',
    fontWeight: '600',
    bottom: 7
  },
  profileAddress: {
    fontSize: 13,
    color: '#1E90FF',
    marginTop: 4,
    bottom: 3
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
  profileArrowIcon: {
    width: 12,
    height: 18,
    marginLeft: 8,
    tintColor: '#3C3C43',
  },
});
