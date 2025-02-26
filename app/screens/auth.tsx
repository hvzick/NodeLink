import { View, Text, TouchableOpacity, Image, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import React, { useState } from 'react';
import { handleConnectPress} from "../../utils/WalletConnect";
import { handleSupport } from "../../utils/HandleAuthScreenSupport";
import { handleExit } from "../../utils/HandleAuthScreenExit";
import SignClient from "@walletconnect/sign-client";

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

const AuthScreen = () => {
  const theme = useColorScheme();
  const supportIcon = theme === 'dark' 
    ? require('../../assets/images/support-logo-white.png')  
    : require('../../assets/images/support-logo-black.png'); 

  const logoIcon = theme === 'dark' 
    ? require('../../assets/images/logo-white.png')  
    : require('../../assets/images/logo-black.png'); 


  const navigation = useNavigation<AuthScreenNavigationProp>();  

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connector, setConnector] = useState<InstanceType<typeof SignClient> | null>(null);

  return (
    <SafeAreaView style={[theme === 'dark' ? styles.darkContainer : styles.lightContainer]}>
      {/* Header */}
      <View style={styles.header}>
        {/* Exit Button*/}
        <Text style={styles.headerButton} onPress={handleExit}>Exit</Text>

        {/* Support Icon */}
        <TouchableOpacity onPress={handleSupport}>
          <Image source={supportIcon} style={styles.supportIcon}/>
        </TouchableOpacity>
      </View>

      {/* Logo */}
      <Image source={logoIcon} style={styles.logo} />
      
      {/* App Information */}
      <Text style={[styles.title, theme === 'dark' ? styles.darkText : styles.lightText]}>Node Link</Text>
      <Text style={[styles.subtitle, theme === 'dark' ? styles.darkText : styles.lightText]}>
        Secure Decentralized p2p Messaging
      </Text>
      <Text style={[styles.description, theme === 'dark' ? styles.darkText : styles.lightText]}>
        Web3 Powered Communication
      </Text>

      {/* MetaMask Connect Button */}
      <TouchableOpacity 
        style={styles.connectButton} 
        onPress={() => handleConnectPress(setLoading, setWalletAddress, setConnector, navigation)} // Use the imported function here
      >
        <Image source={require('../../assets/images/metamask.png')} style={styles.icon} />
        <Text style={styles.connectButtonText}>Connect Metamask</Text>
      </TouchableOpacity>
      {walletAddress && <Text style={styles.connectedText}>Connected: {walletAddress}</Text>}
  
      {/* Terms and Privacy Policy */}
      <Text style={[styles.termsText, theme === 'dark' ? styles.darkText : styles.lightText]}>
        By connecting your wallet, you agree to our {' '}

        <Text style={styles.link} onPress={() => navigation.navigate('TOS')}>Terms of Service</Text> and {' '}
        <Text style={styles.link} onPress={() => navigation.navigate('PrivacyPolicy')}>Privacy Policy</Text>.
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  lightContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  darkContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    paddingHorizontal: 20,
  },
  header: {
    position: 'absolute',
    top: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
  },
  headerButton: {
    color: '#007AFF',
    fontSize: 21,
  },
  connectedText: { 
    marginTop: 20, 
    fontSize: 14, 
    color: '#0FA958' 
  },
  logo: {
    width: 130,
    height: 130,
    marginBottom: 40,
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    marginBottom: 100,
    fontFamily: "MontserratAlternates-Regular",
  },
  subtitle: { 
    fontSize: 16,
    fontFamily: "Inter_28pt-Medium",
    fontWeight: "bold",
    marginBottom: 10, 
  },
  description: {
    fontFamily: "Inter_18pt-Medium",
    fontSize: 14,
    marginBottom: 30,
  },
  lightText: {
    color: '#000',
  },
  darkText: {
    color: '#FFFFFF',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0376C9',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginBottom: 20,
  },
  icon: {
    width: 24,
    height: 20,
    marginRight: 10,
  },
  supportIcon: {
    width: 25,
    height: 25,
    marginRight: 1,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    marginLeft: 20,
    marginRight: 20,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default AuthScreen;
