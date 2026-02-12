import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { agentEngine } from "./services/agentEngine";
import { strategyService } from "./services/strategies";
import { riskManagerService } from "./services/riskManager";
import { marketDataService } from "./services/marketData";
import { insertStrategySchema, insertRiskParametersSchema, insertUserSchema, insertAgentSchema } from "@shared/schema";
import { ethers } from "ethers";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('WebSocket client connected');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });
  });

  // Broadcast function
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Start the default agent
  setTimeout(async () => {
    const agent = await storage.getActiveAgent();
    if (agent) {
      await agentEngine.start(agent.id);
      
      // Broadcast updates every 5 seconds
      setInterval(async () => {
        const status = await agentEngine.getAgentStatus(agent.id);
        const activities = await storage.getActivities(agent.id, 10);
        const marketData = await marketDataService.getLatestMarketData("ETH/USD");
        
        broadcast({
          type: 'update',
          data: {
            status,
            activities,
            marketData,
          }
        });
      }, 5000);
    }
  }, 1000);

  // API Routes

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { walletAddress, paymentTxHash } = req.body;
      
      if (!walletAddress || !paymentTxHash) {
        return res.status(400).json({ error: "Wallet address and payment transaction hash required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByWallet(walletAddress);
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }

      // Create user with payment verification pending
      const userData = insertUserSchema.parse({
        walletAddress,
        paymentTxHash,
        paymentAmount: "0.00100000",
        paymentVerified: true // For demo purposes - in production, verify the transaction
      });

      const user = await storage.createUser(userData);

      // Create agent for the user
      const agentData = insertAgentSchema.parse({
        userId: user.id,
        name: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} Agent`,
        targetAddress: process.env.TARGET_WALLET_ADDRESS || "",
        simulationMode: true,
        status: "inactive"
      });

      const agent = await storage.createAgent(agentData);

      // Initialize portfolio and risk parameters
      await storage.updatePortfolio(agent.id, {
        agentId: agent.id,
        totalValue: "0.00000000",
        ethBalance: "0.00000000",
        usdValue: "0.00",
        performance24h: "0.00"
      });

      await storage.updateRiskParameters(agent.id, {
        agentId: agent.id,
        maxDailyLoss: "5.00",
        maxPositionSize: "10.00",
        circuitBreakerEnabled: true,
        volatilityFilterEnabled: true,
        smartRebalancingEnabled: true
      });

      res.json({ user, agent });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address required" });
      }

      const user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        return res.status(404).json({ error: "User not found. Please register first." });
      }

      if (!user.paymentVerified) {
        return res.status(403).json({ error: "Payment not verified" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

      // Get user's agent
      const agent = await storage.getUserAgent(user.id);

      res.json({ user, agent });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Agent routes
  app.get("/api/agent/status", async (req, res) => {
    try {
      const agent = await storage.getActiveAgent();
      if (!agent) {
        return res.status(404).json({ message: "No active agent found" });
      }
      
      const status = await agentEngine.getAgentStatus(agent.id);
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get agent status" });
    }
  });

  app.post("/api/agent/start", async (req, res) => {
    try {
      const agent = await storage.getActiveAgent();
      if (!agent) {
        return res.status(404).json({ message: "No active agent found" });
      }
      
      await agentEngine.start(agent.id);
      res.json({ message: "Agent started successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start agent" });
    }
  });

  app.post("/api/agent/stop", async (req, res) => {
    try {
      const agent = await storage.getActiveAgent();
      if (!agent) {
        return res.status(404).json({ message: "No active agent found" });
      }
      
      await agentEngine.stop(agent.id);
      res.json({ message: "Agent stopped successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to stop agent" });
    }
  });

  app.post("/api/agent/simulation-mode", async (req, res) => {
    try {
      const { enabled } = req.body;
      const agent = await storage.getActiveAgent();
      if (!agent) {
        return res.status(404).json({ message: "No active agent found" });
      }
      
      await storage.updateAgent(agent.id, { simulationMode: enabled });
      res.json({ message: "Simulation mode updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update simulation mode" });
    }
  });

  // Strategy routes
  app.get("/api/strategies", async (req, res) => {
    try {
      const agent = await storage.getActiveAgent();
      if (!agent) {
        return res.status(404).json({ message: "No active agent found" });
      }
      
      const strategies = await strategyService.getAllStrategies(agent.id);
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ message: "Failed to get strategies" });
    }
  });

  app.post("/api/strategies", async (req, res) => {
    try {
      const agent = await storage.getActiveAgent();
      if (!agent) {
        return res.status(404).json({ message: "No active agent found" });
      }

      const validatedData = insertStrategySchema.parse({
        ...req.body,
        agentId: agent.id,
      });
      
      const strategy = await storage.createStrategy(validatedData);
      res.json(strategy);
    } catch (error) {
      res.status(400).json({ message: "Invalid strategy data" });
    }
  });

  app.put("/api/strategies/:id", async (req, res) => {
    try {
      const strategyId = parseInt(req.params.id);
      const updates = req.body;
      
      const strategy = await storage.updateStrategy(strategyId, updates);
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      res.json(strategy);
    } catch (error) {
      res.status(500).json({ message: "Failed to update strategy" });
    }
  });

  app.delete("/api/strategies/:id", async (req, res) => {
    try {
      const strategyId = parseInt(req.params.id);
      const deleted = await storage.deleteStrategy(strategyId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      res.json({ message: "Strategy deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete strategy" });
    }
  });

  // Portfolio routes
  app.get("/api/portfolio", async (req, res) => {
    try {
      const agent = await storage.getActiveAgent();
      if (!agent) {
        return res.status(404).json({ message: "No active agent found" });
      }
      
      const portfolio = await storage.getPortfolio(agent.id);
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ message: "Failed to get portfolio" });
    }
  });

  // Activity routes
  app.get("/api/activities", async (req, res) => {
    try {
      const agent = await storage.getActiveAgent();
      if (!agent) {
        return res.status(404).json({ message: "No active agent found" });
      }
      
      const limit = parseInt(req.query.limit as string) || 50;
      const activities = await storage.getActivities(agent.id, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to get activities" });
    }
  });

  // Risk management routes
  app.get("/api/risk-parameters", async (req, res) => {
    try {
      const agent = await storage.getActiveAgent();
      if (!agent) {
        return res.status(404).json({ message: "No active agent found" });
      }
      
      const riskParams = await storage.getRiskParameters(agent.id);
      res.json(riskParams);
    } catch (error) {
      res.status(500).json({ message: "Failed to get risk parameters" });
    }
  });

  app.put("/api/risk-parameters", async (req, res) => {
    try {
      const agent = await storage.getActiveAgent();
      if (!agent) {
        return res.status(404).json({ message: "No active agent found" });
      }

      const validatedData = insertRiskParametersSchema.parse({
        ...req.body,
        agentId: agent.id,
      });
      
      const riskParams = await storage.updateRiskParameters(agent.id, validatedData);
      res.json(riskParams);
    } catch (error) {
      res.status(400).json({ message: "Invalid risk parameters" });
    }
  });

  // Market data routes
  app.get("/api/market-data/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const marketData = await storage.getLatestMarketData(symbol);
      res.json(marketData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get market data" });
    }
  });

  return httpServer;
}
