import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  NativeModules,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';
import { triggerLightHapticFeedback } from '../../utils/GlobalUtils/TapHapticFeedback';
import {
  initConversationTones,
  playReceiveTone,
  playSendTone,
} from '../../utils/NotificationsSettings/ConversationTones';
import {
  setNotificationsEnabled as apiSetNotificationsEnabled,
  loadNotificationEnabled,
} from '../../utils/NotificationsSettings/EnableNotification';
import { useMuteSettings } from '../../utils/NotificationsSettings/MuteNotifications';
import { QuietRange, useQuietHours } from '../../utils/NotificationsSettings/UseQuietHours';
import { useNavigation } from '@react-navigation/native';
import { useThemeToggle } from '../../utils/GlobalUtils/ThemeProvider';
import { testForegroundNotification } from './t';
type QuietField = 'start' | 'end';
const muteDurations = ['8 hours', '1 day', '1 week', '1 month', '1 year'];

declare module 'react-native' {
  interface NativeModulesStatic {
    RingtonePickerModule: {
      showPicker(
        type: 'notification' | 'alarm' | 'ringtone'
      ): Promise<{ uri: string; title: string }>;
    };
  }
}

export default function NotificationsScreen() {
  // ─── conversation tones ───────────────────────────────────────────
  const [conversationTones, setConversationTones] = useState(true);
  useEffect(() => {
    initConversationTones();
  }, []);
  useEffect(() => {
    console.log(
      conversationTones
        ? '[ConversationTones] enabled'
        : '[ConversationTones] disabled'
    );
  }, [conversationTones]);

  // ─── quiet‐hours hook ──────────────────────────────────────────────
  const { quietRange, saveQuietRange, isQuietNow } = useQuietHours();
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeField, setTimeField] = useState<QuietField>('start');
  const [tempH, setTempH] = useState(quietRange.start.h);
  const [tempM, setTempM] = useState(quietRange.start.m);
  const { currentTheme } = useThemeToggle();
  const isDarkMode = currentTheme === 'dark';
  const openTimeModal = (field: QuietField) => {
    setTimeField(field);
    const t = quietRange[field];
    setTempH(t.h);
    setTempM(t.m);
    triggerLightHapticFeedback();
    setTimeModalVisible(true);
  };

  const closeTimeModal = async () => {
    const next: QuietRange = {
      ...quietRange,
      [timeField]: { h: tempH, m: tempM },
    };
    await saveQuietRange(next);
    triggerLightHapticFeedback();
    setTimeModalVisible(false);
  };
 const navigation = useNavigation();
  const fmt = ({ h, m }: { h: number; m: number }) =>
    `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  // ─── simulation respects quiet hours ──────────────────────────────
  const handleSend = async () => {
    await playSendTone();
  };
  const handleReceive = async () => {
    await playReceiveTone();
  };

  // ─── notification toggle ──────────────────────────────────────────
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  useEffect(() => {
    loadNotificationEnabled().then(setNotificationsEnabled);
  }, []);
  const onToggleNotifications = async (desired: boolean) => {
    const finalValue = await apiSetNotificationsEnabled(desired);
    setNotificationsEnabled(finalValue);
  };

  // ─── other states ─────────────────────────────────────────────────
  const [showPreview, setShowPreview] = useState(true);

  // ─── tone picker ──────────────────────────────────────────────────
  const [setNotificationTone] = useState('System Default');
  const [tonePickerMessage, setTonePickerMessage] = useState('');
  useEffect(() => {
    if (!tonePickerMessage) return;
    const t = setTimeout(() => setTonePickerMessage(''), 3000);
    return () => clearTimeout(t);
  }, [tonePickerMessage]);
  
  const styles = getStyles(isDarkMode);
  // ─── mute settings ────────────────────────────────────────────────
  const { isMuted, muteUntil, setMuteDuration } = useMuteSettings();
  const [muteModalVisible, setMuteModalVisible] = useState(false);
  const [selectedMuteLabel, setSelectedMuteLabel] = useState('1 day');
  const [showMuteInfo, setShowMuteInfo] = useState(false);

  const openMuteModal = () => {
    triggerLightHapticFeedback();
    setMuteModalVisible(true);
  };

  // ─── generic toggle handler ───────────────────────────────────────
  const onToggle = (
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => (v: boolean) => {
    setter(v);
    triggerLightHapticFeedback();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer} pointerEvents="none">
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
      </View>

      {/* Enable Notifications */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Enable Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={onToggleNotifications}
            trackColor={{ true: '#4CD964', false: '#ccc' }}
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
            trackColor={{ true: '#4CD964', false: '#ccc' }}
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

      {/* Message Preview */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Show Message Preview</Text>
          <Switch
            value={showPreview}
            onValueChange={onToggle(setShowPreview)}
            trackColor={{ true: '#4CD964', false: '#ccc' }}
          />
        </View>
      </View>

      {/* Mute Duration */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={openMuteModal}>
          <Text style={styles.label}>Mute Duration</Text>
          <View style={styles.rowRight}>
            <Text style={styles.value}>{selectedMuteLabel}</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={18}
              color="#C7C7CC"
            />
          </View>
        </TouchableOpacity>
        {isMuted && showMuteInfo && (
          <Text style={styles.infoText}>
            Muted until {new Date(muteUntil).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Quiet Hours */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => openTimeModal('start')}
        >
          <Text style={styles.label}>Quiet Hours Start</Text>
          <Text style={styles.value}>{fmt(quietRange.start)}</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.row}
          onPress={() => openTimeModal('end')}
        >
          <Text style={styles.label}>Quiet Hours End</Text>
          <Text style={styles.value}>{fmt(quietRange.end)}</Text>
        </TouchableOpacity>
      </View>

      {/* Mute Modal */}
      <Modal
              visible={timeModalVisible}
              transparent
              animationType="slide"
              onRequestClose={closeTimeModal}
            >
              <View style={styles.modalContainer}>
                <View style={styles.timeWrapper}>
                  <Text style={styles.modalTitle}>
                    Select {timeField === 'start' ? 'Start' : 'End'} Time
                  </Text>
                  <View style={styles.timePickers}>
                    <Picker selectedValue={tempH} onValueChange={setTempH} style={styles.hourPicker}>
                      {Array.from({ length: 24 }, (_, i) => (
                        <Picker.Item key={i} label={`${i}`} value={i} />
                      ))}
                    </Picker>
                    <Text style={styles.colon}>:</Text>
                    <Picker selectedValue={tempM} onValueChange={setTempM} style={styles.minutePicker}>
                      {Array.from({ length: 60 }, (_, i) => (
                        <Picker.Item key={i} label={i.toString().padStart(2, '0')} value={i} />
                      ))}
                    </Picker>
                  </View>
                  <TouchableHighlight underlayColor="#DDDDDD" onPress={closeTimeModal} style={styles.doneButton}>
                    <Text style={styles.doneText}>Done</Text>
                  </TouchableHighlight>
                </View>
              </View>
            </Modal>
            {/*Send Notification for testing */}
          <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={testForegroundNotification }>
              <Text style={styles.buttonText}>Send Test Notification</Text>
            </TouchableOpacity>
          </View>
    
    </SafeAreaView>
  );
}
const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000' : '#F5F5F5',
    },
    headerContainer: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      height: 40,
      paddingHorizontal: 20,
      backgroundColor: isDarkMode ? '#000' : '#F5F5F5',
    },
    backButton: {
      width: 100,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1,
    },
    backButtonText: {
      fontSize: 17,
      color: '#007AFF',
      marginLeft: 4,
    },
    headerTitleContainer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 0,
    },
    headerTitle: {
      fontFamily: 'SF-Pro-Text-Medium',
      fontSize: 20,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#000',
    },
    section: {
      backgroundColor: isDarkMode ? '#1c1c1e' : '#fff',
      marginHorizontal: 16,
      borderRadius: 10,
      marginBottom: 16,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    label: {
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#000',
    },
    value: {
      fontSize: 16,
      color: isDarkMode ? '#ccc' : '#8E8E93',
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDarkMode ? '#3a3a3c' : '#E0E0E0',
      marginLeft: 16,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    pickerWrapper: {
      backgroundColor: isDarkMode ? '#1c1c1e' : '#fff',
      paddingTop: 12,
      paddingBottom: 24,
    },
    timeWrapper: {
      backgroundColor: isDarkMode ? '#1c1c1e' : '#fff',
      padding: 16,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    },
    modalTitle: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#000',
      marginBottom: 8,
    },
    picker: {
      height: 180,
    },
    hourPicker: {
      width: 100,
      height: 180,
    },
    minutePicker: {
      width: 100,
      height: 180,
    },
    timePickers: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colon: {
      fontSize: 18,
      marginHorizontal: 4,
      alignSelf: 'center',
      color: isDarkMode ? '#fff' : '#000',
    },
    doneButton: {
      alignSelf: 'flex-end',
      padding: 16,
    },
    doneText: {
      fontSize: 16,
      color: '#007AFF',
    },
    infoText: {
      fontSize: 14,
      color: isDarkMode ? '#aaa' : '#8E8E93',
      paddingHorizontal: 16,
    },
      button: {
    backgroundColor: '#4CD964',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  });
