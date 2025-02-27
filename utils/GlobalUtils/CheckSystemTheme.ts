import { useState } from 'react';
import { useColorScheme } from 'react-native';

// Define the available theme options
export type ThemeOption = 'system' | 'light' | 'dark';

// Custom hook for toggling and managing the theme
export const useThemeToggle = () => {
  // Get the device's current theme ('light' or 'dark')
  const systemTheme = useColorScheme();

  // Store the user's selected theme; default is 'system'
  const [userTheme, setUserTheme] = useState<ThemeOption>('system');

  // Determine the effective current theme:
  // If userTheme is 'system', fall back to the system theme; otherwise, use userTheme
  const currentTheme = userTheme === 'system' ? systemTheme : userTheme;

  // Function to set the theme explicitly
  const setTheme = (theme: ThemeOption) => {
    setUserTheme(theme);
    console.log(`Theme set to ${theme}`);
  };

  // Function to toggle between light and dark themes
  // If in system mode, it toggles based on the device's current theme
  // Otherwise, it simply toggles between 'light' and 'dark'
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
    console.log(`Theme overridden to ${newTheme}`);
  };

  // Return the current theme and the functions to change it
  return { currentTheme, userTheme, setTheme, toggleTheme };
};
