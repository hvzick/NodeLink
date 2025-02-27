// utils/GlobalUtils/ThemeProvider.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeOption = 'system' | 'light' | 'dark';

interface ThemeContextProps {
  currentTheme: 'light' | 'dark';
  userTheme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemTheme = useColorScheme() || 'light';
  const [userTheme, setUserTheme] = useState<ThemeOption>('system');

  const currentTheme: 'light' | 'dark' =
    userTheme === 'system' ? systemTheme : userTheme;

  const setTheme = (theme: ThemeOption) => {
    setUserTheme(theme);
    console.log(`Theme set to ${theme}`);
  };

  const toggleTheme = () => {
    const newTheme =
      userTheme === 'system'
        ? systemTheme === 'light'
          ? 'dark'
          : 'light'
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
