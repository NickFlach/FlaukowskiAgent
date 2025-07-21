import {
  Agent,
  InsertAgent,
  Strategy,
  InsertStrategy,
  Activity,
  InsertActivity,
  Portfolio,
  InsertPortfolio,
  RiskParameters,
  InsertRiskParameters,
  MarketData,
  InsertMarketData,
  User,
  InsertUser,
  agents,
  strategies,
  activities,
  portfolios,
  riskParameters,
  marketData,
  users,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  verifyPayment(walletAddress: string, txHash: string): Promise<boolean>;

  // Agents
  getAgent(id: number): Promise<Agent | undefined>;
  getActiveAgent(): Promise<Agent | undefined>;
  getUserAgent(userId: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined>;

  // Strategies
  getStrategies(agentId: number): Promise<Strategy[]>;
  getActiveStrategies(agentId: number): Promise<Strategy[]>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  updateStrategy(id: number, updates: Partial<Strategy>): Promise<Strategy | undefined>;
  deleteStrategy(id: number): Promise<boolean>;

  // Activities
  getActivities(agentId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Portfolio
  getPortfolio(agentId: number): Promise<Portfolio | undefined>;
  updatePortfolio(agentId: number, portfolio: Partial<Portfolio>): Promise<Portfolio>;

  // Risk Parameters
  getRiskParameters(agentId: number): Promise<RiskParameters | undefined>;
  updateRiskParameters(agentId: number, params: Partial<RiskParameters>): Promise<RiskParameters>;

  // Market Data
  getLatestMarketData(symbol: string): Promise<MarketData | undefined>;
  saveMarketData(data: InsertMarketData): Promise<MarketData>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async verifyPayment(walletAddress: string, txHash: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.walletAddress, walletAddress),
        eq(users.paymentTxHash, txHash),
        eq(users.paymentVerified, true)
      ));
    return !!user;
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent || undefined;
  }

  async getActiveAgent(): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.status, "active"));
    return agent || undefined;
  }

  async getUserAgent(userId: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.userId, userId));
    return agent || undefined;
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const [agent] = await db
      .insert(agents)
      .values(insertAgent)
      .returning();
    return agent;
  }

  async updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined> {
    const [agent] = await db
      .update(agents)
      .set(updates)
      .where(eq(agents.id, id))
      .returning();
    return agent || undefined;
  }

  async getStrategies(agentId: number): Promise<Strategy[]> {
    return await db.select().from(strategies).where(eq(strategies.agentId, agentId));
  }

  async getActiveStrategies(agentId: number): Promise<Strategy[]> {
    return await db
      .select()
      .from(strategies)
      .where(and(
        eq(strategies.agentId, agentId),
        eq(strategies.status, "active")
      ));
  }

  async createStrategy(insertStrategy: InsertStrategy): Promise<Strategy> {
    const [strategy] = await db
      .insert(strategies)
      .values(insertStrategy)
      .returning();
    return strategy;
  }

  async updateStrategy(id: number, updates: Partial<Strategy>): Promise<Strategy | undefined> {
    // Skip update if no fields to update
    if (Object.keys(updates).length === 0) {
      const [strategy] = await db.select().from(strategies).where(eq(strategies.id, id));
      return strategy || undefined;
    }

    const [strategy] = await db
      .update(strategies)
      .set(updates)
      .where(eq(strategies.id, id))
      .returning();
    return strategy || undefined;
  }

  async deleteStrategy(id: number): Promise<boolean> {
    const result = await db.delete(strategies).where(eq(strategies.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getActivities(agentId: number, limit = 50): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.agentId, agentId))
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getPortfolio(agentId: number): Promise<Portfolio | undefined> {
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.agentId, agentId));
    return portfolio || undefined;
  }

  async updatePortfolio(agentId: number, updates: Partial<Portfolio>): Promise<Portfolio> {
    const existing = await this.getPortfolio(agentId);
    
    if (existing) {
      const [portfolio] = await db
        .update(portfolios)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(portfolios.agentId, agentId))
        .returning();
      return portfolio;
    } else {
      const [portfolio] = await db
        .insert(portfolios)
        .values({
          agentId,
          totalValue: "0",
          ethBalance: "0",
          usdValue: "0",
          ...updates,
        })
        .returning();
      return portfolio;
    }
  }

  async getRiskParameters(agentId: number): Promise<RiskParameters | undefined> {
    const [params] = await db
      .select()
      .from(riskParameters)
      .where(eq(riskParameters.agentId, agentId));
    return params || undefined;
  }

  async updateRiskParameters(agentId: number, updates: Partial<RiskParameters>): Promise<RiskParameters> {
    const existing = await this.getRiskParameters(agentId);
    
    if (existing) {
      const [params] = await db
        .update(riskParameters)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(riskParameters.agentId, agentId))
        .returning();
      return params;
    } else {
      const [params] = await db
        .insert(riskParameters)
        .values({
          agentId,
          maxDailyLoss: "5.00",
          maxPositionSize: "10.00",
          circuitBreakerEnabled: true,
          volatilityFilterEnabled: true,
          smartRebalancingEnabled: true,
          ...updates,
        })
        .returning();
      return params;
    }
  }

  async getLatestMarketData(symbol: string): Promise<MarketData | undefined> {
    const [data] = await db
      .select()
      .from(marketData)
      .where(eq(marketData.symbol, symbol))
      .orderBy(desc(marketData.timestamp))
      .limit(1);
    return data || undefined;
  }

  async saveMarketData(insertData: InsertMarketData): Promise<MarketData> {
    const [data] = await db
      .insert(marketData)
      .values(insertData)
      .returning();
    return data;
  }
}

export const storage = new DatabaseStorage();