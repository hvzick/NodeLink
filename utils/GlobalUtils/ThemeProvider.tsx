// utils/GlobalUtils/ThemeProvider.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeOption = 'system' | 'light' | 'dark';

interface ThemeContextProps {
  currentTheme: 'light' | 'dark';
  userTheme: ThemeOption;
  setTheme: (theme: ThemeOption) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemTheme = useColorScheme() || 'light';
  const [userTheme, setUserTheme] = useState<ThemeOption>('system');

  // Load the saved theme from AsyncStorage when the provider mounts.
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('appTheme');
        if (savedTheme) {
          setUserTheme(savedTheme as ThemeOption);
        }
      } catch (error) {
        console.log('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, []);

  // Determine the effective theme.
  const currentTheme: 'light' | 'dark' =
    userTheme === 'system' ? systemTheme : userTheme;

  // Function to set the theme and persist it.
  const setTheme = async (theme: ThemeOption) => {
    try {
      setUserTheme(theme);
      await AsyncStorage.setItem('appTheme', theme);
      console.log(`Theme set to ${theme}`);
    } catch (error) {
      console.log('Failed to set theme:', error);
    }
  };

  // Function to toggle between light and dark modes.
  const toggleTheme = async () => {
    try {
      const newTheme =
        userTheme === 'system'
          ? systemTheme === 'light'
            ? 'dark'
            : 'light'
          : userTheme === 'light'
          ? 'dark'
          : 'light';
      setUserTheme(newTheme);
      await AsyncStorage.setItem('appTheme', newTheme);
      console.log(`Theme toggled to ${newTheme}`);
    } catch (error) {
      console.log('Failed to toggle theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, userTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeToggle = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeToggle must be used within a ThemeProvider');
  }
  return context;
};
