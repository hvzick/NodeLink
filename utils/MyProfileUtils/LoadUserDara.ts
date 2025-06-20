import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData } from '../../backend/Supabase/RegisterUser';

export const loadUserData = async (): Promise<UserData | null> => {
  try {
    const storedData = await AsyncStorage.getItem("userData");
    return storedData ? JSON.parse(storedData) : null;
  } catch (err) {
    console.error("Error loading user data from AsyncStorage:", err);
    return null;
  }
};