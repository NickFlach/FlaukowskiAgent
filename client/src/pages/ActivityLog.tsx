import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Filter, Download, Search } from "lucide-react";
import { formatTimeAgo, formatCurrency, formatNumber, cn } from "@/lib/utils";
import type { Activity } from "@shared/schema";

export default function ActivityLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterResult, setFilterResult] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities", { limit: 100 }],
    queryFn: () => fetch("/api/activities?limit=100").then(res => res.json()),
    refetchInterval: 10000,
  });

  const { data: strategies = [] } = useQuery<any[]>({
    queryKey: ["/api/strategies"],
    refetchInterval: 30000,
  });

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    let filtered = activities.filter((activity: Activity) => {
      const matchesSearch = !searchTerm || 
        activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.details && JSON.stringify(activity.details).toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === "all" || activity.type === filterType;
      const matchesResult = filterResult === "all" || activity.result === filterResult;
      
      return matchesSearch && matchesType && matchesResult;
    });

    // Sort activities
    filtered.sort((a: Activity, b: Activity) => {
      const aTime = new Date(a.timestamp || 0).getTime();
      const bTime = new Date(b.timestamp || 0).getTime();
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });

    return filtered;
  }, [activities, searchTerm, filterType, filterResult, sortOrder]);

  const getActivityIcon = (type: string, action: string) => {
    if (action.includes("Purchase") || action.includes("Buy")) {
      return { icon: "fas fa-plus", color: "bg-success-green" };
    }
    if (action.includes("Signal") || action.includes("Momentum")) {
      return { icon: "fas fa-chart-line", color: "bg-trading-blue" };
    }
    if (action.includes("Risk") || action.includes("Circuit")) {
      return { icon: "fas fa-shield-alt", color: "bg-warning-orange" };
    }
    if (action.includes("Arbitrage")) {
      return { icon: "fas fa-exchange-alt", color: "bg-success-green" };
    }
    if (type === "error") {
      return { icon: "fas fa-exclamation-triangle", color: "bg-alert-red" };
    }
    return { icon: "fas fa-info", color: "bg-navy-600" };
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return null;
    
    const colors = {
      success: "bg-success-green text-white",
      failed: "bg-alert-red text-white",
      pending: "bg-warning-orange text-white",
      warning: "bg-warning-orange text-white",
    };
    
    return (
      <Badge className={colors[result as keyof typeof colors] || "bg-navy-600 text-white"}>
        {result.toUpperCase()}
      </Badge>
    );
  };

  const getStrategyName = (strategyId: number | null) => {
    if (!strategyId) return "Manual";
    const strategy = strategies.find((s: any) => s.id === strategyId);
    return strategy?.name || `Strategy ${strategyId}`;
  };

  // Activity type statistics
  const activityStats = useMemo(() => {
    const stats = {
      total: activities.length,
      trade: 0,
      signal: 0,
      risk_check: 0,
      error: 0,
      success: 0,
      failed: 0,
    };

    activities.forEach((activity: Activity) => {
      if (activity.type in stats) {
        stats[activity.type as keyof typeof stats]++;
      }
      if (activity.result && activity.result in stats) {
        stats[activity.result as keyof typeof stats]++;
      }
    });

    return stats;
  }, [activities]);

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <header className="bg-navy-800 border-b border-navy-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-light">Activity Log</h1>
            <p className="text-text-muted">Complete history of your agent's actions and decisions</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="border-navy-600 text-text-light hover:bg-navy-700">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" className="border-navy-600 text-text-light hover:bg-navy-700">
              <Calendar className="w-4 h-4 mr-2" />
              Date Range
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Activity Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="bg-navy-800 border-navy-600">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-text-light">{activityStats.total}</p>
              <p className="text-xs text-text-muted">Total Events</p>
            </CardContent>
          </Card>
          <Card className="bg-navy-800 border-navy-600">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success-green">{activityStats.trade}</p>
              <p className="text-xs text-text-muted">Trades</p>
            </CardContent>
          </Card>
          <Card className="bg-navy-800 border-navy-600">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-trading-blue">{activityStats.signal}</p>
              <p className="text-xs text-text-muted">Signals</p>
            </CardContent>
          </Card>
          <Card className="bg-navy-800 border-navy-600">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-warning-orange">{activityStats.risk_check}</p>
              <p className="text-xs text-text-muted">Risk Checks</p>
            </CardContent>
          </Card>
          <Card className="bg-navy-800 border-navy-600">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-alert-red">{activityStats.error}</p>
              <p className="text-xs text-text-muted">Errors</p>
            </CardContent>
          </Card>
          <Card className="bg-navy-800 border-navy-600">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success-green">{activityStats.success}</p>
              <p className="text-xs text-text-muted">Success</p>
            </CardContent>
          </Card>
          <Card className="bg-navy-800 border-navy-600">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-alert-red">{activityStats.failed}</p>
              <p className="text-xs text-text-muted">Failed</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-navy-800 border-navy-600">
          <CardHeader>
            <CardTitle className="text-text-light flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-navy-700 border-navy-600 text-text-light"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-navy-700 border-navy-600 text-text-light">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-navy-700 border-navy-600">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="trade">Trades</SelectItem>
                  <SelectItem value="signal">Signals</SelectItem>
                  <SelectItem value="risk_check">Risk Checks</SelectItem>
                  <SelectItem value="error">Errors</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterResult} onValueChange={setFilterResult}>
                <SelectTrigger className="bg-navy-700 border-navy-600 text-text-light">
                  <SelectValue placeholder="Filter by result" />
                </SelectTrigger>
                <SelectContent className="bg-navy-700 border-navy-600">
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="bg-navy-700 border-navy-600 text-text-light">
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent className="bg-navy-700 border-navy-600">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity List */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="bg-navy-800 border border-navy-600">
            <TabsTrigger value="list" className="data-[state=active]:bg-trading-blue">List View</TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-trading-blue">Timeline View</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <Card className="bg-navy-800 border-navy-600">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-text-light">Activity History</CardTitle>
                  <p className="text-sm text-text-muted">
                    Showing {filteredActivities.length} of {activities.length} activities
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-start space-x-3 p-4 bg-navy-700 rounded-lg">
                          <div className="w-10 h-10 bg-navy-600 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-navy-600 rounded w-3/4"></div>
                            <div className="h-3 bg-navy-600 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredActivities.length === 0 ? (
                  <div className="text-center py-12 text-text-muted">
                    <i className="fas fa-search text-4xl mb-4"></i>
                    <h3 className="text-lg font-medium text-text-light mb-2">No Activities Found</h3>
                    <p className="text-text-muted">
                      {searchTerm || filterType !== "all" || filterResult !== "all" 
                        ? "Try adjusting your search or filters"
                        : "Activities will appear here as your agent starts working"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredActivities.map((activity: Activity) => {
                      const { icon, color } = getActivityIcon(activity.type, activity.action);
                      
                      return (
                        <div key={activity.id} className="flex items-start space-x-4 p-4 bg-navy-700 rounded-lg hover:bg-navy-600 transition-colors">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", color)}>
                            <i className={cn(icon, "text-white text-sm")}></i>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-text-light">{activity.action}</h4>
                                <div className="flex items-center space-x-3 mt-1">
                                  <Badge variant="outline" className="text-xs border-navy-500 text-text-muted">
                                    {activity.type.toUpperCase()}
                                  </Badge>
                                  <span className="text-xs text-text-muted">
                                    {getStrategyName(activity.strategyId)}
                                  </span>
                                  <span className="text-xs text-text-muted">
                                    {activity.timestamp ? formatTimeAgo(activity.timestamp) : "Unknown time"}
                                  </span>
                                </div>
                                
                                {activity.details && (
                                  <div className="mt-2 text-xs text-text-muted">
                                    <div className="bg-navy-600 rounded p-2 font-mono">
                                      {typeof activity.details === 'object' && activity.details !== null
                                        ? Object.entries(activity.details).map(([key, value]) => (
                                            <div key={key} className="flex justify-between">
                                              <span className="text-text-muted">{key}:</span>
                                              <span className="text-text-light">{String(value)}</span>
                                            </div>
                                          ))
                                        : String(activity.details)
                                      }
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col items-end space-y-2">
                                {getResultBadge(activity.result)}
                                {activity.amount && (
                                  <div className="text-right">
                                    <p className="text-sm font-mono text-text-light">
                                      {formatNumber(parseFloat(activity.amount), 4)} ETH
                                    </p>
                                    {activity.price && (
                                      <p className="text-xs text-text-muted">
                                        @ {formatCurrency(parseFloat(activity.price))}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card className="bg-navy-800 border-navy-600">
              <CardHeader>
                <CardTitle className="text-text-light">Timeline View</CardTitle>
                <CardDescription className="text-text-muted">
                  Chronological view of agent activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-12 text-text-muted">
                    <i className="fas fa-clock text-4xl mb-4"></i>
                    <h3 className="text-lg font-medium text-text-light mb-2">No Timeline Data</h3>
                    <p>Activities will appear in timeline format once available</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-navy-600"></div>
                    <div className="space-y-6">
                      {filteredActivities.map((activity: Activity, index) => {
                        const { icon, color } = getActivityIcon(activity.type, activity.action);
                        const isLast = index === filteredActivities.length - 1;
                        
                        return (
                          <div key={activity.id} className="relative flex items-start space-x-4">
                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center z-10", color)}>
                              <i className={cn(icon, "text-white")}></i>
                            </div>
                            
                            <div className="flex-1 bg-navy-700 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium text-text-light">{activity.action}</h4>
                                  <p className="text-sm text-text-muted mt-1">
                                    {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : "Unknown time"}
                                  </p>
                                </div>
                                {getResultBadge(activity.result)}
                              </div>
                              
                              {activity.details && (
                                <div className="mt-3 p-2 bg-navy-600 rounded text-xs font-mono text-text-muted">
                                  {typeof activity.details === 'object' && activity.details !== null
                                    ? JSON.stringify(activity.details, null, 2)
                                    : String(activity.details)
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
