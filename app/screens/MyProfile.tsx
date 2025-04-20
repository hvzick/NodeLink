import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeToggle } from '../../utils/GlobalUtils/ThemeProvider';
import { copyToClipboard } from '../../utils/GlobalUtils/CopyToClipboard';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyProfile() {
  const navigation = useNavigation();
  const { currentTheme } = useThemeToggle();
  const isDarkMode = currentTheme === 'dark';
  const [copyWalletText, setCopyWalletText] = useState('');
  const [copyUsernameText, setCopyUsernameText] = useState('');
  const styles = getStyles(isDarkMode);

  const handleCopyAddress = async () => {
    const success = await copyToClipboard('0xe65EAC370dB1079688f8e1e4B9a35A841aac2bac');
    if (success) {
      setCopyWalletText('Wallet Address Copied!');
      setTimeout(() => setCopyWalletText(''), 2000);
    }
  };

  const handleCopyUsername = async () => {
    const success = await copyToClipboard('@h44zick');
    if (success) {
      setCopyUsernameText('Username Copied!');
      setTimeout(() => setCopyUsernameText(''), 2000);
    }
  };

  const handleOpenEtherscan = async () => {
    const address = '0xe65EAC370dB1079688f8e1e4B9a35A841aac2bac';
    const url = `https://sepolia.etherscan.io/address/${address}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening Etherscan:', error);
    }
  };

  const handleEditProfile = () => {
    // TODO: Implement edit profile functionality
    console.log('Edit profile pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" style={{ marginRight: 4 }} />
          <Text style={styles.backButtonText}>Settings</Text>
        </TouchableOpacity>

        {/* Centered title, non-touchable */}
        <View style={styles.headerTitleContainer} pointerEvents="none">
          <Text style={styles.headerTitleText}>My Profile</Text>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <Image source={require('../../assets/images/default-user-avatar.jpg')} style={styles.avatar} />
      <Text style={styles.name}>Sheikh Hazik</Text>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Wallet Address</Text>
          <TouchableOpacity onPress={handleCopyAddress} onLongPress={handleOpenEtherscan}>
            <Text style={styles.wallet}>0xe65EAC370dB1079688f8e1e4B9a35A841aac2bac</Text>
          </TouchableOpacity>
          {copyWalletText ? <Text style={styles.waCopyMessage}>{copyWalletText}</Text> : null}
        </View>
        <View style={styles.separator} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Username</Text>
          <TouchableOpacity onPress={handleCopyUsername}>
            <Text style={styles.username}>@h44zick</Text>
          </TouchableOpacity>
          {copyUsernameText ? <Text style={styles.uCopyMessage}>{copyUsernameText}</Text> : null}
        </View>
        <View style={styles.separator} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Bio</Text>
          <Text style={styles.infoText}>Dev of NodeLink</Text>
        </View>
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1C1C1D' : '#F2F2F2',
      alignItems: 'center',
    },
    headerContainer: {
      height: 40,
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#1C1C1D' : '#F2F2F2',
      width: '100%',
    },
    backButton: {
      position: 'absolute',
      left: 10,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1,
    },
    backButtonText: {
      fontSize: 18,
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
      fontWeight: '600',
      fontFamily: 'SF-Pro-Text-Medium',
      color: isDarkMode ? '#fff' : '#333333',
    },
    avatar: {
      top: 10,
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    name: {
      top: 10,
      fontSize: 22,
      fontFamily: 'SF-Pro-Text-Medium',
      marginTop: 10,
      color: isDarkMode ? '#fff' : '#333333',
    },
    infoBox: {
      top: 10,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
      width: '90%',
      borderRadius: 12,
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginVertical: 20,
    },
    infoRow: {
      paddingVertical: 10,
    },
    label: {
      fontSize: 12,
      color: 'gray',
      marginBottom: 4,
    },
    wallet: {
      fontSize: 16,
      color: '#00A86B',
      flexWrap: 'wrap',
    },
    username: {
      fontSize: 16,
      color: '#007AFF',
    },
    infoText: {
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#333333',
    },
    separator: {
      height: 1,
      backgroundColor: isDarkMode ? '#333' : '#EFEFEF',
      marginVertical: 0,
    },
    waCopyMessage: {
      fontSize: 14,
      color: '#00A86B',
      marginTop: 5,
      fontWeight: '400',
    },
    uCopyMessage: {
      fontSize: 14,
      color: '#007AFF',
      marginTop: 5,
      fontWeight: '400',
    },
    editButton: {
      position: 'absolute',
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1,
    },
    editButtonText: {
      fontSize: 18,
      color: '#007AFF',
    },
  });