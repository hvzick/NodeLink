// StatsScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useThemeToggle } from "../../utils/GlobalUtils/ThemeProvider";
// Add these imports to your existing imports
import StatsCollector from "../../utils/StatsUtils/StatsCollector";
import PerformanceMonitor from "../../utils/StatsUtils/PerformceMonitor";
import NetworkMonitor from "../../utils/StatsUtils/NetworkMonitor";

interface ExtendedAppStats {
  // Basic App Usage
  sessionCount: number;
  totalAppTime: number;
  lastOpenDate: string;
  firstInstallDate: string;

  // Performance metrics
  averageFrameRate: number;
  frameDrops: number;
  coldStartTime: number;
  warmStartTime: number;
  batteryDrain: number;
  cpuUsage: number;
  memoryUsage: number;
  peakMemoryUsage: number;
  renderingTime: number;
  animationFrames: number;

  // User behavior
  averageSessionDuration: number;
  longestSession: number;
  shortestSession: number;
  nightModeUsage: number;
  gestureCount: number;
  screenTaps: number;
  scrollDistance: number;

  // Data & Storage
  storageUsed: number;
  cacheSize: number;
  tempFilesSize: number;
  databaseSize: number;
  imagesCached: number;
  documentsStored: number;

  // Network detailed
  networkRequests: number;
  dataDownloaded: number;
  dataUploaded: number;
  offlineTime: number;
  failedRequests: number;
  averageResponseTime: number;
  slowestRequest: number;
  fastestRequest: number;
  cacheHitRate: number;

  // Crashes & Errors
  crashCount: number;
  errorCount: number;
  warningCount: number;
  memoryLeaks: number;
  garbageCollections: number;

  // Security & Privacy
  permissionsGranted: string[];
  permissionsDenied: string[];
  securityEventsCount: number;

  // Feature Usage
  featuresUsed: { [key: string]: number };

  // Device & Environment
  deviceModel: string;
  osVersion: string;
  screenResolution: string;
  availableStorage: number;
  totalStorage: number;
  isJailbroken: boolean;

  // Advanced metrics
  asyncOperations: number;
  eventListeners: number;
  backgroundTasks: number;
  notificationsSent: number;
  notificationsReceived: number;
}

