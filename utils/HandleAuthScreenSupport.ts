import { Alert, Linking } from "react-native";

export const handleSupport = async () => {
  const recipients = ['faik15748@gmail.com', 'ishazzeyfr@icloud.com'];
  const subject = encodeURIComponent('Support Request');
  const body = encodeURIComponent('Hello NodeLink developers,\n\nI need help with...');
  const mailtoURL = `mailto:${recipients.join(',')}?subject=${subject}&body=${body}`;

  try {
    const supported = await Linking.canOpenURL(mailtoURL);
    if (supported) {
      Linking.openURL(mailtoURL);
    } else {
      Alert.alert('Error', 'Email app is not available');
    }
  } catch (error) {
    console.error("Error handling the support request: ", error);
    Alert.alert('Error', 'An error occurred while trying to open the email app');
  }
};
