// utils/StatsCollector.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Dimensions } from "react-native";

const STATS_KEY = "realAppStats";

export interface RealStats {
  // Session Management
  sessionCount: number;
  sessionStartTime: number;
  totalAppTime: number;
  currentSessionTime: number;

  // User Interactions
  tapCount: number;
  gestureCount: number;
  screenTaps: number;

  // App Events
  screenNavigations: number;
  featuresUsed: { [key: string]: number };

  // Timestamps
  firstInstallDate: string;
  lastOpenDate: string;
  lastUpdateDate: string;
}

class StatsCollector {
  private static instance: StatsCollector;
  private stats: RealStats;
  private sessionStartTime: number = Date.now();

  private constructor() {
    this.stats = {
      sessionCount: 0,
      sessionStartTime: Date.now(),
      totalAppTime: 0,
      currentSessionTime: 0,
      tapCount: 0,
      gestureCount: 0,
      screenTaps: 0,
      screenNavigations: 0,
      featuresUsed: {},
      firstInstallDate: new Date().toISOString(),
      lastOpenDate: new Date().toISOString(),
      lastUpdateDate: new Date().toISOString(),
    };
    this.loadStats();
  }

  public static getInstance(): StatsCollector {
    if (!StatsCollector.instance) {
      StatsCollector.instance = new StatsCollector();
    }
    return StatsCollector.instance;
  }

  private async loadStats(): Promise<void> {
    try {
      const storedStats = await AsyncStorage.getItem(STATS_KEY);
      if (storedStats) {
        this.stats = { ...this.stats, ...JSON.parse(storedStats) };
      }
      // Mark new session
      this.stats.sessionCount++;
      this.stats.lastOpenDate = new Date().toISOString();
      this.sessionStartTime = Date.now();
      await this.saveStats();
    } catch (error) {
      console.log("Error loading stats:", error);
    }
  }

  private async saveStats(): Promise<void> {
    try {
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.log("Error saving stats:", error);
    }
  }

  // Public methods to track various events
  public async trackTap(): Promise<void> {
    this.stats.tapCount++;
    this.stats.screenTaps++;
    await this.saveStats();
  }

  public async trackGesture(): Promise<void> {
    this.stats.gestureCount++;
    await this.saveStats();
  }

  public async trackNavigation(): Promise<void> {
    this.stats.screenNavigations++;
    await this.saveStats();
  }

  public async trackFeatureUse(featureName: string): Promise<void> {
    this.stats.featuresUsed[featureName] =
      (this.stats.featuresUsed[featureName] || 0) + 1;
    await this.saveStats();
  }

  public async updateSessionTime(): Promise<void> {
    const currentTime = Date.now();
    const sessionDuration = Math.floor(
      (currentTime - this.sessionStartTime) / 1000 / 60
    ); // minutes
    this.stats.currentSessionTime = sessionDuration;
    this.stats.totalAppTime += sessionDuration;
    await this.saveStats();
  }

  public getStats(): RealStats {
    return { ...this.stats };
  }

  public getDeviceInfo() {
    const { width, height } = Dimensions.get("window");
    return {
      platform: Platform.OS,
      osVersion: Platform.Version.toString(),
      screenResolution: `${width}x${height}`,
      deviceModel: Platform.OS === "ios" ? "iPhone" : "Android Device",
    };
  }

  public getSystemInfo() {
    return {
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: Platform.OS === "ios" ? "en" : "en", // You can get actual language
    };
  }
}

export default StatsCollector;
