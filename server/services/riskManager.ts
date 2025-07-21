import { storage } from "../storage";
import type { InsertActivity } from "@shared/schema";

export class RiskManagerService {
  async checkRiskLimits(agentId: number): Promise<{ passed: boolean; violations: string[] }> {
    const riskParams = await storage.getRiskParameters(agentId);
    const portfolio = await storage.getPortfolio(agentId);
    
    if (!riskParams || !portfolio) {
      return { passed: false, violations: ["Risk parameters not found"] };
    }

    const violations: string[] = [];

    // Check daily loss limit
    const dailyLoss = parseFloat(portfolio.performance24h || "0");
    const maxDailyLoss = parseFloat(riskParams.maxDailyLoss || "5");
    
    if (Math.abs(dailyLoss) > maxDailyLoss && dailyLoss < 0) {
      violations.push(`Daily loss (${Math.abs(dailyLoss).toFixed(2)}%) exceeds limit (${maxDailyLoss}%)`);
    }

    // Log risk check
    await storage.createActivity({
      agentId,
      type: "risk_check",
      action: "Risk Check Completed",
      details: {
        dailyLoss: dailyLoss.toFixed(2),
        maxDailyLoss: maxDailyLoss.toString(),
        violations: violations.length,
      },
      result: violations.length === 0 ? "success" : "warning",
    });

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  async triggerCircuitBreaker(agentId: number, reason: string): Promise<void> {
    // Pause all active strategies
    const strategies = await storage.getActiveStrategies(agentId);
    
    for (const strategy of strategies) {
      await storage.updateStrategy(strategy.id, { status: "paused" });
    }

    // Update agent status
    await storage.updateAgent(agentId, { status: "paused" });

    // Log circuit breaker activation
    await storage.createActivity({
      agentId,
      type: "risk_check",
      action: "Circuit Breaker Activated",
      details: {
        reason,
        strategiesPaused: strategies.length,
      },
      result: "success",
    });
  }

  async calculateRiskScore(agentId: number): Promise<{ score: number; level: string }> {
    const portfolio = await storage.getPortfolio(agentId);
    const riskParams = await storage.getRiskParameters(agentId);
    
    if (!portfolio || !riskParams) {
      return { score: 10, level: "High" };
    }

    let score = 0;
    
    // Factor in daily performance volatility
    const dailyPerf = Math.abs(parseFloat(portfolio.performance24h || "0"));
    score += Math.min(dailyPerf / 10, 3); // Max 3 points for volatility

    // Factor in enabled safety controls
    if (riskParams.circuitBreakerEnabled) score -= 1;
    if (riskParams.volatilityFilterEnabled) score -= 1;
    if (riskParams.smartRebalancingEnabled) score -= 0.5;

    score = Math.max(0, Math.min(10, score));

    let level = "Low";
    if (score > 6) level = "High";
    else if (score > 3) level = "Medium";

    return { score: Math.round(score * 10) / 10, level };
  }

  async updateRiskParameters(agentId: number, params: any) {
    return storage.updateRiskParameters(agentId, params);
  }

  async getRiskParameters(agentId: number) {
    return storage.getRiskParameters(agentId);
  }
}

export const riskManagerService = new RiskManagerService();
