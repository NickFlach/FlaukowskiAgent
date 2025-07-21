import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  paymentTxHash: text("payment_tx_hash").notNull().unique(),
  paymentAmount: decimal("payment_amount", { precision: 18, scale: 8 }).notNull(),
  paymentVerified: boolean("payment_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("inactive"), // active, inactive, paused, error
  targetAddress: text("target_address").notNull(),
  simulationMode: boolean("simulation_mode").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastActivity: timestamp("last_activity"),
});

export const strategies = pgTable("strategies", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => agents.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // dca, momentum, arbitrage
  status: text("status").notNull().default("inactive"), // active, inactive, monitoring
  config: jsonb("config").notNull(),
  performance: jsonb("performance"), // success_rate, avg_gain, total_trades
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => agents.id),
  strategyId: integer("strategy_id").references(() => strategies.id),
  type: text("type").notNull(), // trade, signal, risk_check, error
  action: text("action").notNull(),
  details: jsonb("details"),
  result: text("result"), // success, failed, pending
  amount: decimal("amount", { precision: 18, scale: 8 }),
  price: decimal("price", { precision: 18, scale: 8 }),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => agents.id),
  totalValue: decimal("total_value", { precision: 18, scale: 8 }).notNull(),
  ethBalance: decimal("eth_balance", { precision: 18, scale: 8 }).notNull(),
  usdValue: decimal("usd_value", { precision: 18, scale: 2 }),
  performance24h: decimal("performance_24h", { precision: 5, scale: 2 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const riskParameters = pgTable("risk_parameters", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => agents.id),
  maxDailyLoss: decimal("max_daily_loss", { precision: 5, scale: 2 }).default("5.00"),
  maxPositionSize: decimal("max_position_size", { precision: 5, scale: 2 }).default("10.00"),
  circuitBreakerEnabled: boolean("circuit_breaker_enabled").default(true),
  volatilityFilterEnabled: boolean("volatility_filter_enabled").default(true),
  smartRebalancingEnabled: boolean("smart_rebalancing_enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const marketData = pgTable("market_data", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  price: decimal("price", { precision: 18, scale: 8 }).notNull(),
  change24h: decimal("change_24h", { precision: 5, scale: 2 }),
  volume24h: decimal("volume_24h", { precision: 18, scale: 2 }),
  sentiment: text("sentiment"), // bullish, bearish, neutral
  fearGreedIndex: integer("fear_greed_index"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  lastActivity: true,
});

export const insertStrategySchema = createInsertSchema(strategies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export const insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  updatedAt: true,
});

export const insertRiskParametersSchema = createInsertSchema(riskParameters).omit({
  id: true,
  updatedAt: true,
});

export const insertMarketDataSchema = createInsertSchema(marketData).omit({
  id: true,
  timestamp: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  agents: many(agents),
}));

export const agentsRelations = relations(agents, ({ many, one }) => ({
  user: one(users, {
    fields: [agents.userId],
    references: [users.id],
  }),
  strategies: many(strategies),
  activities: many(activities),
  portfolio: one(portfolios),
  riskParameters: one(riskParameters),
}));

export const strategiesRelations = relations(strategies, ({ one, many }) => ({
  agent: one(agents, {
    fields: [strategies.agentId],
    references: [agents.id],
  }),
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  agent: one(agents, {
    fields: [activities.agentId],
    references: [agents.id],
  }),
  strategy: one(strategies, {
    fields: [activities.strategyId],
    references: [strategies.id],
  }),
}));

export const portfoliosRelations = relations(portfolios, ({ one }) => ({
  agent: one(agents, {
    fields: [portfolios.agentId],
    references: [agents.id],
  }),
}));

export const riskParametersRelations = relations(riskParameters, ({ one }) => ({
  agent: one(agents, {
    fields: [riskParameters.agentId],
    references: [agents.id],
  }),
}));

// Types
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type RiskParameters = typeof riskParameters.$inferSelect;
export type InsertRiskParameters = z.infer<typeof insertRiskParametersSchema>;
export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
