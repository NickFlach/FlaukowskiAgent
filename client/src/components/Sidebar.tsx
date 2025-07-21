import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet, Menu, X } from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: agentStatus } = useQuery({
    queryKey: ["/api/agent/status"],
    refetchInterval: 5000,
  });

  const navigation = [
    { name: "Dashboard", href: "/", icon: "fas fa-tachometer-alt" },
    { name: "Trading Strategies", href: "/strategies", icon: "fas fa-chart-line" },
    { name: "Portfolio", href: "/portfolio", icon: "fas fa-wallet" },
    { name: "Risk Management", href: "/risk", icon: "fas fa-shield-alt" },
    { name: "Activity Log", href: "/activity", icon: "fas fa-history" },
    { name: "Configuration", href: "/config", icon: "fas fa-cog" },
  ];

  return (
    <aside className="w-64 bg-navy-800 border-r border-navy-600 flex flex-col">
      {/* Logo Header */}
      <div className="p-6 border-b border-navy-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-trading-blue rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-light">Flaukowski</h1>
            <p className="text-xs text-text-muted">Autonomous Agent</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "bg-trading-blue text-white"
                    : "text-text-muted hover:bg-navy-700 hover:text-text-light"
                )}
              >
                <i className={`${item.icon} w-5`}></i>
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Agent Status Card */}
      <div className="p-4 border-t border-navy-600">
        <div className="bg-navy-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Agent Status</span>
            <div className="flex items-center space-x-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                agentStatus?.isRunning ? "bg-success-green animate-pulse" : "bg-alert-red"
              )}></div>
              <span className={cn(
                "text-xs",
                agentStatus?.isRunning ? "text-success-green" : "text-alert-red"
              )}>
                {agentStatus?.isRunning ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
          </div>
          <p className="text-xs text-text-muted">
            Active Strategies: {agentStatus?.activeStrategies || 0}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Risk Level: {agentStatus?.riskScore?.level || "Unknown"}
          </p>
        </div>
      </div>

      {/* User Info and Logout */}
      <div className="px-4 pb-4 border-t border-navy-600 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="h-4 w-4 text-trading-blue" />
            <div className="text-xs">
              <div className="text-text-light font-medium">
                {user?.walletAddress ? 
                  `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` 
                  : 'Connected'}
              </div>
              <div className="text-text-muted">ETH Wallet</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="h-8 w-8 p-0 text-text-muted hover:text-text-light hover:bg-navy-700"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
