import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

// Define a TypeScript type for the navigation stack.
// This helps enforce type safety and ensures that only valid screens
// and their expected parameters are used throughout the app.
type RootStackParamList = {
  TOS: undefined; // "TOS" (Terms of Service) screen, which does not require any parameters.
  Auth: undefined; // "Auth" (Authentication) screen, also without any parameters.
};

const TosScreen = () => {
  // Initialize navigation using React Navigation.
  // This allows us to navigate between different screens in the app.
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Detect if the device is in dark mode.
  // This will dynamically switch styles based on the system theme.
  const isDarkMode = useColorScheme() === "dark";

  // Define a color scheme that adjusts based on the system's dark mode setting.
  const colors = {
    background: isDarkMode ? "#121212" : "#ffffff", // Dark mode background vs light mode background.
    text: isDarkMode ? "#ffffff" : "#333333", // Dark mode text vs light mode text.
    subHeading: isDarkMode ? "#BBBBBB" : "#555555", // Adjusted subheading color for readability.
    backButton: isDarkMode ? "#1E90FF" : "#007AFF", // Different back button color for better contrast.

    // The scrollbar color changes depending on dark or light mode.
    // The 'as' assertion ensures correct TypeScript typing ('black' | 'white').
    scrollbar: isDarkMode ? "white" : ("black" as "black" | "white"),
  };

  // i dont even need to say what this is, its basic css
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.backButtonText, { color: colors.backButton }]}>
          {"Back"}
        </Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>
        Terms of Service
      </Text>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        indicatorStyle={colors.scrollbar}
        scrollIndicatorInsets={{ right: 1 }}
      >
        <Text style={[styles.content, { color: colors.text }]}>
          {"\n\n"}
          <Text style={[styles.subHeading1, { color: colors.subHeading }]}>
            Last Updated: [23-02-2025]
          </Text>
          {"\n\n"}
          <Text style={styles.intro}>
            Welcome to <Text style={styles.bold}>NodeLink</Text>. By accessing
            or using this decentralized application, you agree to be bound by
            these Terms of Service. If you do not agree with these Terms, please
            do not use the App.
          </Text>
          {"\n\n"}
          <Text style={[styles.subHeading, { color: colors.subHeading }]}>
            1. Nature of the Service
          </Text>
          {"\n"} - This App is a decentralized, open-source platform designed to
          enable blockchain interactions.
          {"\n"} - The App operates on a blockchain network, meaning no central
          authority has control.
          {"\n\n"}
          <Text style={[styles.subHeading, { color: colors.subHeading }]}>
            2. No Custodial Control
          </Text>
          {"\n"} - We do not store or control user data, private keys, or
          assets.
          {"\n"} - Losing your private key may result in permanent loss of
          access.
          {"\n\n"}
          <Text style={[styles.subHeading, { color: colors.subHeading }]}>
            3. Open-Source Software
          </Text>
          {"\n"} - This App is developed as an open-source project.
          {"\n"} - You are free to inspect, modify, and distribute the code.
          {"\n\n"}
          <Text style={[styles.subHeading, { color: colors.subHeading }]}>
            4. No Warranties & No Liability
          </Text>
          {"\n"} - The App is provided &ldquo;as is&quot; without warranties.
          {"\n"} - We are not liable for financial losses or security breaches.
          {"\n\n"}
          <Text style={[styles.subHeading, { color: colors.subHeading }]}>
            5. User Responsibilities
          </Text>
          {"\n"} - You agree to use the App in compliance with all applicable
          laws and regulations.
          {"\n"} - You must not use the App for illegal activities, including
          fraud, money laundering, or any other unlawful actions.
          {"\n"} - You are responsible for understanding and managing gas fees,
          blockchain transactions, and wallet security.
          {"\n\n"}
          <Text style={[styles.subHeading, { color: colors.subHeading }]}>
            6. Security & Risks
          </Text>
          {"\n"}- The App does not provide refunds or transaction reversals
          since blockchain transactions are irreversible.
          {"\n"} - You are responsible for using secure devices, maintaining
          privacy, and protecting your credentials.
          {"\n"} - Engaging with smart contracts and decentralized systems
          carries risks, including potential loss of funds due to contract
          exploits or bugs.
          {"\n\n"}
          <Text style={[styles.subHeading, { color: colors.subHeading }]}>
            7. No Support or Maintenance
          </Text>
          {"\n"} - Since this is an open-source and decentralized project, there
          is no official customer support or guarantees of ongoing maintenance.
          {"\n"} - Any issues should be raised within the open-source community
          or relevant repositories.
          {"\n\n"}
          <Text style={[styles.subHeading, { color: colors.subHeading }]}>
            8. Regulatory Compliance
          </Text>
          {"\n"} - You acknowledge that decentralized applications may be
          subject to evolving regulations in various jurisdictions.
          {"\n"} - It is your responsibility to comply with local laws governing
          digital assets and blockchain usage.
          {"\n\n"}
          <Text style={[styles.subHeading, { color: colors.subHeading }]}>
            9. Changes to These Terms
          </Text>
          {"\n"} - We may update these Terms from time to time. Changes will be
          posted within the open-source repository or app interface.
          {"\n"} - Your continued use of the App after changes indicates your
          acceptance of the revised Terms.
          {"\n\n"}
          <Text style={[styles.subHeading, { color: colors.subHeading }]}>
            10. Governing Law & Dispute Resolution
          </Text>
          {"\n"} - These Terms are governed by [applicable jurisdiction, if any,
          or a disclaimer stating that there is no specific jurisdiction due to
          decentralization].
          {"\n"} - Any disputes should be resolved through community governance
          mechanisms or decentralized dispute resolution protocols, where
          applicable.
          {"\n\n"}
          <Text style={[styles.subHeading, { color: colors.subHeading }]}>
            11. Contact & Feedback
          </Text>
          {"\n"} - Since this is an open-source project, feedback and
          contributions are welcome via [GitHub] or contact email:
          [ishazzeyfr@icloud.com].
          {"\n"} - If you have concerns, please raise them within the
          open-source community.
          {"\n\n"}
          <Text style={styles.bold}>
            By using NodeLink, you acknowledge and accept these Terms of
            Service.
          </Text>
        </Text>
      </ScrollView>
    </View>
  );
};

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
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  intro: {
    fontSize: 15,
    fontWeight: "bold",
  },
  subHeading: {
    fontSize: 16,
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

export default TosScreen; // this is imported by my auth.tsx file
