import { useState } from "react";
import { cn } from "@/lib/utils";

interface PerformanceChartProps {
  title: string;
  data?: any; // Would be actual chart data in real implementation
}

export function PerformanceChart({ title }: PerformanceChartProps) {
  const [timeframe, setTimeframe] = useState("1D");
  
  const timeframes = ["1D", "7D", "30D", "ALL"];

  return (
    <div className="bg-navy-800 rounded-xl p-6 border border-navy-600">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-light">{title}</h3>
        <div className="flex space-x-2">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-3 py-1 text-xs rounded transition-colors",
                timeframe === tf
                  ? "bg-trading-blue text-white"
                  : "text-text-muted hover:bg-navy-700"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64 bg-navy-700 rounded-lg flex items-center justify-center">
        {/* Placeholder for actual chart implementation */}
        <div className="text-center text-text-muted">
          <i className="fas fa-chart-area text-4xl mb-4 text-trading-blue"></i>
          <p>Performance Chart ({timeframe})</p>
          <p className="text-sm mt-2">Chart.js integration required</p>
        </div>
      </div>
    </div>
  );
}
