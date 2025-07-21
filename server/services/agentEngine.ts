import { storage } from "../storage";
import { marketDataService } from "./marketData";
import { strategyService } from "./strategies";
import { riskManagerService } from "./riskManager";

export class AgentEngine {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  async start(agentId: number): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    await storage.updateAgent(agentId, { status: "active" });

    // Run agent logic every 30 seconds
    this.intervalId = setInterval(async () => {
      await this.executeAgentCycle(agentId);
    }, 30000);

    console.log(`Agent ${agentId} started`);
  }

  async stop(agentId: number): Promise<void> {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    await storage.updateAgent(agentId, { status: "inactive" });
    console.log(`Agent ${agentId} stopped`);
  }

  private async executeAgentCycle(agentId: number): Promise<void> {
    try {
      // 1. Check risk limits
      const riskCheck = await riskManagerService.checkRiskLimits(agentId);
      if (!riskCheck.passed) {
        console.log(`Risk violations for agent ${agentId}:`, riskCheck.violations);
        await riskManagerService.triggerCircuitBreaker(agentId, riskCheck.violations.join(", "));
        return;
      }

      // 2. Update market data
      await marketDataService.getETHPrice();

      // 3. Execute strategies
      const activeStrategies = await strategyService.getActiveStrategies(agentId);
      
      for (const strategy of activeStrategies) {
        await this.executeStrategy(strategy.id, strategy.type);
      }

      // 4. Update portfolio
      await this.updatePortfolioValue(agentId);

    } catch (error) {
      console.error(`Error in agent cycle for agent ${agentId}:`, error);
      
      await storage.createActivity({
        agentId,
        type: "error",
        action: "Agent Cycle Error",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        result: "failed",
      });
    }
  }

  private async executeStrategy(strategyId: number, type: string): Promise<void> {
    switch (type) {
      case "dca":
        const strategy = await storage.updateStrategy(strategyId, {});
        if (strategy?.config && (strategy.config as any).nextExecution <= Date.now()) {
          await strategyService.executeDCA(strategyId);
        }
        break;
      
      case "momentum":
        await strategyService.checkMomentumSignals(strategyId);
        break;
      
      case "arbitrage":
        await strategyService.scanArbitrageOpportunities(strategyId);
        break;
    }
  }

  private async updatePortfolioValue(agentId: number): Promise<void> {
    const ethPrice = await marketDataService.getETHPrice();
    const currentPortfolio = await storage.getPortfolio(agentId);
    
    if (currentPortfolio) {
      const ethBalance = parseFloat(currentPortfolio.ethBalance);
      const newUsdValue = (ethBalance * ethPrice).toFixed(2);
      
      // Calculate 24h performance (simplified)
      const oldUsdValue = parseFloat(currentPortfolio.usdValue || "0");
      const performance24h = oldUsdValue > 0 ? 
        (((parseFloat(newUsdValue) - oldUsdValue) / oldUsdValue) * 100).toFixed(2) : "0";

      await storage.updatePortfolio(agentId, {
        usdValue: newUsdValue,
        performance24h,
      });
    }
  }

  async getAgentStatus(agentId: number) {
    const agent = await storage.getAgent(agentId);
    const strategies = await storage.getActiveStrategies(agentId);
    const portfolio = await storage.getPortfolio(agentId);
    const riskScore = await riskManagerService.calculateRiskScore(agentId);
    
    return {
      agent,
      activeStrategies: strategies.length,
      portfolio,
      riskScore,
      isRunning: this.isRunning,
    };
  }
}

export const agentEngine = new AgentEngine();
