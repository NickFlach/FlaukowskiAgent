import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Agent } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  agent: Agent | null;
  isAuthenticated: boolean;
  login: (user: User, agent: Agent) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);

  const isAuthenticated = !!(user && agent);

  const login = (userData: User, agentData: Agent) => {
    setUser(userData);
    setAgent(agentData);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    localStorage.setItem("auth_agent", JSON.stringify(agentData));
  };

  const logout = () => {
    setUser(null);
    setAgent(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_agent");
  };

  // Restore authentication state from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");
    const storedAgent = localStorage.getItem("auth_agent");

    if (storedUser && storedAgent) {
      try {
        setUser(JSON.parse(storedUser));
        setAgent(JSON.parse(storedAgent));
      } catch (error) {
        console.error("Failed to restore auth state:", error);
        logout();
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, agent, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}