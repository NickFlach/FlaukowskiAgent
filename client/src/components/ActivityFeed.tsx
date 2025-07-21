import { useQuery } from "@tanstack/react-query";
import { formatTimeAgo, cn } from "@/lib/utils";
import type { Activity } from "@shared/schema";

export function ActivityFeed() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["/api/activities"],
    refetchInterval: 5000,
  });

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
    return { icon: "fas fa-info", color: "bg-navy-600" };
  };

  if (isLoading) {
    return (
      <div className="bg-navy-800 rounded-xl p-6 border border-navy-600">
        <h3 className="text-lg font-semibold text-text-light mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3 p-3 bg-navy-700 rounded-lg">
                <div className="w-8 h-8 bg-navy-600 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-navy-600 rounded w-3/4"></div>
                  <div className="h-3 bg-navy-600 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-navy-800 rounded-xl p-6 border border-navy-600">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-light">Recent Activity</h3>
        <button className="text-text-muted hover:text-text-light">
          <i className="fas fa-external-link-alt text-sm"></i>
        </button>
      </div>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <i className="fas fa-clock text-2xl mb-2"></i>
            <p>No recent activities</p>
          </div>
        ) : (
          activities.map((activity: Activity) => {
            const { icon, color } = getActivityIcon(activity.type, activity.action);
            
            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-navy-700 rounded-lg">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", color)}>
                  <i className={cn(icon, "text-white text-xs")}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-light">{activity.action}</p>
                  {activity.details && (
                    <p className="text-xs text-text-muted">
                      {typeof activity.details === 'object' && activity.details !== null
                        ? Object.entries(activity.details).map(([key, value]) => 
                            `${key}: ${value}`
                          ).join(", ")
                        : String(activity.details)
                      }
                    </p>
                  )}
                  <p className="text-xs text-text-muted">
                    {activity.timestamp ? formatTimeAgo(activity.timestamp) : "Unknown time"}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
