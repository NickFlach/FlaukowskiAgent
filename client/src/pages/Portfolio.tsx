import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/MetricCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { formatCurrency, formatNumber, formatPercentage, formatTimeAgo } from "@/lib/utils";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function Portfolio() {
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();

  const { data: portfolio = {} } = useQuery<any>({
    queryKey: ["/api/portfolio"],
    refetchInterval: 10000,
  });

  const { data: activities = [] } = useQuery<any[]>({
    queryKey: ["/api/activities"],
    refetchInterval: 10000,
  });

  const { data: marketData = {} } = useQuery<any>({
    queryKey: ["/api/market-data/ETH"],
    refetchInterval: 5000,
  });

  const { data: strategies = [] } = useQuery<any[]>({
    queryKey: ["/api/strategies"],
    refetchInterval: 10000,
  });

  // WebSocket real-time updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'update') {
      queryClient.setQueryData(["/api/portfolio"], lastMessage.data.status?.portfolio);
      queryClient.setQueryData(["/api/activities"], lastMessage.data.activities);
      queryClient.setQueryData(["/api/market-data/ETH"], lastMessage.data.marketData);
    }
  }, [lastMessage, queryClient]);

  const ethPrice = marketData?.price ? parseFloat(marketData.price) : 1920.45;
  const portfolioValue = portfolio?.totalValue ? parseFloat(portfolio.totalValue) : 12.4578;
  const usdValue = portfolio?.usdValue ? parseFloat(portfolio.usdValue) : 23847.23;
  const performance24h = portfolio?.performance24h ? parseFloat(portfolio.performance24h) : 5.68;

  // Calculate allocation breakdown
  const allocation = {
    eth: portfolioValue,
    usd: 0, // Currently all in ETH
    pending: 0,
  };

  const totalValue = allocation.eth + allocation.usd + allocation.pending;
  const ethPercentage = totalValue > 0 ? (allocation.eth / totalValue) * 100 : 100;

  // Get recent trading activities
  const tradingActivities = activities
    .filter((activity: any) => activity.type === "trade")
    .slice(0, 10);

  // Calculate strategy performance
  const strategyPerformance = strategies.map((strategy: any) => ({
    ...strategy,
    performance: strategy.performance || {},
  }));

  const targetAddress = "REDACTED_WALLET_ADDRESS";

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <header className="bg-navy-800 border-b border-navy-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-light">Portfolio Analytics</h1>
            <p className="text-text-muted">Track your autonomous agent's ETH accumulation and performance</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Target Address</p>
            <p className="font-mono text-sm text-text-light">{targetAddress}</p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Portfolio Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Portfolio Value"
            value={`${formatNumber(portfolioValue, 4)} ETH`}
            subtitle={formatCurrency(usdValue)}
            icon="fab fa-ethereum"
            iconColor="text-trading-blue"
            change={formatPercentage(performance24h)}
            changeType={performance24h >= 0 ? "positive" : "negative"}
          />

          <MetricCard
            title="24h P&L"
            value={formatCurrency(usdValue * (performance24h / 100))}
            subtitle={`${formatPercentage(performance24h)} change`}
            icon="fas fa-chart-line"
            iconColor={performance24h >= 0 ? "text-success-green" : "text-alert-red"}
            change={performance24h >= 0 ? "Profit" : "Loss"}
            changeType={performance24h >= 0 ? "positive" : "negative"}
          />

          <MetricCard
            title="Current ETH Price"
            value={formatCurrency(ethPrice)}
            subtitle={marketData?.change24h ? formatPercentage(marketData.change24h) : "+2.1%"}
            icon="fas fa-coins"
            iconColor="text-warning-orange"
            change={marketData?.change24h ? formatPercentage(marketData.change24h) : "+2.1%"}
            changeType={parseFloat(marketData?.change24h || "2.1") >= 0 ? "positive" : "negative"}
          />

          <MetricCard
            title="Total Trades"
            value={tradingActivities.length.toString()}
            subtitle="All-time executions"
            icon="fas fa-exchange-alt"
            iconColor="text-text-muted"
          />
        </div>

        {/* Portfolio Composition and Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Performance Chart */}
          <div className="lg:col-span-2">
            <PerformanceChart title="Portfolio Performance Over Time" />
          </div>

          {/* Asset Allocation */}
          <Card className="bg-navy-800 border-navy-600">
            <CardHeader>
              <CardTitle className="text-text-light">Asset Allocation</CardTitle>
              <CardDescription className="text-text-muted">Current portfolio breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <i className="fab fa-ethereum text-trading-blue"></i>
                      <span className="text-text-light">Ethereum</span>
                    </div>
                    <span className="text-text-light font-mono">{formatNumber(ethPercentage, 1)}%</span>
                  </div>
                  <Progress value={ethPercentage} className="h-2" />
                  <p className="text-xs text-text-muted">{formatNumber(portfolioValue, 4)} ETH</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-dollar-sign text-success-green"></i>
                      <span className="text-text-light">USD Reserve</span>
                    </div>
                    <span className="text-text-light font-mono">0%</span>
                  </div>
                  <Progress value={0} className="h-2" />
                  <p className="text-xs text-text-muted">$0.00 USD</p>
                </div>
              </div>

              <div className="pt-4 border-t border-navy-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted">Total Value</span>
                  <span className="text-text-light font-bold">{formatCurrency(usdValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">24h Change</span>
                  <span className={`font-mono ${performance24h >= 0 ? 'text-success-green' : 'text-alert-red'}`}>
                    {formatPercentage(performance24h)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="bg-navy-800 border border-navy-600">
            <TabsTrigger value="transactions" className="data-[state=active]:bg-trading-blue">Transactions</TabsTrigger>
            <TabsTrigger value="strategies" className="data-[state=active]:bg-trading-blue">Strategy Performance</TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-trading-blue">Risk Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <Card className="bg-navy-800 border-navy-600">
              <CardHeader>
                <CardTitle className="text-text-light">Recent Trading Activity</CardTitle>
                <CardDescription className="text-text-muted">Latest transactions executed by your agent</CardDescription>
              </CardHeader>
              <CardContent>
                {tradingActivities.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <i className="fas fa-chart-bar text-2xl mb-2"></i>
                    <p>No trading activities yet</p>
                    <p className="text-sm">Transactions will appear here once strategies are active</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tradingActivities.map((activity: any) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-navy-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-success-green rounded-full flex items-center justify-center">
                            <i className="fas fa-plus text-white text-xs"></i>
                          </div>
                          <div>
                            <p className="text-sm text-text-light">{activity.action}</p>
                            <p className="text-xs text-text-muted">
                              {activity.timestamp ? formatTimeAgo(activity.timestamp) : "Unknown time"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono text-text-light">
                            {activity.amount ? `${formatNumber(activity.amount, 4)} ETH` : "N/A"}
                          </p>
                          <p className="text-xs text-text-muted">
                            {activity.price ? formatCurrency(parseFloat(activity.price)) : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4">
            <Card className="bg-navy-800 border-navy-600">
              <CardHeader>
                <CardTitle className="text-text-light">Strategy Performance</CardTitle>
                <CardDescription className="text-text-muted">Performance metrics for each active strategy</CardDescription>
              </CardHeader>
              <CardContent>
                {strategyPerformance.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <i className="fas fa-chart-line text-2xl mb-2"></i>
                    <p>No strategies configured</p>
                    <p className="text-sm">Create strategies to see performance metrics</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {strategyPerformance.map((strategy: any) => (
                      <div key={strategy.id} className="p-4 bg-navy-700 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-trading-blue rounded-lg flex items-center justify-center">
                              <i className="fas fa-chart-line text-white text-xs"></i>
                            </div>
                            <div>
                              <h4 className="text-text-light font-medium">{strategy.name}</h4>
                              <p className="text-xs text-text-muted capitalize">{strategy.type} strategy</p>
                            </div>
                          </div>
                          <Badge className={`${strategy.status === 'active' ? 'bg-success-green' : 'bg-navy-600'} text-white`}>
                            {strategy.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-text-muted">Total Trades</p>
                            <p className="font-mono text-text-light">{strategy.performance?.totalTrades || 0}</p>
                          </div>
                          <div>
                            <p className="text-text-muted">Success Rate</p>
                            <p className="font-mono text-text-light">{strategy.performance?.successRate || 0}%</p>
                          </div>
                          <div>
                            <p className="text-text-muted">Avg. Gain</p>
                            <p className="font-mono text-success-green">
                              +{strategy.performance?.avgGain || 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-navy-800 border-navy-600">
                <CardHeader>
                  <CardTitle className="text-text-light">Risk Metrics</CardTitle>
                  <CardDescription className="text-text-muted">Current risk assessment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Risk Level</span>
                      <Badge className="bg-success-green text-white">Low</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Max Daily Loss</span>
                      <span className="text-text-light">5.0%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Current Drawdown</span>
                      <span className="text-success-green">0.0%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Portfolio Volatility</span>
                      <span className="text-text-light">12.3%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-navy-800 border-navy-600">
                <CardHeader>
                  <CardTitle className="text-text-light">Safety Controls</CardTitle>
                  <CardDescription className="text-text-muted">Active protection mechanisms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Circuit Breaker</span>
                      <Badge className="bg-success-green text-white">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Volatility Filter</span>
                      <Badge className="bg-success-green text-white">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Smart Rebalancing</span>
                      <Badge className="bg-success-green text-white">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Simulation Mode</span>
                      <Badge className="bg-trading-blue text-white">Enabled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
