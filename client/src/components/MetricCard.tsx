import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = "text-trading-blue",
  change,
  changeType = "neutral",
}: MetricCardProps) {
  const changeColors = {
    positive: "text-success-green",
    negative: "text-alert-red",
    neutral: "text-text-muted",
  };

  return (
    <div className="bg-navy-800 rounded-xl p-6 border border-navy-600">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <i className={cn(icon, iconColor, "text-lg")}></i>
          <span className="text-text-muted text-sm">{title}</span>
        </div>
        {change && (
          <div className={cn("text-sm", changeColors[changeType])}>
            <i className={cn(
              "fas text-xs mr-1",
              changeType === "positive" ? "fa-arrow-up" :
              changeType === "negative" ? "fa-arrow-down" : ""
            )}></i>
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold font-mono text-text-light">{value}</p>
        {subtitle && (
          <p className="text-text-muted text-sm">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
