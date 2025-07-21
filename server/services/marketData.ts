import { storage } from "../storage";
import type { InsertMarketData } from "@shared/schema";

export class MarketDataService {
  private ethPrice = 1920.45;
  private lastUpdateTime = Date.now();

  async getETHPrice(): Promise<number> {
    // Simulate price movements
    const timeDiff = Date.now() - this.lastUpdateTime;
    if (timeDiff > 5000) { // Update every 5 seconds
      const change = (Math.random() - 0.5) * 20; // Random change between -10 and +10
      this.ethPrice = Math.max(1500, this.ethPrice + change);
      this.lastUpdateTime = Date.now();

      // Save to storage
      await this.saveMarketData({
        symbol: "ETH/USD",
        price: this.ethPrice.toFixed(8),
        change24h: ((Math.random() - 0.5) * 10).toFixed(2), // Random 24h change
        volume24h: (Math.random() * 1000000000).toFixed(2),
        sentiment: this.getSentiment(),
        fearGreedIndex: Math.floor(Math.random() * 100),
      });
    }
    return this.ethPrice;
  }

  private getSentiment(): string {
    const rand = Math.random();
    if (rand < 0.4) return "bullish";
    if (rand < 0.8) return "neutral";
    return "bearish";
  }

  async saveMarketData(data: InsertMarketData) {
    return storage.saveMarketData(data);
  }

  async getLatestMarketData(symbol: string) {
    return storage.getLatestMarketData(symbol);
  }

  async calculatePerformance(currentValue: number, previousValue: number): Promise<number> {
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  async getMarketTrend(): Promise<"bullish" | "bearish" | "neutral"> {
    const data = await this.getLatestMarketData("ETH/USD");
    return (data?.sentiment as "bullish" | "bearish" | "neutral") || "neutral";
  }
}

export const marketDataService = new MarketDataService();
