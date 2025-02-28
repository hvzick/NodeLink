import * as Clipboard from 'expo-clipboard';
import { Platform, ToastAndroid, Alert, } from 'react-native';
export const copyToClipboard = async () => {
    const address = '0xe65EAC370d1079688fe1e4B9a35A41aac2bac';
    await Clipboard.setStringAsync(address);
    console.log('Address copied:', address);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Address copied!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied!', 'Address copied to clipboard.');
    }
  };