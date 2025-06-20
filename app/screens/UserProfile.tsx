import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeToggle } from '../../utils/GlobalUtils/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData } from '../../backend/Supabase/RegisterUser';
import { supabase } from '../../backend/Supabase/Supabase';
import { format } from 'date-fns';
import { handleOpenEtherscan } from '../../utils/MyProfileUtils/OpenEtherscan';
import { handleCopyAddress } from '../../utils/MyProfileUtils/CopyAddress';
import { handleCopyUsername } from '../../utils/MyProfileUtils/CopyUsername';

export default function UserProfile() {
  const navigation = useNavigation();
  const route = useRoute();
  const { walletAddress } = route.params as { walletAddress: string };

  const { currentTheme } = useThemeToggle();
  const isDarkMode = currentTheme === 'dark';
  const [copyWalletText, setCopyWalletText] = useState('');
  const [copyUsernameText, setCopyUsernameText] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const styles = getStyles(isDarkMode);

  useEffect(() => {
    if (walletAddress) {
      loadUserData(walletAddress);
    }
  }, [walletAddress]);

  // --- MODIFIED loadUserData FUNCTION ---
  const loadUserData = async (address: string) => {
    try {
      // 1. Prioritize fetching fresh data from Supabase
      console.log("☁️ Fetching user profile from Supabase for", address);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', address)
        .single();

      // 2. If fetch is successful, update UI and save to cache
      if (data && !error) {
        console.log("✅ Successfully fetched user profile from Supabase");
        const formattedUser: UserData = {
          walletAddress: data.wallet_address,
          username: data.username,
          name: data.name,
          avatar: data.avatar,
          bio: data.bio,
          created_at: data.created_at,
        };

        // Update the UI with the fresh data
        setUserData(formattedUser);

        // Save the fresh data to AsyncStorage for caching
        await AsyncStorage.setItem(address, JSON.stringify(formattedUser));
        console.log("💾 User profile cached in AsyncStorage for", address);
        return; // Exit function after successful operation
      }

      // 3. If fetching from Supabase fails, log the error
      if (error) {
        console.error("❌ Error fetching from Supabase:", error.message);
      }

      // 4. As a fallback, try to load from the local cache
      console.log("🤔 Fetch failed. Attempting to load from local cache...");
      const cachedData = await AsyncStorage.getItem(address);
      if (cachedData) {
        setUserData(JSON.parse(cachedData));
        console.log("📱 Loaded user data from cache for", address);
      } else {
        console.warn("🚫 No cached data found for this user.");
      }

    } catch (err) {
      // This will catch any other unexpected errors
      console.error("❌ A critical error occurred in loadUserData:", err);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" style={{ marginRight: 4 }} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer} pointerEvents="none">
          <Text style={styles.headerTitleText}>User Profile</Text>
        </View>
      </View>

      <Image
        source={userData?.avatar === "default" || !userData?.avatar
          ? require('../../assets/images/default-user-avatar.jpg')
          : { uri: userData?.avatar }
        }
        style={styles.avatar}
      />
      <Text style={styles.name}>{userData?.name || "NodeLink User"}</Text>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Wallet Address</Text>
          <TouchableOpacity onPress={() => handleCopyAddress(userData, setCopyWalletText)}
            onLongPress={() => handleOpenEtherscan(userData)}>
            <Text style={styles.wallet}>{userData?.walletAddress || "Loading..."}</Text>
          </TouchableOpacity>
          {copyWalletText ? <Text style={styles.waCopyMessage}>{copyWalletText}</Text> : null}
        </View>
        <View style={styles.separator} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Username</Text>
          <TouchableOpacity onPress={() => handleCopyUsername(userData, setCopyUsernameText)}>
            <Text style={styles.username}>@{userData?.username || "loading..."}</Text>
          </TouchableOpacity>
          {copyUsernameText ? <Text style={styles.uCopyMessage}>{copyUsernameText}</Text> : null}
        </View>
        <View style={styles.separator} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Bio</Text>
          <Text style={styles.infoText}>{userData?.bio || "Im not being spied on!"}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.infoRow}>
          <Text style={styles.label}>Joined</Text>
          <Text style={styles.infoText}>
            {userData?.created_at
              ? format(new Date(userData.created_at), 'MMMM d, yyyy')
              : "N/A"}
          </Text>
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