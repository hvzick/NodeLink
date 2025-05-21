import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';

export const logout = async (navigation: NavigationProp<any>) => {
  try {
    // Clear all storage
    await AsyncStorage.clear();
    console.log("✅ Storage cleared");

    // Get root navigation
    const rootNavigation = navigation.getParent();
    
    if (rootNavigation) {
      // Reset to Auth screen using root navigation
      rootNavigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
      console.log("✅ Navigation reset to Auth screen");
    } else {
      console.error("❌ Root navigation not found");
    }
  } catch (error) {
    console.error("❌ Logout error:", error);
  }
};
