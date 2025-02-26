// SettingsScreen.tsx
import React from "react";
import { View, Text, StyleSheet, Image, Button, TouchableOpacity } from "react-native";
import { useThemeToggle } from "../../utils/GlobalUtils/CheckSystemTheme"; // adjust path if needed

export default function SettingsScreen() {
  // Use our custom hook which returns currentTheme, userTheme, setTheme, and toggleTheme.
  const { currentTheme, userTheme, setTheme, toggleTheme } = useThemeToggle();

  // Dummy data
  const username = "@dummyuser";
  const bio = "Hello! This is a placeholder bio.";

  const handleEditSettings = () => {
    console.log("Edit Settings button pressed!");
  };

  return (
    <View style={[styles.container, currentTheme === "dark" ? styles.darkContainer : styles.lightContainer]}>
      <Image
        style={styles.SettingsImage}
        source={{
          uri: "https://via.placeholder.com/150/FF0000/FFFFFF?Text=SettingsPic",
        }}
      />

      <Text style={styles.username}>{username}</Text>
      <Text style={styles.bio}>{bio}</Text>

      <Button title="Edit Settings" onPress={handleEditSettings} />

      {/* Display the current user theme selection */}
      <Text style={styles.currentThemeText}>Current Theme: {userTheme}</Text>

      {/* Buttons for selecting a theme option */}
      <View style={styles.themeButtonsContainer}>
        <TouchableOpacity onPress={() => setTheme("system")} style={styles.themeButton}>
          <Text style={styles.themeButtonText}>System</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTheme("light")} style={styles.themeButton}>
          <Text style={styles.themeButtonText}>Light</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTheme("dark")} style={styles.themeButton}>
          <Text style={styles.themeButtonText}>Dark</Text>
        </TouchableOpacity>
      </View>
      
      {/* Alternatively, a toggle button if you prefer a quick switch */}
      {/* <TouchableOpacity onPress={toggleTheme} style={styles.toggleButton}>
        <Text style={styles.toggleButtonText}>Toggle Theme</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  darkContainer: {
    backgroundColor: "#1C1C1D",
  },
  lightContainer: {
    backgroundColor: "#FFF",
  },
  SettingsImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
    color: "#555",
  },
  currentThemeText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "bold",
  },
  themeButtonsContainer: {
    flexDirection: "row",
    marginTop: 16,
  },
  themeButton: {
    marginHorizontal: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#0080FF",
    borderRadius: 5,
  },
  themeButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  toggleButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#0080FF",
    borderRadius: 5,
  },
  toggleButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
