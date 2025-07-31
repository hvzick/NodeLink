// utils/AuthenticationUtils/PhoneAuth.tsx
import { Alert } from "react-native";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyByuM9QjLcZRtuAq8kDg1J7KuPCqH42Lbs",
  authDomain: "nodelink-1.firebaseapp.com",
  projectId: "nodelink-1",
  storageBucket: "nodelink-1.firebasestorage.app",
  messagingSenderId: "518861480277",
  appId: "1:518861480277:web:9bc1eb026cf2ef2fa48fdc",
  measurementId: "G-3R132D82ML",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Disable reCAPTCHA for development
if (__DEV__) {
  auth.settings.appVerificationDisabledForTesting = true;
}

// Send OTP to phone number - DEVELOPMENT VERSION (NO RECAPTCHA)
export const sendOTP = async (
  fullPhoneNumber: string,
  setAuthLoading: (loading: boolean) => void,
  setConfirm: (confirmation: any) => void
) => {
  if (!fullPhoneNumber || fullPhoneNumber.length < 10) {
    Alert.alert("Error", "Please enter a valid phone number.");
    return false;
  }

  setAuthLoading(true);

  try {
    let confirmation;

    if (__DEV__) {
      // Development mode: Use mock confirmation (no reCAPTCHA needed)
      console.log("🧪 DEV MODE: Sending mock OTP to:", fullPhoneNumber);

      // Simulate Firebase delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock confirmation object that accepts any 6-digit code
      confirmation = {
        confirm: async (code: string) => {
          if (code.length === 6) {
            return {
              user: {
                uid: `mock_uid_${Date.now()}`,
                phoneNumber: fullPhoneNumber,
              },
            };
          }
          throw new Error("Invalid verification code");
        },
      };

      Alert.alert(
        "Development Mode",
        `Mock verification code sent to ${fullPhoneNumber}\n\n📱 Use any 6-digit code for testing`
      );
    } else {
      // Production mode: Use real Firebase with reCAPTCHA
      console.log("🔥 PRODUCTION: Sending real SMS to:", fullPhoneNumber);

      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => console.log("Recaptcha solved"),
          "expired-callback": () => console.log("Recaptcha expired"),
        }
      );

      confirmation = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        recaptchaVerifier
      );

      Alert.alert("Success", `Verification code sent to ${fullPhoneNumber}`);
    }

    setConfirm(confirmation);
    return true;
  } catch (error: any) {
    console.error("❌ Send OTP error:", error);

    // Handle specific Firebase errors
    let errorMessage = "Failed to send verification code. Please try again.";

    if (error.code === "auth/invalid-phone-number") {
      errorMessage = "Invalid phone number format.";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many requests. Please try again later.";
    } else if (error.code === "auth/quota-exceeded") {
      errorMessage = "SMS quota exceeded. Please try again later.";
    }

    Alert.alert("Error", errorMessage);
    return false;
  } finally {
    setAuthLoading(false);
  }
};

// Verify OTP and save to YOUR auth system
export const verifyOTP = async (
  code: string,
  confirmation: any,
  phoneNumber: string,
  setWalletAddress: (address: string) => void,
  setIsLoggedIn: (status: boolean) => void,
  setAuthLoading: (loading: boolean) => void,
  navigation: any
) => {
  if (code.length !== 6) {
    Alert.alert("Error", "Please enter the 6-digit verification code.");
    return false;
  }

  setAuthLoading(true);

  try {
    // Verify with Firebase (works with both mock and real)
    const result = await confirmation.confirm(code);
    console.log("✅ Firebase verification successful:", result.user.uid);

    // Generate a wallet-like address from phone number
    const walletAddress = `phone_${phoneNumber.replace(
      /\D/g,
      ""
    )}_${Date.now().toString(36)}`;

    // Save to YOUR auth system
    await AsyncStorage.setItem("walletAddress", walletAddress);
    await AsyncStorage.setItem("phoneNumber", phoneNumber);
    await AsyncStorage.setItem("authMethod", "phone");

    // Update YOUR auth context
    setWalletAddress(walletAddress);
    setIsLoggedIn(true);

    // Navigate using YOUR navigation logic
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });

    console.log("✅ Phone verification successful:", walletAddress);
    return true;
  } catch (error: any) {
    console.error("❌ Verify OTP error:", error);

    let errorMessage = "Invalid verification code. Please try again.";

    if (error.code === "auth/invalid-verification-code") {
      errorMessage = "Invalid verification code.";
    } else if (error.code === "auth/code-expired") {
      errorMessage = "Verification code has expired. Please request a new one.";
    }

    Alert.alert("Error", errorMessage);
    return false;
  } finally {
    setAuthLoading(false);
  }
};
