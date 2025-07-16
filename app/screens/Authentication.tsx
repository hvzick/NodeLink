// screens/Authentication.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import SignClient from '@walletconnect/sign-client';
import { triggerTapHapticFeedback } from '../../utils/GlobalUtils/TapHapticFeedback';
import { handleConnectPress } from '../../utils/AuthenticationUtils/WalletConnect';
import { handleSupport } from '../../utils/AuthenticationUtils/HandleAuthScreenSupport';
import { handleExit } from '../../utils/AuthenticationUtils/HandleAuthScreenExit';
import { useAuth } from '../../utils/AuthenticationUtils/AuthContext';
import { RootStackParamList } from '../App';

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

export default function AuthScreen() {
  const theme = useColorScheme();
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const { setIsLoggedIn } = useAuth();

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connector, setConnector] = useState<InstanceType<typeof SignClient> | null>(null);

  const onConnect = async () => {
    triggerTapHapticFeedback();
    try {
      await handleConnectPress(
        setLoading,
        setWalletAddress,
        setConnector,
        navigation,
        setIsLoggedIn
      );
      // handleConnectPress will set isLoggedIn(true) and reset to Main
    } catch (err) {
      console.error('Connect failed', err);
    }
  };

  return (
    <SafeAreaView style={[ theme === 'dark' ? styles.darkContainer : styles.lightContainer ]}>
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={styles.headerButton}
          onPress={() => { handleExit(); triggerTapHapticFeedback(); }}
        >
          Exit
        </Text>
        <TouchableOpacity onPress={() => { handleSupport(); triggerTapHapticFeedback(); }}>
          <Image
            source={
              theme === 'dark'
                ? require('../../assets/images/support-logo-white.png')
                : require('../../assets/images/support-logo-black.png')
            }
            style={styles.supportIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Logo */}
      <Image
        source={
          theme === 'dark'
            ? require('../../assets/images/logo-white.png')
            : require('../../assets/images/logo-black.png')
        }
        style={styles.logo}
      />

      {/* Title & Subtitle */}
      <Text style={[styles.title, theme === 'dark' ? styles.darkText : styles.lightText]}>
        Node Link
      </Text>
      <Text style={[styles.subtitle, theme === 'dark' ? styles.darkText : styles.lightText]}>
        Secure Decentralized p2p Messaging
      </Text>
      <Text style={[styles.description, theme === 'dark' ? styles.darkText : styles.lightText]}>
        Web3 Powered Communication
      </Text>

      {/* Connect Button */}
      <TouchableOpacity
        style={styles.connectButton}
        onPress={onConnect}
        disabled={loading}
      >
        <Image
          source={require('../../assets/images/metamask.png')}
          style={styles.icon}
        />
        <Text style={styles.connectButtonText}>
          {loading ? 'Connecting...' : 'Connect Metamask'}
        </Text>
      </TouchableOpacity>

      {/* Show connected address */}
      {walletAddress && (
        <Text style={styles.connectedText}>Connected: {walletAddress}</Text>
      )}

      {/* Terms & Privacy */}
      <Text style={[styles.termsText, theme === 'dark' ? styles.darkText : styles.lightText]}>
        By connecting your wallet, you agree to our{' '}
        <Text style={styles.link} onPress={() => navigation.navigate('TOS')}>
          Terms of Service
        </Text>{' '}
        and{' '}
        <Text style={styles.link} onPress={() => navigation.navigate('PrivacyPolicy')}>
          Privacy Policy
        </Text>.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  lightContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20
  },
  darkContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    paddingHorizontal: 20
  },
  header: {
    position: 'absolute',
    top: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 3
  },
  headerButton: {
    color: '#007AFF',
    fontSize: 21
  },
  supportIcon: {
    width: 25,
    height: 25
  },
  logo: {
    width: 130,
    height: 130,
    marginBottom: 40
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    marginBottom: 100,
    fontFamily: 'MontserratAlternates-Regular'
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Inter_28pt-Medium'
  },
  description: {
    fontSize: 14,
    marginBottom: 30,
    fontFamily: 'Inter_18pt-Medium'
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0376C9',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginBottom: 20
  },
  icon: {
    width: 24,
    height: 20,
    marginRight: 10
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  connectedText: {
    marginTop: 20,
    fontSize: 14,
    color: '#0FA958'
  },
  termsText: {
    marginHorizontal: 20,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline'
  },
  lightText: {
    color: '#000'
  },
  darkText: {
    color: '#FFF'
  }
});
