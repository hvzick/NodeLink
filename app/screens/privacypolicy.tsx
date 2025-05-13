import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the type for navigation
type RootStackParamList = {
  PrivacyPolicy: undefined;
  Auth: undefined;
};

const PrivacyPolicyScreen = () => {
 // Initialize navigation using React Navigation.
  // This allows us to navigate between different screens in the app.
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Detect if the device is in dark mode.
  // This will dynamically switch styles based on the system theme.
  const isDarkMode = useColorScheme() === 'dark';

  // Define a color scheme that adjusts based on the system's dark mode setting.
  const colors = {
    background: isDarkMode ? '#121212' : '#ffffff',     // Dark mode background vs light mode background.
    text: isDarkMode ? '#ffffff' : '#333333',           // Dark mode text vs light mode text.
    subHeading: isDarkMode ? '#BBBBBB' : '#555555',     // Adjusted subheading color for readability.
    backButton: isDarkMode ? '#1E90FF' : '#007AFF',     // Different back button color for better contrast.
    
    // The scrollbar color changes depending on dark or light mode.
    // The 'as' assertion ensures correct TypeScript typing ('black' | 'white').
    scrollbar: isDarkMode ? 'white' : 'black' as 'black' | 'white',
  };
  

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={[styles.backButtonText, { color: colors.backButton }]}>{"Back"}</Text>
      </TouchableOpacity>

      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>

      {/* Content with Scrollbar */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        indicatorStyle={colors.scrollbar} 
        scrollIndicatorInsets={{ right: 1 }}
>

        <Text style={[styles.content, { color: colors.text }]}>
          {"\n\n"}  
          <Text style={[styles.subHeading1, { color: colors.subHeading }]}>Last Updated: [23-02-2025]</Text>  
          {"\n\n"}
          <Text style={styles.intro}>
            Welcome to <Text style={styles.bold}>NodeLink</Text>. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our decentralized application.
          </Text>
          {"\n\n"}

          <Text style={[styles.subHeading, { color: colors.subHeading }]}>1. Data We Do Not Collect</Text>  
          {"\n"}
          - As a decentralized application, we do not collect or store personal data on centralized servers.
          {"\n"} 
          - We do not have access to your private keys, wallet balances, or transaction history.
          {"\n\n"}

          <Text style={[styles.subHeading, { color: colors.subHeading }]}>2. Blockchain Data</Text>  
          {"\n"}
          - Transactions and interactions occur on the blockchain and are publicly visible. We do not control or store this data.
          {"\n"}
          - Users are responsible for managing their own blockchain data and wallet security.
          {"\n\n"}

          <Text style={[styles.subHeading, { color: colors.subHeading }]}>3. Use of Third-Party Services</Text>  
          {"\n"} 
          - Our App may integrate with third-party services (e.g., wallet providers, blockchain nodes) that have their own privacy policies.
          {"\n"} 
          - We recommend reviewing the privacy policies of these third-party services.
          {"\n\n"}

          <Text style={[styles.subHeading, { color: colors.subHeading }]}>4. Security Measures</Text>  
          {"\n"}
          - We do not store sensitive user data, reducing the risk of breaches.
          {"\n"}
          - Users should take precautions such as securing private keys and enabling two-factor authentication where applicable.
          {"\n\n"}

          <Text style={[styles.subHeading, { color: colors.subHeading }]}>5. Cookies and Tracking</Text>  
          {"\n"}
          - We do not use cookies, trackers, or analytics services that collect user data.
          {"\n"}
          - Any tracking or analytics would be performed by third-party services you choose to interact with.
          {"\n\n"}

          <Text style={[styles.subHeading, { color: colors.subHeading }]}>6. Your Rights and Control</Text>  
          {"\n"}
          - Since we do not collect personal data, we do not store information that can be modified or deleted.
          {"\n"}
          - You are in full control of your wallet, private keys, and blockchain interactions.
          {"\n\n"}

          <Text style={[styles.subHeading, { color: colors.subHeading }]}>7. Changes to This Policy</Text>  
          {"\n"}
          - We may update this Privacy Policy periodically. Changes will be communicated via open-source repositories or within the app.
          {"\n"}
          - Your continued use of the App after changes constitutes acceptance of the updated Privacy Policy.
          {"\n\n"}

          <Text style={[styles.subHeading, { color: colors.subHeading }]}>8. Contact & Feedback</Text>  
          {"\n"}
          - For questions or concerns, reach out to us via [ishazzeyfr@icloud.com].
          {"\n"}
          - Community feedback and contributions are welcome through our open-source repository.
          {"\n\n"}

          <Text style={styles.bold}>By using NodeLink, you acknowledge and accept this Privacy Policy.</Text>  
        </Text>
      </ScrollView>
    </View>
  );
};

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    position: "absolute",
    top: 50,
    paddingLeft: 20,
  },
  backButtonText: {
    fontSize: 20,
  },  
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 40,
  },
  subHeading1: {
    fontSize: 25,
    fontWeight: "600",
    marginBottom: 10,
  },
  intro: {
    fontSize: 15,
    fontWeight: "bold",
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  bold: {
    fontWeight: "bold",
  },
  scrollContainer: {
    paddingHorizontal: 10,
    paddingBottom: 50,
  },
  content: {
    fontSize: 14,
    textAlign: "left",
    marginBottom: 10,
  },
});

export default PrivacyPolicyScreen;
