import { Alert } from "react-native";
import * as LocalAuthentication from 'expo-local-authentication';

export async function handlePrivatePress(showPrivate, setShowPrivate) {
    if (showPrivate) return;
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      Alert.alert('Authentication not available', 'No biometrics or device PIN enrolled.');
      return;
    }
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    let result;
    if (
      supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) ||
      supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
    ) {
      result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with Face ID or biometrics to view your private key',
        fallbackLabel: 'Use device passcode',
        disableDeviceFallback: false,
      });
    } else {
      result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with device passcode to view your private key',
        fallbackLabel: '',
        disableDeviceFallback: false,
      });
    }
    if (result.success) setShowPrivate(true);
    else Alert.alert('Authentication failed', 'Could not verify your identity.');
  }