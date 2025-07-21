import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: string | number, decimals = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  return num.toFixed(decimals);
}

export function formatCurrency(value: string | number, symbol = "$"): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return `${symbol}0.00`;
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercentage(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0%";
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "success":
      return "text-success-green";
    case "inactive":
    case "paused":
      return "text-text-muted";
    case "error":
    case "failed":
      return "text-alert-red";
    case "monitoring":
    case "warning":
      return "text-warning-orange";
    default:
      return "text-text-light";
  }
}

export function getStatusBadgeColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "success":
      return "bg-success-green text-white";
    case "inactive":
    case "paused":
      return "bg-navy-600 text-text-muted";
    case "error":
    case "failed":
      return "bg-alert-red text-white";
    case "monitoring":
    case "warning":
      return "bg-warning-orange text-white";
    default:
      return "bg-navy-600 text-text-light";
  }
}
