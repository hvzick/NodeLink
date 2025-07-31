// screens/Authentication.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useColorScheme,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import SignClient from "@walletconnect/sign-client";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";
import { triggerTapHapticFeedback } from "../../utils/GlobalUtils/TapHapticFeedback";
import { handleConnectPress } from "../../utils/AuthenticationUtils/WalletConnect";
import { handleSupport } from "../../utils/AuthenticationUtils/HandleAuthScreenSupport";
import { handleExit } from "../../utils/AuthenticationUtils/HandleAuthScreenExit";
import { useAuth } from "../../utils/AuthenticationUtils/AuthContext";
import { RootStackParamList } from "../App";
import { Ionicons } from "@expo/vector-icons";
// Import Firebase phone auth functions
import { sendOTP, verifyOTP } from "../../utils/AuthenticationUtils/PhoneAuth";

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, "Auth">;

// Login methods enum
enum LoginMethod {
  METAMASK = "metamask",
  PHONE = "phone",
  EMAIL = "email",
}

export default function AuthScreen() {
  const theme = useColorScheme();
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const { setIsLoggedIn } = useAuth();

  // Wallet connection states
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connector, setConnector] = useState<InstanceType<
    typeof SignClient
  > | null>(null);

  // Login method and form states
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(
    LoginMethod.METAMASK
  ); // Default to Metamask
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Country code picker states
  const [countryCode, setCountryCode] = useState<CountryCode>("US");
  const [country, setCountry] = useState<Country | null>(null);
  const [callingCode, setCallingCode] = useState("1");
  const [withCountryNameButton, setWithCountryNameButton] = useState(false);

  // Firebase phone auth state
  const [confirm, setConfirm] = useState<any>(null);

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
    } catch (err) {
      console.error("Connect failed", err);
    }
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle phone number login with Firebase
  const handlePhoneLogin = async () => {
    triggerTapHapticFeedback();

    const fullPhoneNumber = `+${callingCode}${phoneNumber.replace(/\s/g, "")}`;

    const success = await sendOTP(fullPhoneNumber, setAuthLoading, setConfirm);
    if (success) {
      setIsVerificationStep(true);
    }
  };

  // Handle email login
  const handleEmailLogin = async () => {
    triggerTapHapticFeedback();

    if (!validateEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 6 characters long."
      );
      return;
    }

    setAuthLoading(true);

    try {
      console.log("📧 Logging in with email:", email);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert("Success", "Login successful!");
      setIsLoggedIn(true);
    } catch (error) {
      console.error("❌ Email login error:", error);
      Alert.alert("Error", "Failed to login. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle verification code submission with Firebase
  const handleVerificationCode = async () => {
    triggerTapHapticFeedback();

    const fullPhoneNumber = `+${callingCode}${phoneNumber.replace(/\s/g, "")}`;

    await verifyOTP(
      verificationCode,
      confirm,
      fullPhoneNumber,
      setWalletAddress, // This will store the phone number in walletAddress field
      setIsLoggedIn,
      setAuthLoading,
      navigation
    );
  };

  // Reset form data when switching login methods
  const handleMethodChange = (method: LoginMethod) => {
    setLoginMethod(method);
    setIsVerificationStep(false);
    setPhoneNumber("");
    setEmail("");
    setPassword("");
    setVerificationCode("");
    setConfirm(null); // Reset Firebase confirmation
    triggerTapHapticFeedback();
  };

  const isDark = theme === "dark";

  return (
    <SafeAreaView
      style={[isDark ? styles.darkContainer : styles.lightContainer]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.mainContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text
                style={styles.headerButton}
                onPress={() => {
                  handleExit();
                  triggerTapHapticFeedback();
                }}
              >
                Exit
              </Text>
              <TouchableOpacity
                onPress={() => {
                  handleSupport();
                  triggerTapHapticFeedback();
                }}
              >
                <Image
                  source={
                    isDark
                      ? require("../../assets/images/support-logo-white.png")
                      : require("../../assets/images/support-logo-black.png")
                  }
                  style={styles.supportIcon}
                />
              </TouchableOpacity>
            </View>

            {/* Logo Section */}
            <View style={styles.logoSection}>
              <Image
                source={
                  isDark
                    ? require("../../assets/images/logo-white.png")
                    : require("../../assets/images/logo-black.png")
                }
                style={styles.logo}
              />

              <Text
                style={[
                  styles.title,
                  isDark ? styles.darkText : styles.lightText,
                ]}
              >
                Node Link
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  isDark ? styles.darkText : styles.lightText,
                ]}
              >
                Secure Decentralized p2p Messaging
              </Text>
            </View>

            {/* Login Method Selector - Always Visible at Top */}
            <View style={styles.selectorContainer}>
              <Text
                style={[
                  styles.chooseMethodText,
                  isDark ? styles.darkText : styles.lightText,
                ]}
              >
                Choose your login method
              </Text>

              <View
                style={[
                  styles.methodSelector,
                  isDark && styles.darkMethodSelector,
                ]}
              >
                {/* Metamask Tab */}
                <TouchableOpacity
                  style={[
                    styles.methodTab,
                    loginMethod === LoginMethod.METAMASK &&
                      styles.activeMethodTab,
                    isDark && styles.darkMethodTab,
                  ]}
                  onPress={() => handleMethodChange(LoginMethod.METAMASK)}
                >
                  <Image
                    source={require("../../assets/images/metamask.png")}
                    style={[
                      styles.tabIcon,
                      loginMethod === LoginMethod.METAMASK &&
                        styles.activeTabIcon,
                    ]}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      loginMethod === LoginMethod.METAMASK &&
                        styles.activeMethodTabText,
                      isDark && styles.darkText,
                    ]}
                  >
                    Metamask
                  </Text>
                </TouchableOpacity>

                {/* Phone Tab */}
                <TouchableOpacity
                  style={[
                    styles.methodTab,
                    loginMethod === LoginMethod.PHONE && styles.activeMethodTab,
                    isDark && styles.darkMethodTab,
                  ]}
                  onPress={() => handleMethodChange(LoginMethod.PHONE)}
                >
                  <View style={[styles.tabIconContainer, styles.phoneTabIcon]}>
                    <Ionicons name="call" size={18} color="#fff" />
                  </View>
                  <Text
                    style={[
                      styles.methodTabText,
                      loginMethod === LoginMethod.PHONE &&
                        styles.activeMethodTabText,
                      isDark && styles.darkText,
                    ]}
                  >
                    Phone
                  </Text>
                </TouchableOpacity>

                {/* Email Tab */}
                <TouchableOpacity
                  style={[
                    styles.methodTab,
                    loginMethod === LoginMethod.EMAIL && styles.activeMethodTab,
                    isDark && styles.darkMethodTab,
                  ]}
                  onPress={() => handleMethodChange(LoginMethod.EMAIL)}
                >
                  <View style={[styles.tabIconContainer, styles.emailTabIcon]}>
                    <Ionicons name="mail" size={18} color="#fff" />
                  </View>
                  <Text
                    style={[
                      styles.methodTabText,
                      loginMethod === LoginMethod.EMAIL &&
                        styles.activeMethodTabText,
                      isDark && styles.darkText,
                    ]}
                  >
                    Email
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Forms */}
            <View style={styles.loginFormContainer}>
              {/* Metamask Login */}
              {loginMethod === LoginMethod.METAMASK && (
                <View style={styles.formContainer}>
                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={onConnect}
                    disabled={loading}
                  >
                    <Image
                      source={require("../../assets/images/metamask.png")}
                      style={styles.icon}
                    />
                    <Text style={styles.connectButtonText}>
                      {loading ? "Connecting..." : "Connect Metamask"}
                    </Text>
                  </TouchableOpacity>

                  {walletAddress && (
                    <Text style={styles.connectedText}>
                      Connected: {walletAddress}
                    </Text>
                  )}
                </View>
              )}

              {/* Phone Login with Country Code Picker */}
              {loginMethod === LoginMethod.PHONE && (
                <View style={styles.formContainer}>
                  {!isVerificationStep ? (
                    <>
                      <Text
                        style={[
                          styles.formTitle,
                          isDark ? styles.darkText : styles.lightText,
                        ]}
                      >
                        Enter your phone number
                      </Text>

                      {/* Country Code + Phone Number Input */}
                      <View style={styles.phoneInputContainer}>
                        {/* Country Picker Button */}
                        <TouchableOpacity
                          style={[
                            styles.countryPickerButton,
                            isDark ? styles.darkInput : styles.lightInput,
                          ]}
                        >
                          <CountryPicker
                            countryCode={countryCode}
                            withFilter
                            withFlag
                            withCountryNameButton={withCountryNameButton}
                            withCallingCodeButton
                            withEmoji
                            onSelect={(selectedCountry: Country) => {
                              setCountryCode(selectedCountry.cca2);
                              setCountry(selectedCountry);
                              setCallingCode(selectedCountry.callingCode[0]);
                            }}
                            containerButtonStyle={styles.countryPickerContainer}
                          />
                        </TouchableOpacity>

                        {/* Phone Number Input */}
                        <TextInput
                          style={[
                            styles.phoneInput,
                            isDark ? styles.darkInput : styles.lightInput,
                            isDark ? styles.darkText : styles.lightText,
                          ]}
                          placeholder="Phone number"
                          placeholderTextColor={isDark ? "#888" : "#666"}
                          value={phoneNumber}
                          onChangeText={setPhoneNumber}
                          keyboardType="phone-pad"
                          textContentType="telephoneNumber"
                          autoComplete="tel"
                        />
                      </View>

                      {/* Display full number preview */}
                      {phoneNumber.trim() && (
                        <Text
                          style={[
                            styles.phonePreview,
                            isDark ? styles.darkText : styles.lightText,
                          ]}
                        >
                          Full number: +{callingCode} {phoneNumber}
                        </Text>
                      )}

                      <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handlePhoneLogin}
                        disabled={authLoading || !phoneNumber.trim()}
                      >
                        <Text style={styles.submitButtonText}>
                          {authLoading
                            ? "Sending Code..."
                            : "Send Verification Code"}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.formTitle,
                          isDark ? styles.darkText : styles.lightText,
                        ]}
                      >
                        Enter verification code
                      </Text>
                      <Text
                        style={[
                          styles.formSubtitle,
                          isDark ? styles.darkText : styles.lightText,
                        ]}
                      >
                        Code sent to +{callingCode} {phoneNumber}
                      </Text>

                      <TextInput
                        style={[
                          styles.input,
                          styles.codeInput,
                          isDark ? styles.darkInput : styles.lightInput,
                          isDark ? styles.darkText : styles.lightText,
                        ]}
                        placeholder="123456"
                        placeholderTextColor={isDark ? "#888" : "#666"}
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        keyboardType="number-pad"
                        maxLength={6}
                        textAlign="center"
                      />

                      <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleVerificationCode}
                        disabled={authLoading || verificationCode.length !== 6}
                      >
                        <Text style={styles.submitButtonText}>
                          {authLoading ? "Verifying..." : "Verify Code"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.backToPhoneButton}
                        onPress={() => {
                          setIsVerificationStep(false);
                          setVerificationCode("");
                          setConfirm(null);
                          triggerTapHapticFeedback();
                        }}
                      >
                        <Text
                          style={[
                            styles.backToPhoneText,
                            isDark ? styles.darkText : styles.lightText,
                          ]}
                        >
                          ← Back to phone number
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              {/* Email Login */}
              {loginMethod === LoginMethod.EMAIL && (
                <View style={styles.formContainer}>
                  <Text
                    style={[
                      styles.formTitle,
                      isDark ? styles.darkText : styles.lightText,
                    ]}
                  >
                    Sign in with email
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      isDark ? styles.darkInput : styles.lightInput,
                      isDark ? styles.darkText : styles.lightText,
                    ]}
                    placeholder="Email address"
                    placeholderTextColor={isDark ? "#888" : "#666"}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    autoCapitalize="none"
                  />

                  <TextInput
                    style={[
                      styles.input,
                      isDark ? styles.darkInput : styles.lightInput,
                      isDark ? styles.darkText : styles.lightText,
                    ]}
                    placeholder="Password"
                    placeholderTextColor={isDark ? "#888" : "#666"}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    textContentType="password"
                    autoComplete="password"
                  />

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleEmailLogin}
                    disabled={authLoading || !email.trim() || !password.trim()}
                  >
                    <Text style={styles.submitButtonText}>
                      {authLoading ? "Signing In..." : "Sign In"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Fixed Bottom Terms & Privacy */}
          <View
            style={[
              styles.fixedBottomContainer,
              isDark && styles.darkFixedBottomContainer,
            ]}
          >
            <Text
              style={[
                styles.termsText,
                isDark ? styles.darkText : styles.lightText,
              ]}
            >
              By logging in, you agree to our{" "}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate("TOS")}
              >
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate("PrivacyPolicy")}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  lightContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  darkContainer: {
    flex: 1,
    backgroundColor: "#121212",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 3,
    marginBottom: 20,
  },
  headerButton: {
    color: "#007AFF",
    fontSize: 21,
  },
  supportIcon: {
    width: 25,
    height: 25,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: "MontserratAlternates-Regular",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    fontFamily: "Inter_28pt-Medium",
    textAlign: "center",
  },
  selectorContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
  chooseMethodText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  methodSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 15,
    padding: 4,
    width: "100%",
  },
  darkMethodSelector: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  methodTab: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  darkMethodTab: {
    backgroundColor: "transparent",
  },
  activeMethodTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabIcon: {
    width: 24,
    height: 20,
    marginBottom: 6,
    opacity: 0.6,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  phoneTabIcon: {
    backgroundColor: "#34C759",
  },
  emailTabIcon: {
    backgroundColor: "#007AFF",
  },
  methodTabText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    opacity: 0.6,
  },
  activeMethodTabText: {
    opacity: 1,
    color: "#0376C9",
  },
  loginFormContainer: {
    width: "100%",
    alignItems: "center",
  },
  formContainer: {
    width: "100%",
    alignItems: "center",
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  formSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
  },
  lightInput: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e9ecef",
  },
  darkInput: {
    backgroundColor: "#2c2c2e",
    borderColor: "#48484a",
  },
  codeInput: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 8,
    textAlign: "center",
  },
  phoneInputContainer: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 16,
    gap: 8,
  },
  countryPickerButton: {
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  countryPickerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  phonePreview: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0376C9",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#0376C9",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  icon: {
    width: 24,
    height: 20,
    marginRight: 10,
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  connectedText: {
    marginTop: 20,
    fontSize: 14,
    color: "#0FA958",
  },
  backToPhoneButton: {
    marginTop: 15,
  },
  backToPhoneText: {
    fontSize: 14,
    opacity: 0.7,
  },
  fixedBottomContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  darkFixedBottomContainer: {
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  termsText: {
    fontSize: 11,
    textAlign: "center",
    opacity: 0.8,
  },
  link: {
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  lightText: {
    color: "#000",
  },
  darkText: {
    color: "#FFF",
  },
});
