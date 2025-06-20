import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData } from '../../backend/Supabase/RegisterUser';
export const saveUserData = async (userData: UserData): Promise<boolean> => {
  try {
    await AsyncStorage.setItem("userData", JSON.stringify(userData));
    return true;
  } catch (err) {
    console.error("Error saving user data to AsyncStorage:", err);
    return false;
  }
};