import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Alert, BackHandler, Linking, Platform } from "react-native";
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App'; // Adjust path

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

const AuthScreen = () => {
  const theme = useColorScheme(); // Detect system theme (light/dark)

  // Choose the correct support icon based on the theme
  const supportIcon = theme === 'dark' 
    ? require('../../assets/images/support-logo-white.png')  // Dark Mode
    : require('../../assets/images/support-logo-black.png'); // Light Mode

      // Choose the correct dapp icon based on the theme
    const logoIcon = theme === 'dark' 
    ? require('../../assets/images/logo-white.png')  // Dark Mode
    : require('../../assets/images/logo-black.png'); // Light Mode

  // Function to open email app
  const sendEmail = () => {
    const recipients = ['faik15748@gmail.com', 'ishazzeyfr@icloud.com'];                        //  Declares and initializes an array named recipients that contains two email addresses.
    const subject = encodeURIComponent('Support Request');                                      //  This encodes the string 'Support Request' into a format that can be safely used in a URL.
    const body = encodeURIComponent('Hello NodeLink developers,\n\nI need help with...');       //  This encodes a predefined email body into a format suitable for use in a URL.

    const mailtoURL = `mailto:${recipients.join(',')}?subject=${subject}&body=${body}`;         // This constructs a mailto: URL that can open the user's email app with predefined recipients, subject, and body.


    Linking.canOpenURL(mailtoURL)                                   // Check if an email app is available
      .then((supported) => {
        if (supported) {
          Linking.openURL(mailtoURL);                               // Open the email app with the pre-filled email 
        } else {
          Alert.alert('Error', 'Email app is not available');       // Show an error message
        }
      });
  };

  const navigation = useNavigation<AuthScreenNavigationProp>();     // This gets access to the navigation object in a React Native app that uses React Navigation. The navigation object allows screen transitions (e.g., navigating between pages).

  const handleConnectMetaMask = () => {
    console.log('Connect MetaMask Pressed');
    // Implement MetaMask connection logic here
  };

  // Close app on Android but not on iOS (against Apple policy)
  const handleExit = () => {
    if (Platform.OS === "android") {
      BackHandler.exitApp(); // ✅ Works only on Android
    } else {
      Alert.alert(
        "Exit App",
        "Please close the app manually by swiping up.",
        [{ text: "OK", style: "cancel" }]
      );
    }
  };

  // gives and alert asking if we want to send mail to the developers
  const handleSupport = () => {
    Alert.alert(
      'Contact Support',
      'Do you want to send mail to the developers?',
      [
        { text: 'No', style: 'cancel' },         
        { text: 'Yes', onPress: sendEmail },
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={[theme === 'dark' ? styles.darkContainer : styles.lightContainer]}>

      {/* Header */}
      <View style={styles.header}>

        {/* Exit Button*/}
        <Text style={styles.headerButton} onPress={handleExit}>Exit</Text>

        {/* Support Icon - Sends mail to the creators */}
        <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>

          {/*imported support logo here*/}
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
      <TouchableOpacity style={styles.connectButton} onPress={handleConnectMetaMask}>
        <Image source={require('../../assets/images/metamask.png')} style={styles.icon} />
        <Text style={styles.connectButtonText}>Connect Metamask</Text>
      </TouchableOpacity>

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
    top: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
  },
  headerButton: {
    color: '#007AFF',
    fontSize: 21,
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
  supportButton: {
    padding: 5, 
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
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default AuthScreen;