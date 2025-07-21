import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StrategyCard } from "@/components/StrategyCard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Strategy } from "@shared/schema";

const dcaStrategySchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  intervalHours: z.number().min(1, "Interval must be at least 1 hour"),
});

const momentumStrategySchema = z.object({
  rsiThreshold: z.number().min(1).max(100, "RSI threshold must be between 1-100"),
  useMACD: z.boolean(),
  positionSize: z.string().min(1, "Position size is required"),
});

const arbitrageStrategySchema = z.object({
  minSpread: z.number().min(0.1, "Minimum spread must be at least 0.1%"),
  maxPositionSize: z.string().min(1, "Max position size is required"),
});

export default function Strategies() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedStrategyType, setSelectedStrategyType] = useState<string>("dca");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: strategies = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/strategies"],
    refetchInterval: 5000,
  });

  const createStrategyMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/strategies", data),
    onSuccess: () => {
      toast({
        title: "Strategy Created",
        description: "Your trading strategy has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create strategy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStrategyMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Strategy> }) =>
      apiRequest("PUT", `/api/strategies/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
    },
  });

  const deleteStrategyMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/strategies/${id}`),
    onSuccess: () => {
      toast({
        title: "Strategy Deleted",
        description: "Strategy has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
    },
  });

  const handleToggleStrategy = (strategy: Strategy) => {
    const newStatus = strategy.status === "active" ? "inactive" : "active";
    updateStrategyMutation.mutate({ id: strategy.id, updates: { status: newStatus } });
  };

  const handleDeleteStrategy = (strategy: Strategy) => {
    if (confirm(`Are you sure you want to delete "${strategy.name}"?`)) {
      deleteStrategyMutation.mutate(strategy.id);
    }
  };

  const dcaForm = useForm({
    resolver: zodResolver(dcaStrategySchema),
    defaultValues: {
      amount: "0.1",
      intervalHours: 24,
    },
  });

  const momentumForm = useForm({
    resolver: zodResolver(momentumStrategySchema),
    defaultValues: {
      rsiThreshold: 70,
      useMACD: true,
      positionSize: "0.5",
    },
  });

  const arbitrageForm = useForm({
    resolver: zodResolver(arbitrageStrategySchema),
    defaultValues: {
      minSpread: 0.5,
      maxPositionSize: "1.0",
    },
  });

  const onSubmitDCA = (data: z.infer<typeof dcaStrategySchema>) => {
    createStrategyMutation.mutate({
      name: "Dollar Cost Averaging",
      type: "dca",
      status: "active",
      config: {
        amount: data.amount,
        intervalHours: data.intervalHours,
        nextExecution: Date.now() + (data.intervalHours * 60 * 60 * 1000),
      },
      performance: {
        totalTrades: 0,
        totalInvested: "0",
        successRate: 100,
      },
    });
  };

  const onSubmitMomentum = (data: z.infer<typeof momentumStrategySchema>) => {
    createStrategyMutation.mutate({
      name: "Momentum Trading",
      type: "momentum",
      status: "active",
      config: {
        rsiThreshold: data.rsiThreshold,
        useMACD: data.useMACD,
        positionSize: data.positionSize,
      },
      performance: {
        totalTrades: 0,
        successRate: 73.2,
        avgGain: 2.8,
      },
    });
  };

  const onSubmitArbitrage = (data: z.infer<typeof arbitrageStrategySchema>) => {
    createStrategyMutation.mutate({
      name: "Arbitrage Scanner",
      type: "arbitrage",
      status: "monitoring",
      config: {
        minSpread: data.minSpread,
        exchanges: ["binance", "coinbase", "kraken"],
        maxPositionSize: data.maxPositionSize,
      },
      performance: {
        totalTrades: 0,
        opportunitiesFound: 0,
        avgSpread: 0.3,
      },
    });
  };

  const strategyTemplates = [
    {
      id: "dca",
      name: "Dollar Cost Averaging",
      description: "Automatically purchase ETH at regular intervals regardless of price",
      icon: "fas fa-calendar-alt",
      color: "bg-success-green",
      recommended: true,
    },
    {
      id: "momentum",
      name: "Momentum Trading",
      description: "Buy during uptrends and sell during downtrends using technical indicators",
      icon: "fas fa-trending-up",
      color: "bg-trading-blue",
      recommended: false,
    },
    {
      id: "arbitrage",
      name: "Arbitrage Scanner",
      description: "Find price differences across exchanges and execute profitable trades",
      icon: "fas fa-exchange-alt",
      color: "bg-warning-orange",
      recommended: false,
    },
  ];

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <header className="bg-navy-800 border-b border-navy-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-light">Trading Strategies</h1>
            <p className="text-text-muted">Configure and manage your autonomous trading strategies</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-trading-blue hover:bg-blue-600">
                <i className="fas fa-plus mr-2"></i>
                Create Strategy
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-navy-800 border-navy-600">
              <DialogHeader>
                <DialogTitle className="text-text-light">Create New Strategy</DialogTitle>
                <DialogDescription className="text-text-muted">
                  Choose a strategy type and configure its parameters
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={selectedStrategyType} onValueChange={setSelectedStrategyType}>
                <TabsList className="grid w-full grid-cols-3 bg-navy-700">
                  <TabsTrigger value="dca" className="data-[state=active]:bg-trading-blue">DCA</TabsTrigger>
                  <TabsTrigger value="momentum" className="data-[state=active]:bg-trading-blue">Momentum</TabsTrigger>
                  <TabsTrigger value="arbitrage" className="data-[state=active]:bg-trading-blue">Arbitrage</TabsTrigger>
                </TabsList>

                <TabsContent value="dca" className="space-y-4">
                  <Form {...dcaForm}>
                    <form onSubmit={dcaForm.handleSubmit(onSubmitDCA)} className="space-y-4">
                      <FormField
                        control={dcaForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-text-light">Amount per Purchase (ETH)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="0.1" className="bg-navy-700 border-navy-600 text-text-light" />
                            </FormControl>
                            <FormDescription className="text-text-muted">
                              Amount of ETH to purchase each interval
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dcaForm.control}
                        name="intervalHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-text-light">Interval (Hours)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                onChange={e => field.onChange(parseInt(e.target.value))}
                                className="bg-navy-700 border-navy-600 text-text-light" 
                              />
                            </FormControl>
                            <FormDescription className="text-text-muted">
                              How often to make purchases (in hours)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={createStrategyMutation.isPending} className="w-full bg-success-green hover:bg-green-600">
                        {createStrategyMutation.isPending ? "Creating..." : "Create DCA Strategy"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="momentum" className="space-y-4">
                  <Form {...momentumForm}>
                    <form onSubmit={momentumForm.handleSubmit(onSubmitMomentum)} className="space-y-4">
                      <FormField
                        control={momentumForm.control}
                        name="rsiThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-text-light">RSI Threshold</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                onChange={e => field.onChange(parseInt(e.target.value))}
                                className="bg-navy-700 border-navy-600 text-text-light" 
                              />
                            </FormControl>
                            <FormDescription className="text-text-muted">
                              RSI level to trigger buy signals (typically 30-70)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={momentumForm.control}
                        name="useMACD"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-navy-600 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base text-text-light">Use MACD Indicator</FormLabel>
                              <FormDescription className="text-text-muted">
                                Include MACD signals in trading decisions
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={momentumForm.control}
                        name="positionSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-text-light">Position Size (ETH)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="0.5" className="bg-navy-700 border-navy-600 text-text-light" />
                            </FormControl>
                            <FormDescription className="text-text-muted">
                              Amount to trade per momentum signal
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={createStrategyMutation.isPending} className="w-full bg-trading-blue hover:bg-blue-600">
                        {createStrategyMutation.isPending ? "Creating..." : "Create Momentum Strategy"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="arbitrage" className="space-y-4">
                  <Form {...arbitrageForm}>
                    <form onSubmit={arbitrageForm.handleSubmit(onSubmitArbitrage)} className="space-y-4">
                      <FormField
                        control={arbitrageForm.control}
                        name="minSpread"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-text-light">Minimum Spread (%)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.1"
                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                className="bg-navy-700 border-navy-600 text-text-light" 
                              />
                            </FormControl>
                            <FormDescription className="text-text-muted">
                              Minimum price difference to execute arbitrage
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={arbitrageForm.control}
                        name="maxPositionSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-text-light">Max Position Size (ETH)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="1.0" className="bg-navy-700 border-navy-600 text-text-light" />
                            </FormControl>
                            <FormDescription className="text-text-muted">
                              Maximum amount to trade per arbitrage opportunity
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={createStrategyMutation.isPending} className="w-full bg-warning-orange hover:bg-orange-600">
                        {createStrategyMutation.isPending ? "Creating..." : "Create Arbitrage Strategy"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Strategy Templates Section */}
        <div>
          <h2 className="text-xl font-semibold text-text-light mb-4">Strategy Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {strategyTemplates.map((template) => (
              <Card key={template.id} className="bg-navy-800 border-navy-600 hover:border-trading-blue transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedStrategyType(template.id);
                      setIsCreateDialogOpen(true);
                    }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-lg ${template.color} flex items-center justify-center`}>
                      <i className={`${template.icon} text-white text-lg`}></i>
                    </div>
                    {template.recommended && (
                      <span className="text-xs px-2 py-1 bg-success-green text-white rounded">Recommended</span>
                    )}
                  </div>
                  <CardTitle className="text-text-light">{template.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-text-muted">
                    {template.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Active Strategies Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-light">Active Strategies</h2>
            <div className="text-sm text-text-muted">
              {strategies.filter((s: Strategy) => s.status === "active").length} active, {strategies.length} total
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-navy-800 rounded-xl p-6 border border-navy-600 animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-navy-600 rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-navy-600 rounded w-24"></div>
                      <div className="h-3 bg-navy-600 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-navy-600 rounded w-full"></div>
                    <div className="h-3 bg-navy-600 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : strategies.length === 0 ? (
            <Card className="bg-navy-800 border-navy-600">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <i className="fas fa-chart-line text-4xl text-trading-blue mb-4"></i>
                  <h3 className="text-lg font-medium text-text-light mb-2">No Strategies Configured</h3>
                  <p className="text-text-muted mb-6">
                    Create your first trading strategy to start growing your ETH portfolio
                  </p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-trading-blue hover:bg-blue-600"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create Your First Strategy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strategies.map((strategy: Strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  onToggle={handleToggleStrategy}
                  onDelete={handleDeleteStrategy}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
