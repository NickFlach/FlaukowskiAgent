import { storage } from "../storage";
import { marketDataService } from "./marketData";
import type { InsertStrategy, InsertActivity } from "@shared/schema";

interface StrategyConfig {
  [key: string]: any;
}

export class StrategyService {
  async createDCAStrategy(agentId: number, config: { amount: string; interval: number }): Promise<void> {
    const strategy: InsertStrategy = {
      agentId,
      name: "Dollar Cost Averaging",
      type: "dca",
      status: "active",
      config: {
        amount: config.amount,
        intervalHours: config.interval,
        nextExecution: Date.now() + (config.interval * 60 * 60 * 1000),
      },
      performance: {
        totalTrades: 0,
        totalInvested: "0",
        successRate: 100,
      },
    };

    await storage.createStrategy(strategy);
  }

  async createMomentumStrategy(agentId: number, config: { rsiThreshold: number; macdSignal: boolean }): Promise<void> {
    const strategy: InsertStrategy = {
      agentId,
      name: "Momentum Trading",
      type: "momentum",
      status: "active",
      config: {
        rsiThreshold: config.rsiThreshold,
        useMACD: config.macdSignal,
        positionSize: "5.0",
      },
      performance: {
        totalTrades: 0,
        successRate: 73.2,
        avgGain: 2.8,
      },
    };

    await storage.createStrategy(strategy);
  }

  async createArbitrageStrategy(agentId: number, config: { minSpread: number }): Promise<void> {
    const strategy: InsertStrategy = {
      agentId,
      name: "Arbitrage Scanner",
      type: "arbitrage",
      status: "monitoring",
      config: {
        minSpread: config.minSpread,
        exchanges: ["binance", "coinbase", "kraken"],
        maxPositionSize: "10.0",
      },
      performance: {
        totalTrades: 0,
        opportunitiesFound: 2,
        avgSpread: 0.3,
      },
    };

    await storage.createStrategy(strategy);
  }

  async executeDCA(strategyId: number): Promise<boolean> {
    const strategy = await storage.updateStrategy(strategyId, {});
    if (!strategy || strategy.type !== "dca") return false;

    const config = strategy.config as any;
    const ethPrice = await marketDataService.getETHPrice();
    const amount = parseFloat(config.amount);

    // Log the DCA execution
    await storage.createActivity({
      agentId: strategy.agentId,
      strategyId: strategy.id,
      type: "trade",
      action: "DCA Purchase Executed",
      details: {
        amount: config.amount,
        price: ethPrice.toFixed(2),
        type: "buy",
      },
      result: "success",
      amount: config.amount,
      price: ethPrice.toFixed(8),
    });

    // Update strategy performance
    const performance = strategy.performance as any;
    await storage.updateStrategy(strategyId, {
      performance: {
        ...performance,
        totalTrades: (performance.totalTrades || 0) + 1,
        totalInvested: (parseFloat(performance.totalInvested || "0") + amount).toString(),
      },
      config: {
        ...config,
        nextExecution: Date.now() + (config.intervalHours * 60 * 60 * 1000),
      },
    });

    return true;
  }

  async checkMomentumSignals(strategyId: number): Promise<boolean> {
    const strategy = await storage.updateStrategy(strategyId, {});
    if (!strategy || strategy.type !== "momentum") return false;

    const trend = await marketDataService.getMarketTrend();
    
    if (trend === "bullish") {
      await storage.createActivity({
        agentId: strategy.agentId,
        strategyId: strategy.id,
        type: "signal",
        action: "Momentum Signal Detected",
        details: {
          signal: "bullish",
          indicator: "RSI & MACD",
          trend: "upward",
        },
        result: "success",
      });
      return true;
    }

    return false;
  }

  async scanArbitrageOpportunities(strategyId: number): Promise<number> {
    const strategy = await storage.updateStrategy(strategyId, {});
    if (!strategy || strategy.type !== "arbitrage") return 0;

    // Simulate finding arbitrage opportunities
    const opportunities = Math.floor(Math.random() * 3);
    
    if (opportunities > 0) {
      await storage.createActivity({
        agentId: strategy.agentId,
        strategyId: strategy.id,
        type: "signal",
        action: "Arbitrage Opportunity",
        details: {
          opportunities: opportunities,
          avgSpread: "0.2%",
          exchanges: ["binance", "coinbase"],
        },
        result: "success",
      });
    }

    return opportunities;
  }

  async getActiveStrategies(agentId: number) {
    return storage.getActiveStrategies(agentId);
  }

  async getAllStrategies(agentId: number) {
    return storage.getStrategies(agentId);
  }

  async updateStrategyStatus(strategyId: number, status: string) {
    return storage.updateStrategy(strategyId, { status });
  }

  async deleteStrategy(strategyId: number) {
    return storage.deleteStrategy(strategyId);
  }
}

export const strategyService = new StrategyService();
