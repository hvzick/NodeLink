import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { triggerTapHapticFeedback } from "../../utils/GlobalUtils/TapHapticFeedback";
import {
  initConversationTones,
  playReceiveTone,
  playSendTone,
} from "../../utils/NotificationsSettings/ConversationTones";
import * as Haptics from "expo-haptics";
import {
  setNotificationsEnabled as apiSetNotificationsEnabled,
  loadNotificationEnabled,
} from "../../utils/NotificationsSettings/EnableNotification";
import { useMuteSettings } from "../../utils/NotificationsSettings/MuteNotifications";
import { useQuietHours } from "../../utils/NotificationsSettings/UseQuietHours";
import { useNavigation } from "@react-navigation/native";
import { useThemeToggle } from "../../utils/GlobalUtils/ThemeProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

type QuietField = "start" | "end";
type Sensitivity = "Light" | "Medium" | "Heavy";
const TAP_HAPTIC_KEY = "tapHapticEnabled";
const TAP_SENSITIVITY_KEY = "tapHapticSensitivity";

export default function NotificationsScreen() {
  // ─── Conversation Tones ─────────────────────────────────────────
  const [conversationTones, setConversationTones] = useState(true);
  useEffect(() => {
    initConversationTones();
  }, []);
  useEffect(() => {
    console.log(
      conversationTones
        ? "[ConversationTones] enabled"
        : "[ConversationTones] disabled"
    );
  }, [conversationTones]);

  // ─── Quiet Hours ─────────────────────────────────────────────────
  const { quietRange, saveQuietRange } = useQuietHours();
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeField, setTimeField] = useState<QuietField>("start");
  const [tempH, setTempH] = useState(quietRange.start.h);
  const [tempM, setTempM] = useState(quietRange.start.m);

  const openTimeModal = (field: QuietField) => {
    setTimeField(field);
    const t = quietRange[field];
    setTempH(t.h);
    setTempM(t.m);
    triggerTapHapticFeedback();
    setTimeModalVisible(true);
  };

  const closeTimeModal = async () => {
    const next = {
      ...quietRange,
      [timeField]: { h: tempH, m: tempM },
    };
    await saveQuietRange(next);
    triggerTapHapticFeedback();
    setTimeModalVisible(false);
  };

  const fmt = ({ h, m }: { h: number; m: number }) =>
    `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

  // ─── Simulation ──────────────────────────────────────────────────
  const handleSend = async () => {
    await playSendTone();
  };
  const handleReceive = async () => {
    await playReceiveTone();
  };

  // ─── Tap Haptic Settings ─────────────────────────────────────────
  const [isTapEnabled, setIsTapEnabled] = useState(true);
  const [tapSensitivity, setTapSensitivity] = useState<Sensitivity>("Light");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [tapValue, sensValue] = await Promise.all([
          AsyncStorage.getItem(TAP_HAPTIC_KEY),
          AsyncStorage.getItem(TAP_SENSITIVITY_KEY),
        ]);
        setIsTapEnabled(tapValue !== "false");
        setTapSensitivity((sensValue as Sensitivity) || "Light");
      } catch (e) {
        console.error("Failed to load haptic settings.", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleTapToggle = async (newVal: boolean) => {
    setIsTapEnabled(newVal);
    if (newVal) await handleTapSensitivityChange(tapSensitivity, false);
    await AsyncStorage.setItem(TAP_HAPTIC_KEY, newVal.toString());
  };

  const handleTapSensitivityChange = async (
    sensitivity: Sensitivity,
    save = true
  ) => {
    setTapSensitivity(sensitivity);
    await Haptics.impactAsync(
      sensitivity === "Heavy"
        ? Haptics.ImpactFeedbackStyle.Heavy
        : sensitivity === "Medium"
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    );
    if (save) await AsyncStorage.setItem(TAP_SENSITIVITY_KEY, sensitivity);
  };

  // ─── Notifications Toggle ────────────────────────────────────────
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  useEffect(() => {
    loadNotificationEnabled().then(setNotificationsEnabled);
  }, []);
  const onToggleNotifications = async (d: boolean) => {
    const finalVal = await apiSetNotificationsEnabled(d);
    setNotificationsEnabled(finalVal);
  };

  // ─── Message Preview ─────────────────────────────────────────────
  const [showPreview, setShowPreview] = useState(true);

  // ─── Mute Duration ───────────────────────────────────────────────
  const { setMuteDuration } = useMuteSettings();
  const [selectedMuteLabel, setSelectedMuteLabel] = useState("1 hour");
  const MUTE_OPTIONS = [
    { label: "1 Hour", value: "1 hour" },
    { label: "1 Day", value: "1 day" },
    { label: "7 Days", value: "7 days" },
    { label: "1 Month", value: "1 month" },
    { label: "1 Year", value: "1 year" },
  ];

  const onToggle =
    (setter: React.Dispatch<React.SetStateAction<boolean>>) => (v: boolean) => {
      setter(v);
      triggerTapHapticFeedback();
    };

  const { currentTheme } = useThemeToggle();
  const isDarkMode = currentTheme === "dark";
  const navigation = useNavigation();
  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer} pointerEvents="none">
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Enable Notifications */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={onToggleNotifications}
              trackColor={{ true: "#4CD964", false: "#ccc" }}
            />
          </View>
        </View>

        {/* Conversation Tones */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Conversation Tones</Text>
            <Switch
              value={conversationTones}
              onValueChange={onToggle(setConversationTones)}
              trackColor={{ true: "#4CD964", false: "#ccc" }}
            />
          </View>
          <View style={styles.row}>
            <TouchableOpacity onPress={handleSend} style={{ marginRight: 16 }}>
              <Text style={styles.value}>Simulate Send</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReceive}>
              <Text style={styles.value}>Simulate Receive</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tap Feedback */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.optionText}>Tap Feedback</Text>
            <Switch
              trackColor={{
                false: isDarkMode ? "#2C2C2E" : "#E9E9EA",
                true: "#34C759",
              }}
              thumbColor={"#FFFFFF"}
              ios_backgroundColor={isDarkMode ? "#2C2C2E" : "#E9E9EA"}
              onValueChange={handleTapToggle}
              value={isTapEnabled}
              disabled={isLoading}
            />
          </View>

          {isTapEnabled && (
            <View style={[styles.listItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.optionText}>Tap Sensitivity</Text>
              <Picker
                selectedValue={tapSensitivity}
                onValueChange={(v) =>
                  handleTapSensitivityChange(v as Sensitivity)
                }
                style={styles.pickerH}
                dropdownIconColor={isDarkMode ? "#FFFFFF" : "#8E8E93"}
                itemStyle={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
              >
                <Picker.Item label="Light" value="Light" />
                <Picker.Item label="Medium" value="Medium" />
                <Picker.Item label="Heavy" value="Heavy" />
              </Picker>
            </View>
          )}
        </View>

        {/* Message Preview */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Show Message Preview</Text>
            <Switch
              value={showPreview}
              onValueChange={onToggle(setShowPreview)}
              trackColor={{ true: "#4CD964", false: "#ccc" }}
            />
          </View>
        </View>

        {/* Mute Duration */}
        <View style={styles.section}>
          <View style={[styles.listItem, { borderBottomWidth: 0 }]}>
            <Text style={styles.optionText}>Mute Duration</Text>
            <Picker
              selectedValue={selectedMuteLabel}
              onValueChange={(v) => {
                setSelectedMuteLabel(v);
                setMuteDuration(v);
              }}
              style={styles.pickerH}
              dropdownIconColor={isDarkMode ? "#FFFFFF" : "#8E8E93"}
              itemStyle={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
            >
              {MUTE_OPTIONS.map((opt) => (
                <Picker.Item
                  key={opt.value}
                  label={opt.label}
                  value={opt.value}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => openTimeModal("start")}
          >
            <Text style={styles.label}>Quiet Hours Start</Text>
            <Text style={styles.value}>{fmt(quietRange.start)}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => openTimeModal("end")}
          >
            <Text style={styles.label}>Quiet Hours End</Text>
            <Text style={styles.value}>{fmt(quietRange.end)}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={timeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeTimeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.timeWrapper}>
            <Text style={styles.modalTitle}>
              Select {timeField === "start" ? "Start" : "End"} Time
            </Text>
            <View style={styles.timePickers}>
              <Picker
                selectedValue={tempH}
                onValueChange={setTempH}
                style={styles.hourPicker}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <Picker.Item key={i} label={`${i}`} value={i} />
                ))}
              </Picker>
              <Text style={styles.colon}>:</Text>
              <Picker
                selectedValue={tempM}
                onValueChange={setTempM}
                style={styles.minutePicker}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <Picker.Item
                    key={i}
                    label={i.toString().padStart(2, "0")}
                    value={i}
                  />
                ))}
              </Picker>
            </View>
            <TouchableOpacity
              onPress={closeTimeModal}
              style={styles.doneButton}
            >
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#000" : "#F5F5F5",
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      height: 50,
      paddingHorizontal: 16,
      backgroundColor: isDarkMode ? "#000" : "#F5F5F5",
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      zIndex: 1,
    },
    backButtonText: {
      fontSize: 17,
      color: "#007AFF",
      marginLeft: 4,
    },
    headerTitleContainer: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#000",
    },
    scrollContent: {
      paddingBottom: 32,
    },
    section: {
      backgroundColor: isDarkMode ? "#1c1c1e" : "#fff",
      marginHorizontal: 16,
      borderRadius: 10,
      marginBottom: 16,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
    },
    label: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#000",
    },
    value: {
      fontSize: 16,
      color: isDarkMode ? "#ccc" : "#8E8E93",
    },
    listItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 0,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#48484A" : "#EFEFEF",
    },
    optionText: {
      fontSize: 17,
      color: isDarkMode ? "#fff" : "#000",
    },
    pickerH: {
      width: Platform.OS === "ios" ? 150 : 160,
      color: isDarkMode ? "#FFFFFF" : "#000000",
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDarkMode ? "#3a3a3c" : "#E0E0E0",
      marginLeft: 16,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    timeWrapper: {
      backgroundColor: isDarkMode ? "#1c1c1e" : "#fff",
      padding: 16,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    },
    modalTitle: {
      textAlign: "center",
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#000",
      marginBottom: 8,
    },
    timePickers: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    hourPicker: {
      width: 100,
      height: 180,
    },
    minutePicker: {
      width: 100,
      height: 180,
    },
    colon: {
      fontSize: 18,
      marginHorizontal: 4,
      color: isDarkMode ? "#fff" : "#000",
    },
    doneButton: {
      alignSelf: "flex-end",
      padding: 16,
    },
    doneText: {
      fontSize: 16,
      color: "#007AFF",
    },
    button: {
      backgroundColor: "#4CD964",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
    },
    testContainer: {
      padding: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: isDarkMode ? "#3a3a3c" : "#E0E0E0",
      backgroundColor: isDarkMode ? "#000" : "#F5F5F5",
    },
  });
