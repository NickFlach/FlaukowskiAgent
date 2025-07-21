import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Dashboard from "@/pages/Dashboard";
import Strategies from "@/pages/Strategies";
import Portfolio from "@/pages/Portfolio";
import RiskManagement from "@/pages/RiskManagement";
import ActivityLog from "@/pages/ActivityLog";
import Configuration from "@/pages/Configuration";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function AuthenticatedRouter() {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return (
    <Switch>
      <Route path="/">
        <Layout>
          <Dashboard />
        </Layout>
      </Route>
      <Route path="/strategies">
        <Layout>
          <Strategies />
        </Layout>
      </Route>
      <Route path="/portfolio">
        <Layout>
          <Portfolio />
        </Layout>
      </Route>
      <Route path="/risk">
        <Layout>
          <RiskManagement />
        </Layout>
      </Route>
      <Route path="/activity">
        <Layout>
          <ActivityLog />
        </Layout>
      </Route>
      <Route path="/config">
        <Layout>
          <Configuration />
        </Layout>
      </Route>
      <Route>
        <Layout>
          <NotFound />
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <div className="dark">
              <Toaster />
              <AuthenticatedRouter />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
