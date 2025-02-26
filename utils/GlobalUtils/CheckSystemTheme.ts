// useThemeToggle.ts
import { useState } from "react";
import { useColorScheme } from "react-native";

export type ThemeOption = "system" | "light" | "dark";

export const useThemeToggle = () => {
  // Get the system theme ("light" or "dark")
  const systemTheme = useColorScheme();
  // State to hold user's selection; defaults to "system"
  const [userTheme, setUserTheme] = useState<ThemeOption>("system");

  // The current theme is either the override or the system theme
  const currentTheme = userTheme === "system" ? systemTheme : userTheme;

  // Function to explicitly set the theme
  const setTheme = (theme: ThemeOption) => {
    setUserTheme(theme);
    console.log(`Theme set to ${theme}`);
  };

  // Optional: Toggle between light and dark (if not using "system")
  const toggleTheme = () => {
    if (userTheme === "system") {
      // If system mode, toggle based on systemTheme value
      const newTheme = systemTheme === "light" ? "dark" : "light";
      setUserTheme(newTheme);
      console.log(`Theme overridden to ${newTheme}`);
    } else {
      const newTheme = userTheme === "light" ? "dark" : "light";
      setUserTheme(newTheme);
      console.log(`Theme overridden to ${newTheme}`);
    }
  };

  return { currentTheme, userTheme, setTheme, toggleTheme };
};
