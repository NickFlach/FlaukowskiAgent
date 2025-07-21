import { cn, getStatusBadgeColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Strategy } from "@shared/schema";

interface StrategyCardProps {
  strategy: Strategy;
  onEdit?: (strategy: Strategy) => void;
  onToggle?: (strategy: Strategy) => void;
  onDelete?: (strategy: Strategy) => void;
}

export function StrategyCard({ strategy, onEdit, onToggle, onDelete }: StrategyCardProps) {
  const getStrategyIcon = (type: string) => {
    switch (type) {
      case "dca":
        return "fas fa-calendar-alt";
      case "momentum":
        return "fas fa-trending-up";
      case "arbitrage":
        return "fas fa-exchange-alt";
      default:
        return "fas fa-chart-line";
    }
  };

  const getStrategyColor = (type: string) => {
    switch (type) {
      case "dca":
        return "bg-success-green";
      case "momentum":
        return "bg-trading-blue";
      case "arbitrage":
        return "bg-warning-orange";
      default:
        return "bg-navy-600";
    }
  };

  const performance = strategy.performance as any;

  return (
    <div className="bg-navy-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", getStrategyColor(strategy.type))}>
            <i className={cn(getStrategyIcon(strategy.type), "text-white")}></i>
          </div>
          <div>
            <h4 className="font-medium text-text-light">{strategy.name}</h4>
            <p className="text-xs text-text-muted">
              {strategy.type === "dca" && "Scheduled purchases"}
              {strategy.type === "momentum" && "Technical indicators"}
              {strategy.type === "arbitrage" && "Cross-exchange monitoring"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={cn("text-xs px-2 py-1 rounded", getStatusBadgeColor(strategy.status))}>
            {strategy.status.toUpperCase()}
          </span>
          <div className="flex space-x-1">
            {onEdit && (
              <button
                onClick={() => onEdit(strategy)}
                className="text-text-muted hover:text-text-light p-1"
              >
                <i className="fas fa-edit text-xs"></i>
              </button>
            )}
            {onToggle && (
              <button
                onClick={() => onToggle(strategy)}
                className="text-text-muted hover:text-text-light p-1"
              >
                <i className={cn("fas text-xs", strategy.status === "active" ? "fa-pause" : "fa-play")}></i>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(strategy)}
                className="text-alert-red hover:text-red-400 p-1"
              >
                <i className="fas fa-trash text-xs"></i>
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        {strategy.type === "dca" && (
          <>
            <div>
              <p className="text-text-muted">Amount per trade</p>
              <p className="font-mono text-text-light">{(strategy.config as any)?.amount || "0"} ETH</p>
            </div>
            <div>
              <p className="text-text-muted">Total invested</p>
              <p className="font-mono text-text-light">{performance?.totalInvested || "0"} ETH</p>
            </div>
          </>
        )}
        
        {strategy.type === "momentum" && (
          <>
            <div>
              <p className="text-text-muted">Success rate</p>
              <p className="font-mono text-text-light">{performance?.successRate || 0}%</p>
            </div>
            <div>
              <p className="text-text-muted">Avg. gain</p>
              <p className="font-mono text-success-green">+{performance?.avgGain || 0}%</p>
            </div>
          </>
        )}
        
        {strategy.type === "arbitrage" && (
          <>
            <div>
              <p className="text-text-muted">Min. spread</p>
              <p className="font-mono text-text-light">{(strategy.config as any)?.minSpread || 0}%</p>
            </div>
            <div>
              <p className="text-text-muted">Opportunities</p>
              <p className="font-mono text-text-light">{performance?.opportunitiesFound || 0} found</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
