import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MetricCard } from "@/components/MetricCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { ActivityFeed } from "@/components/ActivityFeed";
import { StrategyCard } from "@/components/StrategyCard";
import { MetricCardSkeleton, StrategyCardSkeleton, ChartSkeleton } from "@/components/LoadingSkeleton";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [simulationMode, setSimulationMode] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lastMessage, isConnected } = useWebSocket();

  const { data: agentStatus, isLoading: isLoadingAgent } = useQuery({
    queryKey: ["/api/agent/status"],
    refetchInterval: 10000,
  });

  const { data: strategies = [], isLoading: isLoadingStrategies } = useQuery({
    queryKey: ["/api/strategies"],
    refetchInterval: 10000,
  });

  const { data: portfolio, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ["/api/portfolio"],
    refetchInterval: 10000,
  });

  const { data: marketData, isLoading: isLoadingMarket } = useQuery({
    queryKey: ["/api/market-data/ETH/USD"],
    refetchInterval: 5000,
  });

  // WebSocket real-time updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'update') {
      // Update query cache with real-time data
      queryClient.setQueryData(["/api/agent/status"], lastMessage.data.status);
      queryClient.setQueryData(["/api/activities"], lastMessage.data.activities);
      queryClient.setQueryData(["/api/market-data/ETH/USD"], lastMessage.data.marketData);
    }
  }, [lastMessage, queryClient]);

  const emergencyStopMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/agent/stop"),
    onSuccess: () => {
      toast({
        title: "Emergency Stop Activated",
        description: "All trading activities have been halted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/status"] });
    },
  });

  const simulationModeMutation = useMutation({
    mutationFn: (enabled: boolean) => apiRequest("POST", "/api/agent/simulation-mode", { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/status"] });
    },
  });

  const handleSimulationToggle = (enabled: boolean) => {
    setSimulationMode(enabled);
    simulationModeMutation.mutate(enabled);
  };

  const activeStrategies = strategies.filter((s: any) => s.status === "active");
  const ethPrice = marketData?.price ? parseFloat(marketData.price) : 1920.45;
  const portfolioValue = portfolio?.totalValue ? parseFloat(portfolio.totalValue) : 12.4578;
  const usdValue = portfolio?.usdValue ? parseFloat(portfolio.usdValue) : 23847.23;
  const performance24h = portfolio?.performance24h ? parseFloat(portfolio.performance24h) : 5.68;

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Top Navigation Bar */}
      <header className="bg-navy-800 border-b border-navy-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-light">Dashboard</h2>
            <p className="text-text-muted">Monitor your autonomous trading agent performance</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Real-time Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-green animate-pulse' : 'bg-alert-red'}`}></div>
              <span className="text-xs text-text-muted">
                {isConnected ? 'Live Data' : 'Disconnected'}
              </span>
            </div>

            {/* Simulation Mode Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-muted">Simulation Mode</span>
              <Switch
                checked={simulationMode}
                onCheckedChange={handleSimulationToggle}
                disabled={simulationModeMutation.isPending}
              />
            </div>

            {/* Emergency Stop Button */}
            <Button
              variant="destructive"
              onClick={() => emergencyStopMutation.mutate()}
              disabled={emergencyStopMutation.isPending}
              className="bg-alert-red hover:bg-red-600"
            >
              <i className="fas fa-stop mr-2"></i>
              Emergency Stop
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="p-6 space-y-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoadingPortfolio ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                title="Portfolio Value"
                value={`${formatNumber(portfolioValue, 4)} ETH`}
                subtitle={formatCurrency(usdValue)}
                icon="fab fa-ethereum"
                iconColor="text-trading-blue"
                change={formatPercentage(performance24h)}
                changeType={performance24h >= 0 ? "positive" : "negative"}
              />

              <MetricCard
                title="24h Performance"
                value={`+${formatNumber(performance24h * portfolioValue / 100, 2)} ETH`}
                subtitle={`${formatPercentage(performance24h)} gain`}
                icon="fas fa-chart-line"
                iconColor="text-success-green"
              />

              <MetricCard
                title="Active Strategies"
                value={activeStrategies.length.toString()}
                subtitle={activeStrategies.map((s: any) => s.type).join(", ") || "None"}
                icon="fas fa-cogs"
                iconColor="text-warning-orange"
              />

              <MetricCard
                title="Risk Score"
                value={agentStatus?.riskScore?.level || "Low"}
                subtitle={`${agentStatus?.riskScore?.score || 2.3}/10 risk level`}
                icon="fas fa-shield-alt"
                iconColor="text-success-green"
              />
            </>
          )}
        </div>

        {/* Charts and Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Performance Chart */}
          <div className="lg:col-span-2">
            <PerformanceChart title="Portfolio Performance" />
          </div>

          {/* Recent Activity Feed */}
          <ActivityFeed />
        </div>

        {/* Strategy Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Strategies Panel */}
          <div className="bg-navy-800 rounded-xl p-6 border border-navy-600">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-light">Active Strategies</h3>
              <Button className="bg-trading-blue hover:bg-blue-600">
                <i className="fas fa-plus mr-2"></i>
                Add Strategy
              </Button>
            </div>
            <div className="space-y-4">
              {strategies.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <i className="fas fa-chart-line text-2xl mb-2"></i>
                  <p>No strategies configured</p>
                  <p className="text-sm">Add a strategy to start trading</p>
                </div>
              ) : (
                strategies.map((strategy: any) => (
                  <StrategyCard key={strategy.id} strategy={strategy} />
                ))
              )}
            </div>
          </div>

          {/* Market Data Panel */}
          <div className="bg-navy-800 rounded-xl p-6 border border-navy-600">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-light">Market Data & Analysis</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-success-green rounded-full animate-pulse"></div>
                  <span className="text-xs text-text-muted">Live Data</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* ETH Price Card */}
              <div className="bg-navy-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <i className="fab fa-ethereum text-trading-blue text-lg"></i>
                    <span className="font-medium text-text-light">ETH/USD</span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-success-green text-white rounded">
                    {marketData?.change24h ? formatPercentage(marketData.change24h) : "+2.1%"}
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold text-text-light">
                  {formatCurrency(ethPrice)}
                </p>
                <p className="text-sm text-success-green">
                  +${((ethPrice * (parseFloat(marketData?.change24h || "2.1") / 100))).toFixed(2)} (24h)
                </p>
              </div>

              {/* Market Sentiment */}
              <div className="bg-navy-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-text-light">Market Sentiment</span>
                  <i className="fas fa-chart-line text-success-green"></i>
                </div>
                <p className="text-2xl font-bold text-success-green capitalize">
                  {marketData?.sentiment || "Bullish"}
                </p>
                <p className="text-sm text-text-muted">
                  Fear & Greed: {marketData?.fearGreedIndex || 72}/100
                </p>
              </div>

              {/* Next Actions */}
              <div className="bg-navy-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-text-light">Next Actions</span>
                  <i className="fas fa-clock text-warning-orange"></i>
                </div>
                <p className="text-sm text-text-light mb-1">
                  {activeStrategies.length > 0 ? "DCA Purchase" : "No scheduled actions"}
                </p>
                <p className="text-lg font-mono text-warning-orange">
                  {activeStrategies.length > 0 ? "2m 34s" : "--:--"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
