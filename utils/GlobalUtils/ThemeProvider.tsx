// utils/GlobalUtils/ThemeProvider.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

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
  // Always start with 'system' so that the app resets to automatic on exit.
  const [userTheme, setUserTheme] = useState<ThemeOption>('system');

  // Determine the effective theme based on the system and user choice.
  const currentTheme: 'light' | 'dark' =
    userTheme === 'system' ? systemTheme : userTheme;

  // Set the theme without persisting it.
  const setTheme = async (theme: ThemeOption) => {
    setUserTheme(theme);
    console.log(`Theme set to ${theme}`);
  };

  // Toggle between light and dark modes (if user has not selected 'system').
  const toggleTheme = async () => {
    const newTheme =
      userTheme === 'system'
        ? (systemTheme === 'light' ? 'dark' : 'light')
        : userTheme === 'light'
        ? 'dark'
        : 'light';
    setUserTheme(newTheme);
    console.log(`Theme toggled to ${newTheme}`);
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
