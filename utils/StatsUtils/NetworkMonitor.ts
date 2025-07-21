// utils/NetworkMonitor.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const NETWORK_STATS_KEY = "networkStats";

export interface NetworkStats {
  requestCount: number;
  successfulRequests: number;
  failedRequests: number;
  totalDataTransfer: number;
  averageResponseTime: number;
  connectionType: string;
  isConnected: boolean;
}

class NetworkMonitor {
  private static instance: NetworkMonitor;
  private stats: NetworkStats = {
    requestCount: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalDataTransfer: 0,
    averageResponseTime: 0,
    connectionType: "unknown",
    isConnected: true,
  };
  private responseTimes: number[] = [];

  public static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  // Track network requests
  public trackRequest(): void {
    this.stats.requestCount++;
    this.saveStats();
  }

  public trackSuccessfulRequest(responseTime: number): void {
    this.stats.successfulRequests++;
    this.responseTimes.push(responseTime);
    this.updateAverageResponseTime();
    this.saveStats();
  }

  public trackFailedRequest(): void {
    this.stats.failedRequests++;
    this.saveStats();
  }

  public trackDataTransfer(bytes: number): void {
    this.stats.totalDataTransfer += bytes;
    this.saveStats();
  }

  private updateAverageResponseTime(): void {
    if (this.responseTimes.length > 0) {
      const sum = this.responseTimes.reduce((a, b) => a + b, 0);
      this.stats.averageResponseTime = Math.round(
        sum / this.responseTimes.length
      );
    }
  }

  // Monitor network status
  public async checkNetworkStatus(): Promise<void> {
    try {
      const netInfo = await NetInfo.fetch();
      this.stats.connectionType = netInfo.type || "unknown";
      this.stats.isConnected = netInfo.isConnected || false;
      this.saveStats();
    } catch (error) {
      console.log("Error checking network status:", error);
    }
  }

  private async saveStats(): Promise<void> {
    try {
      await AsyncStorage.setItem(NETWORK_STATS_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.log("Error saving network stats:", error);
    }
  }

  public getStats(): NetworkStats {
    return { ...this.stats };
  }
}

export default NetworkMonitor;
