// AppearanceScreen.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { triggerTapHapticFeedback } from "../../utils/GlobalUtils/TapHapticFeedback";
import {
  useThemeToggle,
  ThemeOption as GlobalThemeOption,
} from "../../utils/GlobalUtils/ThemeProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LocalThemeOption = "automatic" | "dark" | "light";

export default function AppearanceScreen() {
  const navigation = useNavigation();
  const { currentTheme, userTheme, setTheme } = useThemeToggle();
  const isDarkMode = currentTheme === "dark";
  const [selectedTheme, setSelectedTheme] =
    useState<LocalThemeOption>("automatic");
  const [timeFormat, setTimeFormat] = useState<"12" | "24">("24");

  // Sync local state with userTheme (mapping 'system' to 'automatic')
  useEffect(() => {
    setSelectedTheme(userTheme === "system" ? "automatic" : userTheme);
  }, [userTheme]);

  useEffect(() => {
    // Load time format from storage
    AsyncStorage.getItem("timeFormat").then((val) => {
      if (val === "12" || val === "24") setTimeFormat(val);
    });
  }, []);

  const handleSelect = (option: LocalThemeOption) => {
    setSelectedTheme(option);
    const themeToSet: GlobalThemeOption =
      option === "automatic" ? "system" : option;
    setTheme(themeToSet);
    triggerTapHapticFeedback();
    console.log(`Theme selected: ${option}`, userTheme);
  };

  const handleTimeFormatChange = async (format: "12" | "24") => {
    setTimeFormat(format);
    await AsyncStorage.setItem("timeFormat", format);
    triggerTapHapticFeedback();
  };

  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color="#007AFF"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Centered title, non-touchable */}
        <View style={styles.headerTitleContainer} pointerEvents="none">
          <Text style={styles.headerTitleText}>Appearance</Text>
        </View>
      </View>

      {/* Theme Label */}
      <Text
        style={[
          styles.optionText,
          {
            marginLeft: 32,
            marginTop: 20,
            marginBottom: 5,
            fontWeight: "bold",
            fontSize: 16,
          },
        ]}
      >
        Theme
      </Text>
      <View style={styles.listContainer}>
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => handleSelect("automatic")}
        >
          <Text style={styles.optionText}>Automatic</Text>
          {selectedTheme === "automatic" && (
            <Ionicons name="checkmark" size={22} color="#007AFF" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => handleSelect("dark")}
        >
          <Text style={styles.optionText}>Dark</Text>
          {selectedTheme === "dark" && (
            <Ionicons name="checkmark" size={22} color="#007AFF" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.listItem, { borderBottomWidth: 0 }]}
          onPress={() => handleSelect("light")}
        >
          <Text style={styles.optionText}>Light</Text>
          {selectedTheme === "light" && (
            <Ionicons name="checkmark" size={22} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Time Format Label */}
      <Text
        style={[
          styles.optionText,
          {
            marginLeft: 30,
            marginTop: 24,
            marginBottom: 3,
            fontWeight: "bold",
            fontSize: 16,
          },
        ]}
      >
        Time Format
      </Text>
      <View style={[styles.listContainer]}>
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => handleTimeFormatChange("24")}
        >
          <Text style={styles.optionText}>24-hour</Text>
          {timeFormat === "24" && (
            <Ionicons name="checkmark" size={22} color="#007AFF" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.listItem, { borderBottomWidth: 0 }]}
          onPress={() => handleTimeFormatChange("12")}
        >
          <Text style={styles.optionText}>12-hour</Text>
          {timeFormat === "12" && (
            <Ionicons name="checkmark" size={22} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1C1C1D" : "#F2F2F2",
    },
    headerContainer: {
      position: "relative",
      flexDirection: "row",
      alignItems: "center",
      height: 40,
      paddingHorizontal: 16,
      backgroundColor: isDarkMode ? "#1C1C1D" : "#F2F2F2",
    },
    backButton: {
      width: 100,
      flexDirection: "row",
      alignItems: "center",
      zIndex: 1,
    },
    backButtonText: {
      fontSize: 17,
      color: "#007AFF",
    },
    headerTitleContainer: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 0,
    },
    headerTitleText: {
      fontSize: 20,
      fontFamily: "SF-Pro-Text-Medium",
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333333",
    },
    listContainer: {
      marginTop: 10,
      borderRadius: 8,
      marginHorizontal: 20,
      overflow: "hidden",
      backgroundColor: isDarkMode ? "#121212" : "#FFFFFF",
    },
    listItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#333" : "#EFEFEF",
    },
    optionText: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333333",
    },
  });
