// SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { copyToClipboard } from '../../utils/GlobalUtils/CopyToClipboard';
import { useThemeToggle } from '../../utils/GlobalUtils/ThemeProvider';
import { UserData, DEFAULT_USER_DATA } from '../../backend/decentralized-database/RegisterUser';
import ArrowSVG from '../../assets/images/arrow-icon.svg';
import ProfileArrowSvg from '../../assets/images/profile-arrow-icon.svg';
import { logout } from '../../utils/AuthenticationUtils/Logout'; // adjust path as needed
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SettingsStackParamList = {
  Settings: undefined;
  Appearance: undefined;
  MyProfile: undefined;
  Notifications: undefined;
};

type SettingsNavigationProp = StackNavigationProp<SettingsStackParamList, 'Settings'>;

const phoneIcon = require('../../assets/images/fc.jpg');
const moonIcon = require('../../assets/images/fc.jpg');
const bellIcon = require('../../assets/images/fc.jpg');
const lockIcon = require('../../assets/images/fc.jpg');
const paintIcon = require('../../assets/images/fc.jpg');
const hapticIcon = require('../../assets/images/fc.jpg');


export default function SettingsScreen() {
  // Retrieve the current theme and toggle function from your ThemeProvider.
  const { currentTheme, toggleTheme } = useThemeToggle();
  const isDarkMode = currentTheme === 'dark';
  const [copied, setCopied] = useState(false);
  const navigation = useNavigation<SettingsNavigationProp>();

  // State to hold user data retrieved from the database.
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedData = await AsyncStorage.getItem("userData");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log("📱 Loaded user data in settings:", parsedData);
        setUserData(parsedData);
      } else {
        console.log("❌ No user data found in AsyncStorage, using default values");
        // Get wallet address from AsyncStorage
        const walletAddress = await AsyncStorage.getItem("walletAddress");
        if (walletAddress) {
          setUserData({
            walletAddress,
            ...DEFAULT_USER_DATA
          });
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      // Get wallet address from AsyncStorage even if userData loading fails
      const walletAddress = await AsyncStorage.getItem("walletAddress");
      if (walletAddress) {
        setUserData({
          walletAddress,
          ...DEFAULT_USER_DATA
        });
      }
    }
  };

  const toggleDarkMode = async () => {
    await toggleTheme();
  };

  const handleCopyAddress = async () => {
    if (!userData?.walletAddress) return;
    const success = await copyToClipboard(userData.walletAddress);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const styles = getStyles(isDarkMode);

  const RightArrow = () => (
    <ArrowSVG width={styles.arrowIcon.width} height={styles.arrowIcon.height} />
  );

  const ProfileRightArrow = () => (
    <ProfileArrowSvg width={styles.profileArrowIcon.width} height={styles.profileArrowIcon.height} />
  );

  // Determine the image source based on user data
  const profileImageSource =
    userData && userData.avatar !== 'default'
      ? { uri: userData.avatar }
      : require('../../assets/images/default-avatar.jpg');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={handleCopyAddress}>
          {copied ? (
            <View style={styles.copyContainer}>
              <Text style={styles.copyAddressButton}>Copied</Text>
              <Ionicons name="checkmark" size={20} color="#007AFF" style={{ marginLeft: 5 }} />
            </View>
          ) : (
            <Text style={styles.copyAddressButton}>Copy Address</Text>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollContainer}>
        <TouchableOpacity style={styles.profileContainer} onPress={() => navigation.navigate('MyProfile')}>
          <Image
            source={profileImageSource}
            style={styles.profileImage}
          />
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>
              {userData
                ? userData.name.length > 25
                  ? userData.name.slice(0, 25) + '...'
                  : userData.name
                : "NodeLink User"}
            </Text>
            <Text style={styles.profileAddress}>
              {userData?.walletAddress || "Loading..."}
            </Text>
          </View>
          <ProfileRightArrow />
        </TouchableOpacity>
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#4CD964' }]}>
              <Image source={phoneIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>Recent Calls</Text>
          </View>
          <RightArrow />
        </View>
        {/* Change Theme row with extra text next to the switch */}
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#000' }]}>
              <Image source={moonIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>
              {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </Text>
          </View>
          <View style={styles.switchContainer}>
            <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
  <View style={styles.settingsItem}>
    <View style={styles.itemLeft}>
      <View style={[styles.iconBackground, { backgroundColor: '#FF9500' }]}>
        <Image source={bellIcon} style={styles.icon} />
      </View>
      <Text style={styles.itemTitle}>Notifications</Text>
    </View>
    <RightArrow />
  </View>
</TouchableOpacity>
        <View style={styles.settingsItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBackground, { backgroundColor: '#8E8E93' }]}>
              <Image source={lockIcon} style={styles.icon} />
            </View>
            <Text style={styles.itemTitle}>Privacy and Security</Text>
          </View>
          <RightArrow />
        </View>
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
        <View style={styles.accountActionsContainer}>
            <TouchableOpacity onPress={() => logout(navigation)}>
                <View style={styles.accountActionItem}>
                <Text style={styles.deleteTitle}>Logout</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => console.log('Delete Account pressed')}>
                <View style={styles.accountActionItem}>
                <Text style={[styles.deleteTitle, { color: '#FF3B30' }]}>Delete Account</Text>
                </View>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// Function to generate styles based on isDarkMode.
const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1C1C1D' : '#F2F2F2',
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
      color: isDarkMode ? '#fff' : '#333333',
    },
    copyAddressButton: {
      fontSize: 13,
      color: '#007AFF',
    },
    copyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    scrollContainer: {
      flex: 1,
    },
    profileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
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
      paddingLeft: 5,
    },
    profileName: {
      fontSize: 19,
      fontFamily: 'SF-Pro-Text-Medium',
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333333',
      marginBottom: 4,
    },
    profileAddress: {
      fontSize: 13,
      color: isDarkMode ? '#1E90FF' : '#1E90FF',
      marginTop: 4,
    },
    settingsItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#EFEFEF',
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
      color: isDarkMode ? '#fff' : '#333333',
    },
    deleteTitle: {
      fontSize: 16,
      color: '#EB5545'
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
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
    accountActionsContainer: {
        marginTop: 35,
        borderTopWidth: 1,
        borderTopColor: isDarkMode ? '#333' : '#ddd',
    },
    accountActionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? '#333' : '#EFEFEF',
    },

  });
