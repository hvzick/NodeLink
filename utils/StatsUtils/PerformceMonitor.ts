// utils/PerformanceMonitor.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const PERF_STATS_KEY = "performanceStats";

export interface PerformanceStats {
  memoryUsage: number;
  renderTime: number;
  componentMounts: number;
  componentUpdates: number;
  errors: number;
  warnings: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private stats: PerformanceStats = {
    memoryUsage: 0,
    renderTime: 0,
    componentMounts: 0,
    componentUpdates: 0,
    errors: 0,
    warnings: 0,
  };

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track component lifecycle
  public trackComponentMount(): void {
    this.stats.componentMounts++;
    this.saveStats();
  }

  public trackComponentUpdate(): void {
    this.stats.componentUpdates++;
    this.saveStats();
  }

  // Track errors
  public trackError(): void {
    this.stats.errors++;
    this.saveStats();
  }

  public trackWarning(): void {
    this.stats.warnings++;
    this.saveStats();
  }

  // Get memory usage (approximate)
  public trackMemoryUsage(): void {
    // This is a simplified version - actual memory tracking is complex
    const approximateMemory = Math.floor(Math.random() * 100) + 50; // Mock for now
    this.stats.memoryUsage = approximateMemory;
    this.saveStats();
  }

  // Measure render performance
  public startRenderTimer(): number {
    return Date.now();
  }

  public endRenderTimer(startTime: number): void {
    const renderTime = Date.now() - startTime;
    this.stats.renderTime = renderTime;
    this.saveStats();
  }

  private async saveStats(): Promise<void> {
    try {
      await AsyncStorage.setItem(PERF_STATS_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.log("Error saving performance stats:", error);
    }
  }

  public getStats(): PerformanceStats {
    return { ...this.stats };
  }
}

export default PerformanceMonitor;
