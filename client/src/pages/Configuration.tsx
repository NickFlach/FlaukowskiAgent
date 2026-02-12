import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Bot, Shield, Activity, Database } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatTimeAgo } from "@/lib/utils";

const agentConfigSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  targetAddress: z.string().min(42, "Valid Ethereum address required"),
  simulationMode: z.boolean(),
});

export default function Configuration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agentStatus = {} } = useQuery<any>({
    queryKey: ["/api/agent/status"],
    refetchInterval: 10000,
  });

  const { data: riskParameters = {} } = useQuery<any>({
    queryKey: ["/api/risk-parameters"],
    refetchInterval: 30000,
  });

  const { data: activities = [] } = useQuery<any[]>({
    queryKey: ["/api/activities", { limit: 10 }],
    queryFn: () => fetch("/api/activities?limit=10").then(res => res.json()),
    refetchInterval: 30000,
  });

  const updateAgentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/agent/1", data),
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "Agent configuration has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/status"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleSimulationMutation = useMutation({
    mutationFn: (enabled: boolean) => apiRequest("POST", "/api/agent/simulation-mode", { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/status"] });
    },
  });

  const startAgentMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/agent/start"),
    onSuccess: () => {
      toast({
        title: "Agent Started",
        description: "Trading agent is now running.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/status"] });
    },
  });

  const stopAgentMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/agent/stop"),
    onSuccess: () => {
      toast({
        title: "Agent Stopped",
        description: "Trading agent has been halted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/status"] });
    },
  });

  const form = useForm({
    resolver: zodResolver(agentConfigSchema),
    defaultValues: {
      name: "Flaukowski",
      targetAddress: import.meta.env.VITE_TARGET_WALLET_ADDRESS || "",
      simulationMode: true,
    },
  });

  // Update form when agent data is loaded
  useEffect(() => {
    if (agentStatus?.agent) {
      form.reset({
        name: agentStatus.agent.name || "Flaukowski",
        targetAddress: agentStatus.agent.targetAddress || import.meta.env.VITE_TARGET_WALLET_ADDRESS || "",
        simulationMode: agentStatus.agent.simulationMode ?? true,
      });
    }
  }, [agentStatus, form]);

  const onSubmit = (data: z.infer<typeof agentConfigSchema>) => {
    updateAgentMutation.mutate(data);
  };

  const handleSimulationToggle = (enabled: boolean) => {
    form.setValue("simulationMode", enabled);
    toggleSimulationMutation.mutate(enabled);
  };

  const isAgentRunning = agentStatus?.isRunning;

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <header className="bg-navy-800 border-b border-navy-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-light">Agent Configuration</h1>
            <p className="text-text-muted">Configure and manage your autonomous trading agent</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={isAgentRunning ? "bg-success-green" : "bg-alert-red"}>
              {isAgentRunning ? "Running" : "Stopped"}
            </Badge>
            {isAgentRunning ? (
              <Button
                variant="destructive"
                onClick={() => stopAgentMutation.mutate()}
                disabled={stopAgentMutation.isPending}
                className="bg-alert-red hover:bg-red-600"
              >
                Stop Agent
              </Button>
            ) : (
              <Button
                onClick={() => startAgentMutation.mutate()}
                disabled={startAgentMutation.isPending}
                className="bg-success-green hover:bg-green-600"
              >
                Start Agent
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-navy-800 border border-navy-600">
            <TabsTrigger value="general" className="data-[state=active]:bg-trading-blue">General</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-trading-blue">Security</TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-trading-blue">Monitoring</TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-trading-blue">System</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Agent Configuration */}
              <div className="lg:col-span-2">
                <Card className="bg-navy-800 border-navy-600">
                  <CardHeader>
                    <CardTitle className="text-text-light flex items-center">
                      <Bot className="w-5 h-5 mr-2" />
                      Agent Configuration
                    </CardTitle>
                    <CardDescription className="text-text-muted">
                      Basic settings for your autonomous trading agent
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-text-light">Agent Name</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-navy-700 border-navy-600 text-text-light" />
                              </FormControl>
                              <FormDescription className="text-text-muted">
                                A friendly name for your trading agent
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="targetAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-text-light">Target Ethereum Address</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="0x..." 
                                  className="bg-navy-700 border-navy-600 text-text-light font-mono text-sm" 
                                />
                              </FormControl>
                              <FormDescription className="text-text-muted">
                                The Ethereum address where your agent will accumulate ETH
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Separator className="bg-navy-600" />

                        <FormField
                          control={form.control}
                          name="simulationMode"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-navy-600 p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base text-text-light">Simulation Mode</FormLabel>
                                <FormDescription className="text-text-muted">
                                  Run the agent in simulation mode without executing real trades
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={handleSimulationToggle}
                                  disabled={toggleSimulationMutation.isPending}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          disabled={updateAgentMutation.isPending}
                          className="w-full bg-trading-blue hover:bg-blue-600"
                        >
                          {updateAgentMutation.isPending ? "Updating..." : "Save Configuration"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              {/* Agent Status */}
              <div className="space-y-6">
                <Card className="bg-navy-800 border-navy-600">
                  <CardHeader>
                    <CardTitle className="text-text-light flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Agent Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Status</span>
                        <Badge className={isAgentRunning ? "bg-success-green" : "bg-alert-red"}>
                          {isAgentRunning ? "Running" : "Stopped"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Mode</span>
                        <Badge className={form.watch("simulationMode") ? "bg-trading-blue" : "bg-warning-orange"}>
                          {form.watch("simulationMode") ? "Simulation" : "Live"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Active Strategies</span>
                        <span className="text-text-light">{agentStatus?.activeStrategies || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Risk Level</span>
                        <Badge className="bg-success-green">
                          {agentStatus?.riskScore?.level || "Low"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Last Activity</span>
                        <span className="text-text-light text-sm">
                          {agentStatus?.agent?.lastActivity 
                            ? formatTimeAgo(agentStatus.agent.lastActivity) 
                            : "Never"
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-navy-800 border-navy-600">
                  <CardHeader>
                    <CardTitle className="text-text-light">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full border-navy-600 text-text-light hover:bg-navy-700"
                      onClick={() => window.location.href = "/strategies"}
                    >
                      Manage Strategies
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-navy-600 text-text-light hover:bg-navy-700"
                      onClick={() => window.location.href = "/risk"}
                    >
                      Configure Risk
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-navy-600 text-text-light hover:bg-navy-700"
                      onClick={() => window.location.href = "/activity"}
                    >
                      View Activity Log
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="bg-navy-800 border-navy-600">
              <CardHeader>
                <CardTitle className="text-text-light flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </CardTitle>
                <CardDescription className="text-text-muted">
                  Security and safety configurations for your agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-text-light">Risk Controls</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-navy-700 rounded-lg">
                        <span className="text-text-light">Circuit Breaker</span>
                        <Badge className={riskParameters?.circuitBreakerEnabled ? "bg-success-green" : "bg-alert-red"}>
                          {riskParameters?.circuitBreakerEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-navy-700 rounded-lg">
                        <span className="text-text-light">Volatility Filter</span>
                        <Badge className={riskParameters?.volatilityFilterEnabled ? "bg-success-green" : "bg-alert-red"}>
                          {riskParameters?.volatilityFilterEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-navy-700 rounded-lg">
                        <span className="text-text-light">Smart Rebalancing</span>
                        <Badge className={riskParameters?.smartRebalancingEnabled ? "bg-success-green" : "bg-alert-red"}>
                          {riskParameters?.smartRebalancingEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-text-light">Limits</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-navy-700 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-text-muted">Max Daily Loss</span>
                          <span className="text-text-light">{riskParameters?.maxDailyLoss || "5.00"}%</span>
                        </div>
                      </div>
                      <div className="p-3 bg-navy-700 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-text-muted">Max Position Size</span>
                          <span className="text-text-light">{riskParameters?.maxPositionSize || "10.00"}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-navy-600" />

                <div className="text-center">
                  <Button 
                    onClick={() => window.location.href = "/risk"}
                    className="bg-trading-blue hover:bg-blue-600"
                  >
                    Configure Risk Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card className="bg-navy-800 border-navy-600">
              <CardHeader>
                <CardTitle className="text-text-light">Recent Activity</CardTitle>
                <CardDescription className="text-text-muted">
                  Latest actions performed by your agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-text-muted" />
                    <p>No recent activities</p>
                    <p className="text-sm">Activities will appear here once your agent starts working</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((activity: any) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-navy-700 rounded-lg">
                        <div>
                          <p className="text-sm text-text-light">{activity.action}</p>
                          <p className="text-xs text-text-muted">
                            {activity.timestamp ? formatTimeAgo(activity.timestamp) : "Unknown time"}
                          </p>
                        </div>
                        <Badge className={
                          activity.result === "success" ? "bg-success-green" :
                          activity.result === "failed" ? "bg-alert-red" :
                          "bg-navy-600"
                        }>
                          {activity.result?.toUpperCase() || "PENDING"}
                        </Badge>
                      </div>
                    ))}
                    <div className="text-center pt-3">
                      <Button 
                        variant="outline" 
                        onClick={() => window.location.href = "/activity"}
                        className="border-navy-600 text-text-light hover:bg-navy-700"
                      >
                        View All Activities
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="bg-navy-800 border-navy-600">
              <CardHeader>
                <CardTitle className="text-text-light flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  System Information
                </CardTitle>
                <CardDescription className="text-text-muted">
                  System status and diagnostic information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-text-light">Agent Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Agent ID</span>
                        <span className="text-text-light font-mono">{agentStatus?.agent?.id || "1"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Created</span>
                        <span className="text-text-light">
                          {agentStatus?.agent?.createdAt 
                            ? new Date(agentStatus.agent.createdAt).toLocaleDateString()
                            : "Unknown"
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Version</span>
                        <span className="text-text-light">1.0.0</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-text-light">Performance</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Uptime</span>
                        <span className="text-text-light">
                          {isAgentRunning ? "Running" : "Stopped"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Memory Usage</span>
                        <span className="text-text-light">Normal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">API Status</span>
                        <Badge className="bg-success-green">Connected</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-navy-600 my-6" />

                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-text-light">Danger Zone</h4>
                  <div className="p-4 border border-alert-red/30 rounded-lg bg-alert-red/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-alert-red font-medium">Reset Agent Configuration</h5>
                        <p className="text-sm text-text-muted">
                          This will reset all agent settings to default values
                        </p>
                      </div>
                      <Button 
                        variant="destructive" 
                        className="bg-alert-red hover:bg-red-600"
                        onClick={() => {
                          if (confirm("Are you sure you want to reset all configuration? This cannot be undone.")) {
                            form.reset({
                              name: "Flaukowski",
                              targetAddress: import.meta.env.VITE_TARGET_WALLET_ADDRESS || "",
                              simulationMode: true,
                            });
                          }
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
