import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeToggle } from '../../utils/GlobalUtils/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserData } from '../../backend/Supabase/RegisterUser';
import { supabase } from '../../backend/Supabase/Supabase';
import { format } from 'date-fns';
import { handleOpenEtherscan } from '../../utils/MyProfileUtils/OpenEtherscan';
import { handleCopyAddress } from '../../utils/MyProfileUtils/CopyAddress';
import { handleCopyUsername } from '../../utils/MyProfileUtils/CopyUsername';
import { RootStackParamList } from '../App';
import { useChat } from '../../utils/ChatUtils/ChatContext';

export default function UserProfile() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { walletAddress } = route.params as { walletAddress: string };

  const { addOrUpdateChat, chatList } = useChat();

  const { currentTheme } = useThemeToggle();
  const isDarkMode = currentTheme === 'dark';
  const [copyWalletText, setCopyWalletText] = useState('');
  const [copyUsernameText, setCopyUsernameText] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const styles = getStyles(isDarkMode);

  useEffect(() => {
    if (walletAddress) {
      loadUserData(walletAddress);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (userData && chatList) {
      const conversationId = `convo_${userData.walletAddress}`;
      const exists = chatList.some(chat => chat.id === conversationId);
      if (exists) {
        setIsConnected(true);
      }
    }
  }, [userData, chatList]);


  const loadUserData = async (address: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', address)
        .single();

      if (data && !error) {
        const formattedUser: UserData = {
          walletAddress: data.wallet_address,
          username: data.username,
          name: data.name,
          avatar: data.avatar,
          bio: data.bio,
          created_at: data.created_at,
        };
        setUserData(formattedUser);
      } else if (error) {
        console.error("Error fetching from Supabase:", error.message);
      }
    } catch (err) {
      console.error("A critical error occurred in loadUserData:", err);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 2000);
  };

  // --- MODIFIED NAVIGATION LOGIC ---
  const handleSendMessage = () => {
    if (!isConnected || !userData) {
      return;
    }

    const conversationId = `convo_${userData.walletAddress}`;
    const avatarSource = userData.avatar === "default" || !userData.avatar
      ? require('../../assets/images/default-user-avatar.jpg')
      : { uri: userData.avatar };

    const chatExists = chatList.some(chat => chat.id === conversationId);

    if (!chatExists) {
      addOrUpdateChat({
        id: conversationId,
        name: userData.name || 'NodeLink User',
        avatar: avatarSource,
        message: 'Conversation started.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      });
    }

    // This ensures the correct navigation stack.
    // 1. Navigate to the Main screen (your BottomTabs navigator). This action replaces
    //    the current screen (UserProfile) and any screens above Main (like Search).
    navigation.navigate('Main');
    
    // 2. Immediately push the ChatDetail screen on top of the Main screen.
    navigation.navigate('ChatDetail', {
        conversationId: conversationId,
        name: userData.name || 'NodeLink User',
        avatar: avatarSource,
    });
  }

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

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.sideBySideButton,
            isConnected ? styles.connectButtonConnected : styles.connectButtonDefault,
            isButtonPressed && !isConnected && styles.connectButtonPressed,
            (!userData || isConnecting) && styles.buttonDisabled,
          ]}
          onPress={handleConnect}
          onPressIn={() => setIsButtonPressed(true)}
          onPressOut={() => setIsButtonPressed(false)}
          activeOpacity={0.8}
          disabled={!userData || isConnecting || isConnected}
        >
          <Text style={[
              styles.buttonText,
              isConnected ? styles.connectButtonTextConnected : styles.connectButtonTextDefault,
          ]}>
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sideBySideButton,
            styles.sendMessageButton,
            isConnected && styles.sendMessageButtonEnabled,
            !isConnected && styles.buttonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!isConnected}
        >
          <Text style={[
            styles.buttonText,
            isConnected ? styles.sendMessageButtonTextEnabled : styles.buttonTextDisabled,
          ]}>
            Message
          </Text>
        </TouchableOpacity>
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
    infoRow: { paddingVertical: 10 },
    label: { fontSize: 12, color: 'gray', marginBottom: 4 },
    wallet: { fontSize: 16, color: '#00A86B', flexWrap: 'wrap' },
    username: { fontSize: 16, color: '#007AFF' },
    infoText: { fontSize: 16, color: isDarkMode ? '#fff' : '#333333' },
    separator: { height: 1, backgroundColor: isDarkMode ? '#333' : '#EFEFEF' },
    waCopyMessage: { fontSize: 14, color: '#00A86B', marginTop: 5, fontWeight: '400' },
    uCopyMessage: { fontSize: 14, color: '#007AFF', marginTop: 5, fontWeight: '400' },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '90%',
        marginTop: 10,
    },
    sideBySideButton: {
        width: '48%',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    connectButtonDefault: {
        backgroundColor: 'transparent',
        borderColor: isDarkMode ? '#fff' : '#000',
    },
    connectButtonTextDefault: {
        color: isDarkMode ? '#fff' : '#000',
    },
    connectButtonPressed: {
        backgroundColor: 'rgba(0, 122, 255, 0.2)',
        borderColor: 'rgba(0, 122, 255, 0.4)',
    },
    connectButtonConnected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    connectButtonTextConnected: {
        color: '#FFFFFF',
    },
    sendMessageButton: {
        backgroundColor: 'transparent',
        borderColor: isDarkMode ? '#555' : '#ccc',
    },
    sendMessageButtonEnabled: {
        borderColor: isDarkMode ? '#fff' : '#000',
    },
    sendMessageButtonTextEnabled: {
        color: isDarkMode ? '#fff' : '#000',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonTextDisabled: {
        color: isDarkMode ? '#555' : '#ccc',
    },
  });
