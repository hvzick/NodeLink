import AsyncStorage from '@react-native-async-storage/async-storage';

export const logout = async (navigation: any) => {
  try {
    // Clear stored wallet address
    await AsyncStorage.removeItem('walletAddress');

    // Reset navigation stack to Auth screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });

    console.log("✅ Logged out and cleared session.");
  } catch (error) {
    console.error("Logout error:", error);
  }
};
