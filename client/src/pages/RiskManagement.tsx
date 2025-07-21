import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Shield, Activity, Settings } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatNumber, formatPercentage } from "@/lib/utils";

const riskParametersSchema = z.object({
  maxDailyLoss: z.string().min(1, "Max daily loss is required"),
  maxPositionSize: z.string().min(1, "Max position size is required"),
  circuitBreakerEnabled: z.boolean(),
  volatilityFilterEnabled: z.boolean(),
  smartRebalancingEnabled: z.boolean(),
});

export default function RiskManagement() {
  const [riskScore, setRiskScore] = useState(2.3);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: riskParameters, isLoading } = useQuery({
    queryKey: ["/api/risk-parameters"],
    refetchInterval: 10000,
  });

  const { data: agentStatus } = useQuery({
    queryKey: ["/api/agent/status"],
    refetchInterval: 10000,
  });

  const { data: portfolio } = useQuery({
    queryKey: ["/api/portfolio"],
    refetchInterval: 10000,
  });

  const updateRiskParametersMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/risk-parameters", data),
    onSuccess: () => {
      toast({
        title: "Risk Parameters Updated",
        description: "Your risk management settings have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/risk-parameters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/status"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update risk parameters. Please try again.",
        variant: "destructive",
      });
    },
  });

  const emergencyStopMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/agent/stop"),
    onSuccess: () => {
      toast({
        title: "Emergency Stop Activated",
        description: "All trading activities have been halted immediately.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/status"] });
    },
  });

  const form = useForm({
    resolver: zodResolver(riskParametersSchema),
    defaultValues: {
      maxDailyLoss: "5.00",
      maxPositionSize: "10.00",
      circuitBreakerEnabled: true,
      volatilityFilterEnabled: true,
      smartRebalancingEnabled: true,
    },
  });

  // Update form when risk parameters are loaded
  useEffect(() => {
    if (riskParameters) {
      form.reset({
        maxDailyLoss: riskParameters.maxDailyLoss || "5.00",
        maxPositionSize: riskParameters.maxPositionSize || "10.00",
        circuitBreakerEnabled: riskParameters.circuitBreakerEnabled ?? true,
        volatilityFilterEnabled: riskParameters.volatilityFilterEnabled ?? true,
        smartRebalancingEnabled: riskParameters.smartRebalancingEnabled ?? true,
      });
    }
  }, [riskParameters, form]);

  // Update risk score based on agent status
  useEffect(() => {
    if (agentStatus?.riskScore?.score) {
      setRiskScore(agentStatus.riskScore.score);
    }
  }, [agentStatus]);

  const onSubmit = (data: z.infer<typeof riskParametersSchema>) => {
    updateRiskParametersMutation.mutate(data);
  };

  const getRiskLevel = (score: number) => {
    if (score <= 3) return { level: "Low", color: "text-success-green", bgColor: "bg-success-green" };
    if (score <= 6) return { level: "Medium", color: "text-warning-orange", bgColor: "bg-warning-orange" };
    return { level: "High", color: "text-alert-red", bgColor: "bg-alert-red" };
  };

  const riskLevel = getRiskLevel(riskScore);
  const portfolioValue = portfolio?.totalValue ? parseFloat(portfolio.totalValue) : 12.4578;
  const performance24h = portfolio?.performance24h ? parseFloat(portfolio.performance24h) : 5.68;
  const maxDailyLossValue = parseFloat(form.watch("maxDailyLoss") || "5");
  const riskUtilization = Math.abs(performance24h) / maxDailyLossValue * 100;

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <header className="bg-navy-800 border-b border-navy-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-light">Risk Management</h1>
            <p className="text-text-muted">Configure safety controls and monitor risk exposure</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => emergencyStopMutation.mutate()}
            disabled={emergencyStopMutation.isPending}
            className="bg-alert-red hover:bg-red-600"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Emergency Stop
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Risk Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Current Risk Score"
            value={`${riskScore}/10`}
            subtitle={`${riskLevel.level} risk level`}
            icon="fas fa-shield-alt"
            iconColor={riskLevel.color}
            change={riskLevel.level}
            changeType={riskScore <= 3 ? "positive" : riskScore <= 6 ? "neutral" : "negative"}
          />

          <MetricCard
            title="Risk Utilization"
            value={`${formatNumber(riskUtilization, 1)}%`}
            subtitle={`of ${maxDailyLossValue}% daily limit`}
            icon="fas fa-gauge"
            iconColor="text-trading-blue"
            change={riskUtilization < 50 ? "Safe" : riskUtilization < 80 ? "Moderate" : "High"}
            changeType={riskUtilization < 50 ? "positive" : riskUtilization < 80 ? "neutral" : "negative"}
          />

          <MetricCard
            title="Portfolio Volatility"
            value="12.3%"
            subtitle="30-day volatility"
            icon="fas fa-chart-line"
            iconColor="text-warning-orange"
            change="Normal"
            changeType="neutral"
          />

          <MetricCard
            title="Safety Controls"
            value={`${(riskParameters?.circuitBreakerEnabled ? 1 : 0) + 
                      (riskParameters?.volatilityFilterEnabled ? 1 : 0) + 
                      (riskParameters?.smartRebalancingEnabled ? 1 : 0)}/3`}
            subtitle="Active protections"
            icon="fas fa-shield"
            iconColor="text-success-green"
            change="All Active"
            changeType="positive"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Configuration */}
          <div className="lg:col-span-2">
            <Card className="bg-navy-800 border-navy-600">
              <CardHeader>
                <CardTitle className="text-text-light flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Risk Parameters
                </CardTitle>
                <CardDescription className="text-text-muted">
                  Configure your risk tolerance and safety controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-navy-600 rounded w-1/3 mb-2"></div>
                        <div className="h-10 bg-navy-600 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="maxDailyLoss"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-text-light">Maximum Daily Loss (%)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  step="0.1"
                                  className="bg-navy-700 border-navy-600 text-text-light" 
                                />
                              </FormControl>
                              <FormDescription className="text-text-muted">
                                Maximum percentage loss allowed per day
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxPositionSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-text-light">Maximum Position Size (%)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  step="0.1"
                                  className="bg-navy-700 border-navy-600 text-text-light" 
                                />
                              </FormControl>
                              <FormDescription className="text-text-muted">
                                Maximum percentage of portfolio per trade
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator className="bg-navy-600" />

                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-text-light">Safety Controls</h4>
                        
                        <FormField
                          control={form.control}
                          name="circuitBreakerEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-navy-600 p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base text-text-light">Circuit Breaker</FormLabel>
                                <FormDescription className="text-text-muted">
                                  Automatically halt trading when risk limits are exceeded
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="volatilityFilterEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-navy-600 p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base text-text-light">Volatility Filter</FormLabel>
                                <FormDescription className="text-text-muted">
                                  Reduce trading during high market volatility periods
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="smartRebalancingEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-navy-600 p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base text-text-light">Smart Rebalancing</FormLabel>
                                <FormDescription className="text-text-muted">
                                  Automatically rebalance portfolio to maintain target allocation
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={updateRiskParametersMutation.isPending}
                        className="w-full bg-trading-blue hover:bg-blue-600"
                      >
                        {updateRiskParametersMutation.isPending ? "Updating..." : "Update Risk Parameters"}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Risk Monitoring */}
          <div className="space-y-6">
            {/* Real-time Risk Monitor */}
            <Card className="bg-navy-800 border-navy-600">
              <CardHeader>
                <CardTitle className="text-text-light flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Live Risk Monitor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Risk Score</span>
                    <Badge className={`${riskLevel.bgColor} text-white`}>
                      {riskLevel.level}
                    </Badge>
                  </div>
                  <Progress value={(riskScore / 10) * 100} className="h-2" />
                  <p className="text-xs text-text-muted">{riskScore}/10 risk level</p>
                </div>

                <Separator className="bg-navy-600" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Daily P&L Usage</span>
                    <span className="text-text-light">{formatNumber(riskUtilization, 1)}%</span>
                  </div>
                  <Progress value={Math.min(riskUtilization, 100)} className="h-2" />
                  <p className="text-xs text-text-muted">
                    {formatPercentage(performance24h)} of {maxDailyLossValue}% limit
                  </p>
                </div>

                <Separator className="bg-navy-600" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Agent Status</span>
                    <Badge className={agentStatus?.isRunning ? "bg-success-green" : "bg-alert-red"}>
                      {agentStatus?.isRunning ? "Active" : "Stopped"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Active Strategies</span>
                    <span className="text-text-light">{agentStatus?.activeStrategies || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Alerts */}
            <Card className="bg-navy-800 border-navy-600">
              <CardHeader>
                <CardTitle className="text-text-light flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Risk Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskUtilization > 80 ? (
                    <div className="flex items-start space-x-3 p-3 bg-alert-red/10 border border-alert-red/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-alert-red mt-0.5" />
                      <div>
                        <p className="text-sm text-alert-red font-medium">High Risk Usage</p>
                        <p className="text-xs text-text-muted">
                          Daily loss approaching limit ({formatNumber(riskUtilization, 1)}%)
                        </p>
                      </div>
                    </div>
                  ) : riskUtilization > 50 ? (
                    <div className="flex items-start space-x-3 p-3 bg-warning-orange/10 border border-warning-orange/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-warning-orange mt-0.5" />
                      <div>
                        <p className="text-sm text-warning-orange font-medium">Moderate Risk</p>
                        <p className="text-xs text-text-muted">
                          Risk utilization at {formatNumber(riskUtilization, 1)}% of daily limit
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-3 p-3 bg-success-green/10 border border-success-green/20 rounded-lg">
                      <Shield className="w-4 h-4 text-success-green mt-0.5" />
                      <div>
                        <p className="text-sm text-success-green font-medium">Low Risk</p>
                        <p className="text-xs text-text-muted">
                          All risk parameters within safe limits
                        </p>
                      </div>
                    </div>
                  )}

                  {!agentStatus?.isRunning && (
                    <div className="flex items-start space-x-3 p-3 bg-alert-red/10 border border-alert-red/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-alert-red mt-0.5" />
                      <div>
                        <p className="text-sm text-alert-red font-medium">Agent Stopped</p>
                        <p className="text-xs text-text-muted">
                          Trading agent is currently inactive
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