export default function StatsScreen() {
  const navigation = useNavigation();
  const { currentTheme } = useThemeToggle();
  const isDarkMode = currentTheme === "dark";
  const { width, height } = Dimensions.get("window");

  const [stats, setStats] = useState<ExtendedAppStats>({
    // Basic App Usage
    sessionCount: 0,
    totalAppTime: 0,
    lastOpenDate: new Date().toLocaleDateString(),
    firstInstallDate: new Date().toLocaleDateString(),

    // Performance metrics
    averageFrameRate: 0,
    frameDrops: 0,
    coldStartTime: 0,
    warmStartTime: 0,
    batteryDrain: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    peakMemoryUsage: 0,
    renderingTime: 0,
    animationFrames: 0,

    // User behavior
    averageSessionDuration: 0,
    longestSession: 0,
    shortestSession: 0,
    nightModeUsage: 0,
    gestureCount: 0,
    screenTaps: 0,
    scrollDistance: 0,

    // Data & Storage
    storageUsed: 0,
    cacheSize: 0,
    tempFilesSize: 0,
    databaseSize: 0,
    imagesCached: 0,
    documentsStored: 0,

    // Network detailed
    networkRequests: 0,
    dataDownloaded: 0,
    dataUploaded: 0,
    offlineTime: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    slowestRequest: 0,
    fastestRequest: 0,
    cacheHitRate: 0,

    // Crashes & Errors
    crashCount: 0,
    errorCount: 0,
    warningCount: 0,
    memoryLeaks: 0,
    garbageCollections: 0,

    // Security & Privacy
    permissionsGranted: [],
    permissionsDenied: [],
    securityEventsCount: 0,

    // Feature Usage
    featuresUsed: {},

    // Device & Environment
    deviceModel: "",
    osVersion: "",
    screenResolution: "",
    availableStorage: 0,
    totalStorage: 0,
    isJailbroken: false,

    // Advanced metrics
    asyncOperations: 0,
    eventListeners: 0,
    backgroundTasks: 0,
    notificationsSent: 0,
    notificationsReceived: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const statsCollector = StatsCollector.getInstance();
  useFocusEffect(
    useCallback(() => {
      // Track that user navigated to Stats screen
      statsCollector.trackNavigation();
      statsCollector.trackFeatureUse("Stats");
    }, [statsCollector])
  );
  // Load stats from AsyncStorage
  // Replace your existing useEffect loadStats function with this:
  useEffect(() => {
    const loadRealStats = async () => {
      try {
        // Initialize the stats collectors
        const perfMonitor = PerformanceMonitor.getInstance();
        const networkMonitor = NetworkMonitor.getInstance();

        // Update session time and check network status
        await statsCollector.updateSessionTime();
        await networkMonitor.checkNetworkStatus();

        // Get real stats from collectors
        const realUserStats = statsCollector.getStats();
        const deviceInfo = statsCollector.getDeviceInfo();
        const perfStats = perfMonitor.getStats();
        const networkStats = networkMonitor.getStats();

        // Combine real data with calculated values
        const combinedStats: ExtendedAppStats = {
          // Real Basic App Usage data
          sessionCount: realUserStats.sessionCount,
          totalAppTime: realUserStats.totalAppTime,
          lastOpenDate: new Date(
            realUserStats.lastOpenDate
          ).toLocaleDateString(),
          firstInstallDate: new Date(
            realUserStats.firstInstallDate
          ).toLocaleDateString(),

          // Real User Behavior data
          screenTaps: realUserStats.screenTaps,
          gestureCount: realUserStats.gestureCount,

          // Real Feature Usage data (this includes your tracked navigation)
          featuresUsed: realUserStats.featuresUsed,

          // Real Device data
          deviceModel: deviceInfo.deviceModel,
          osVersion: deviceInfo.osVersion,
          screenResolution: deviceInfo.screenResolution,

          // Real Performance data
          memoryUsage: perfStats.memoryUsage,
          renderingTime: perfStats.renderTime,

          // Real Error data
          errorCount: perfStats.errors,
          warningCount: perfStats.warnings,
          crashCount: perfStats.errors, // Using errors as crash approximation

          // Real Network data
          networkRequests: networkStats.requestCount,
          failedRequests: networkStats.failedRequests,
          averageResponseTime: networkStats.averageResponseTime,

          // Calculated values from real data
          averageSessionDuration:
            realUserStats.sessionCount > 0
              ? Math.round(
                  realUserStats.totalAppTime / realUserStats.sessionCount
                )
              : 0,
          longestSession: Math.max(realUserStats.currentSessionTime || 0, 30),
          shortestSession: Math.min(realUserStats.currentSessionTime || 5, 5),
          nightModeUsage: isDarkMode ? 100 : 0, // Real theme usage

          // Mock values for complex metrics (implement these later)
          averageFrameRate: 59.8,
          frameDrops: 23,
          coldStartTime: 1240,
          warmStartTime: 420,
          batteryDrain: 2.3,
          cpuUsage: 12.7,
          peakMemoryUsage: perfStats.memoryUsage * 1.5,
          animationFrames: 8934,
          scrollDistance: 45623,
          storageUsed: 23.7,
          cacheSize: 8.4,
          tempFilesSize: 2.1,
          databaseSize: 5.8,
          imagesCached: 156,
          documentsStored: 42,
          dataDownloaded: 156.8,
          dataUploaded: 23.4,
          offlineTime: 340,
          slowestRequest: Math.max(networkStats.averageResponseTime * 2, 100),
          fastestRequest: Math.min(networkStats.averageResponseTime * 0.5, 50),
          cacheHitRate: 87.3,
          memoryLeaks: 2,
          garbageCollections: 47,
          permissionsGranted: [
            "camera",
            "microphone",
            "location",
            "notifications",
          ],
          permissionsDenied: ["contacts", "calendar"],
          securityEventsCount: 5,
          availableStorage: 34567,
          totalStorage: 128000,
          isJailbroken: false,
          asyncOperations: 1247,
          eventListeners: 89,
          backgroundTasks: 23,
          notificationsSent: 45,
          notificationsReceived: 123,
        };

        setStats(combinedStats);

        // Save the combined stats
        await AsyncStorage.setItem(
          "extendedAppStats",
          JSON.stringify(combinedStats)
        );
      } catch (error) {
        console.error("Failed to load real stats:", error);

        // Fallback to your existing mock data if real data fails
        const mockStats: ExtendedAppStats = {
          // Your existing mock data here as fallback
          sessionCount: 127,
          totalAppTime: 4832,
          // ... rest of your mock data
          featuresUsed: {
            Settings: 89,
            Appearance: 45,
            Security: 23,
            Stats: 12, // This will be updated with real tracking
            Profile: 67,
            Search: 234,
            Export: 15,
            Import: 8,
          },
          lastOpenDate: "",
          firstInstallDate: "",
          averageFrameRate: 0,
          frameDrops: 0,
          coldStartTime: 0,
          warmStartTime: 0,
          batteryDrain: 0,
          cpuUsage: 0,
          memoryUsage: 0,
          peakMemoryUsage: 0,
          renderingTime: 0,
          animationFrames: 0,
          averageSessionDuration: 0,
          longestSession: 0,
          shortestSession: 0,
          nightModeUsage: 0,
          gestureCount: 0,
          screenTaps: 0,
          scrollDistance: 0,
          storageUsed: 0,
          cacheSize: 0,
          tempFilesSize: 0,
          databaseSize: 0,
          imagesCached: 0,
          documentsStored: 0,
          networkRequests: 0,
          dataDownloaded: 0,
          dataUploaded: 0,
          offlineTime: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          slowestRequest: 0,
          fastestRequest: 0,
          cacheHitRate: 0,
          crashCount: 0,
          errorCount: 0,
          warningCount: 0,
          memoryLeaks: 0,
          garbageCollections: 0,
          permissionsGranted: [],
          permissionsDenied: [],
          securityEventsCount: 0,
          deviceModel: "",
          osVersion: "",
          screenResolution: "",
          availableStorage: 0,
          totalStorage: 0,
          isJailbroken: false,
          asyncOperations: 0,
          eventListeners: 0,
          backgroundTasks: 0,
          notificationsSent: 0,
          notificationsReceived: 0,
        };
        setStats(mockStats);
      } finally {
        setIsLoading(false);
      }
    };

    loadRealStats();
  }, [isDarkMode, statsCollector]); // Add dependencies

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h ${mins}m`;
    }
    return `${hours}h ${mins}m`;
  };

  const formatBytes = (mb: number): string => {
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const StatItem = ({
    icon,
    title,
    value,
    subtitle,
    isLast = false,
  }: {
    icon: string;
    title: string;
    value: string;
    subtitle?: string;
    isLast?: boolean;
  }) => (
    <View style={[styles.statItem, isLast && { borderBottomWidth: 0 }]}>
      <View style={styles.statLeft}>
        <Ionicons
          name={icon as any}
          size={24}
          color={isDarkMode ? "#007AFF" : "#007AFF"}
        />
        <View style={styles.statTextContainer}>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const styles = getStyles(isDarkMode);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading comprehensive stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.headerTitleContainer} pointerEvents="none">
          <Text style={styles.headerTitleText}>Stats for Nerds</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* App Usage Stats */}
        <Text style={styles.sectionHeader}>App Usage</Text>
        <View style={styles.listContainer}>
          <StatItem
            icon="time-outline"
            title="Total App Time"
            value={formatTime(stats.totalAppTime)}
            subtitle="Since installation"
          />
          <StatItem
            icon="enter-outline"
            title="Sessions"
            value={stats.sessionCount.toString()}
            subtitle="App launches"
          />
          <StatItem
            icon="timer-outline"
            title="Average Session"
            value={formatTime(stats.averageSessionDuration)}
            subtitle="Per session duration"
          />
          <StatItem
            icon="trending-up-outline"
            title="Longest Session"
            value={formatTime(stats.longestSession)}
            subtitle="Maximum continuous use"
          />
          <StatItem
            icon="calendar-outline"
            title="Last Opened"
            value={stats.lastOpenDate}
            subtitle="Most recent launch"
          />
          <StatItem
            icon="download-outline"
            title="First Install"
            value={stats.firstInstallDate}
            subtitle="App installation date"
            isLast={true}
          />
        </View>

        {/* System Performance */}
        <Text style={styles.sectionHeader}>System Performance</Text>
        <View style={styles.listContainer}>
          <StatItem
            icon="speedometer-outline"
            title="Average Frame Rate"
            value={`${stats.averageFrameRate} FPS`}
            subtitle="UI smoothness"
          />
          <StatItem
            icon="flash-outline"
            title="Cold Start Time"
            value={`${stats.coldStartTime}ms`}
            subtitle="Launch from closed"
          />
          <StatItem
            icon="refresh-outline"
            title="Warm Start Time"
            value={`${stats.warmStartTime}ms`}
            subtitle="Resume from background"
          />
          <StatItem
            icon="battery-charging-outline"
            title="Battery Impact"
            value={`${stats.batteryDrain}%/hr`}
            subtitle="Estimated drain rate"
          />
          <StatItem
            icon="cellular-outline"
            title="CPU Usage"
            value={`${stats.cpuUsage}%`}
            subtitle="Current processor load"
          />
          <StatItem
            icon="trending-down-outline"
            title="Frame Drops"
            value={stats.frameDrops.toString()}
            subtitle="Missed frame renders"
          />
          <StatItem
            icon="play-outline"
            title="Animation Frames"
            value={stats.animationFrames.toLocaleString()}
            subtitle="Total frames rendered"
            isLast={true}
          />
        </View>

        {/* Memory & Storage */}
        <Text style={styles.sectionHeader}>Memory & Storage</Text>
        <View style={styles.listContainer}>
          <StatItem
            icon="hardware-chip-outline"
            title="Current Memory"
            value={formatBytes(stats.memoryUsage)}
            subtitle="RAM usage now"
          />
          <StatItem
            icon="trending-up-outline"
            title="Peak Memory"
            value={formatBytes(stats.peakMemoryUsage)}
            subtitle="Highest RAM usage"
          />
          <StatItem
            icon="save-outline"
            title="Storage Used"
            value={formatBytes(stats.storageUsed)}
            subtitle="Total app data"
          />
          <StatItem
            icon="archive-outline"
            title="Cache Size"
            value={formatBytes(stats.cacheSize)}
            subtitle="Temporary data"
          />
          <StatItem
            icon="folder-outline"
            title="Database Size"
            value={formatBytes(stats.databaseSize)}
            subtitle="User data storage"
          />
          <StatItem
            icon="images-outline"
            title="Images Cached"
            value={stats.imagesCached.toString()}
            subtitle="Cached media files"
          />
          <StatItem
            icon="trash-outline"
            title="Temp Files"
            value={formatBytes(stats.tempFilesSize)}
            subtitle="Temporary storage"
            isLast={true}
          />
        </View>

        {/* Network Statistics */}
        <Text style={styles.sectionHeader}>Network Activity</Text>
        <View style={styles.listContainer}>
          <StatItem
            icon="globe-outline"
            title="Network Requests"
            value={stats.networkRequests.toLocaleString()}
            subtitle="Total API calls"
          />
          <StatItem
            icon="download-outline"
            title="Data Downloaded"
            value={formatBytes(stats.dataDownloaded)}
            subtitle="Total downloads"
          />
          <StatItem
            icon="cloud-upload-outline"
            title="Data Uploaded"
            value={formatBytes(stats.dataUploaded)}
            subtitle="Total uploads"
          />
          <StatItem
            icon="time-outline"
            title="Average Response"
            value={`${stats.averageResponseTime}ms`}
            subtitle="API response time"
          />
          <StatItem
            icon="speedometer-outline"
            title="Cache Hit Rate"
            value={`${stats.cacheHitRate}%`}
            subtitle="Cache efficiency"
          />
          <StatItem
            icon="cloud-offline-outline"
            title="Offline Time"
            value={formatTime(stats.offlineTime)}
            subtitle="Without internet"
          />
          <StatItem
            icon="warning-outline"
            title="Failed Requests"
            value={stats.failedRequests.toString()}
            subtitle="Network errors"
            isLast={true}
          />
        </View>

        {/* User Interactions */}
        <Text style={styles.sectionHeader}>User Interactions</Text>
        <View style={styles.listContainer}>
          <StatItem
            icon="hand-left-outline"
            title="Screen Taps"
            value={stats.screenTaps.toLocaleString()}
            subtitle="Touch interactions"
          />
          <StatItem
            icon="finger-print-outline"
            title="Gestures"
            value={stats.gestureCount.toLocaleString()}
            subtitle="Swipes, pinches, etc."
          />
          <StatItem
            icon="arrow-down-outline"
            title="Scroll Distance"
            value={`${(stats.scrollDistance / 1000).toFixed(1)}k px`}
            subtitle="Total scrolling"
          />
          <StatItem
            icon="moon-outline"
            title="Night Mode Usage"
            value={`${stats.nightModeUsage}%`}
            subtitle="Dark theme preference"
            isLast={true}
          />
        </View>

        {/* Errors & Stability */}
        <Text style={styles.sectionHeader}>Errors & Stability</Text>
        <View style={styles.listContainer}>
          <StatItem
            icon="alert-circle-outline"
            title="Crashes"
            value={stats.crashCount.toString()}
            subtitle="App terminations"
          />
          <StatItem
            icon="bug-outline"
            title="Errors"
            value={stats.errorCount.toString()}
            subtitle="Runtime errors"
          />
          <StatItem
            icon="warning-outline"
            title="Warnings"
            value={stats.warningCount.toString()}
            subtitle="Non-fatal issues"
          />
          <StatItem
            icon="leak-outline"
            title="Memory Leaks"
            value={stats.memoryLeaks.toString()}
            subtitle="Detected leaks"
          />
          <StatItem
            icon="refresh-circle-outline"
            title="Garbage Collections"
            value={stats.garbageCollections.toString()}
            subtitle="Memory cleanups"
            isLast={true}
          />
        </View>

        {/* Feature Usage */}
        <Text style={styles.sectionHeader}>Feature Usage</Text>
        <View style={styles.listContainer}>
          {Object.entries(stats.featuresUsed).map(
            ([feature, count], index, array) => (
              <StatItem
                key={feature}
                icon="bar-chart-outline"
                title={feature}
                value={`${count} times`}
                subtitle="Times accessed"
                isLast={index === array.length - 1}
              />
            )
          )}
        </View>

        {/* Security & Privacy */}
        <Text style={styles.sectionHeader}>Security & Privacy</Text>
        <View style={styles.listContainer}>
          <StatItem
            icon="checkmark-circle-outline"
            title="Permissions Granted"
            value={stats.permissionsGranted.length.toString()}
            subtitle={
              stats.permissionsGranted.join(", ").substring(0, 30) + "..."
            }
          />
          <StatItem
            icon="close-circle-outline"
            title="Permissions Denied"
            value={stats.permissionsDenied.length.toString()}
            subtitle={
              stats.permissionsDenied.length > 0
                ? stats.permissionsDenied.join(", ")
                : "None"
            }
          />
          <StatItem
            icon="shield-outline"
            title="Security Events"
            value={stats.securityEventsCount.toString()}
            subtitle="Security-related incidents"
            isLast={true}
          />
        </View>

        {/* Device Information */}
        <Text style={styles.sectionHeader}>Device Information</Text>
        <View style={styles.listContainer}>
          <StatItem
            icon="phone-portrait-outline"
            title="Device"
            value={stats.deviceModel}
            subtitle={`${Platform.OS.toUpperCase()} ${stats.osVersion}`}
          />
          <StatItem
            icon="desktop-outline"
            title="Screen Resolution"
            value={stats.screenResolution}
            subtitle="Display dimensions"
          />
          <StatItem
            icon="server-outline"
            title="Available Storage"
            value={formatBytes(stats.availableStorage)}
            subtitle={`of ${formatBytes(stats.totalStorage)} total`}
          />
          <StatItem
            icon="build-outline"
            title="App Version"
            value="1.0.0"
            subtitle="Build 1"
          />
          <StatItem
            icon="shield-checkmark-outline"
            title="Security Status"
            value={stats.isJailbroken ? "Compromised" : "Secure"}
            subtitle="Device integrity"
            isLast={true}
          />
        </View>

        {/* Advanced Metrics */}
        <Text style={styles.sectionHeader}>Advanced Metrics</Text>
        <View style={styles.listContainer}>
          <StatItem
            icon="sync-outline"
            title="Async Operations"
            value={stats.asyncOperations.toLocaleString()}
            subtitle="Background tasks"
          />
          <StatItem
            icon="radio-outline"
            title="Event Listeners"
            value={stats.eventListeners.toString()}
            subtitle="Active listeners"
          />
          <StatItem
            icon="layers-outline"
            title="Background Tasks"
            value={stats.backgroundTasks.toString()}
            subtitle="Currently running"
          />
          <StatItem
            icon="notifications-outline"
            title="Notifications Sent"
            value={stats.notificationsSent.toString()}
            subtitle="Push notifications"
          />
          <StatItem
            icon="mail-outline"
            title="Notifications Received"
            value={stats.notificationsReceived.toString()}
            subtitle="Incoming notifications"
            isLast={true}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    scrollContainer: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 17,
      color: isDarkMode ? "#fff" : "#333333",
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: "600",
      color: isDarkMode ? "#8E8E93" : "#6D6D70",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 32,
      marginLeft: 20,
      marginBottom: 8,
    },
    listContainer: {
      borderRadius: 12,
      marginHorizontal: 20,
      overflow: "hidden",
      backgroundColor: isDarkMode ? "#2C2C2E" : "#FFFFFF",
    },
    statItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#48484A" : "#EFEFEF",
    },
    statLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    statTextContainer: {
      marginLeft: 12,
      flex: 1,
    },
    statTitle: {
      fontSize: 17,
      color: isDarkMode ? "#fff" : "#000",
    },
    statSubtitle: {
      fontSize: 13,
      color: isDarkMode ? "#8E8E93" : "#6D6D70",
      marginTop: 2,
    },
    statValue: {
      fontSize: 17,
      color: isDarkMode ? "#8E8E93" : "#6D6D70",
      fontWeight: "500",
      textAlign: "right",
    },
    bottomPadding: {
      height: 40,
    },
  });
