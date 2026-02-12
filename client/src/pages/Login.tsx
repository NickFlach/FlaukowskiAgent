import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Shield, Zap, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface LoginProps {
  onLogin: (user: any, agent: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentTx, setPaymentTx] = useState("");

  const connectWallet = async () => {
    setIsConnecting(true);
    setError("");

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is required to use this application");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      setWalletAddress(accounts[0]);
      setSuccess("Wallet connected successfully");
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const login = async () => {
    if (!walletAddress) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoggingIn(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      if (response.ok) {
        const { user, agent } = await response.json();
        onLogin(user, agent);
      } else {
        const errorData = await response.json();
        if (response.status === 404) {
          setShowPayment(true);
          setError("Account not found. Please register by paying 0.001 ETH first.");
        } else {
          setError(errorData.error || "Login failed");
        }
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const sendPayment = async () => {
    if (!walletAddress) {
      setError("Please connect your wallet first");
      return;
    }

    setIsRegistering(true);
    setError("");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Send 0.001 ETH to the target address
      const tx = await signer.sendTransaction({
        to: import.meta.env.VITE_TARGET_WALLET_ADDRESS || "",
        value: ethers.parseEther("0.001")
      });

      setPaymentTx(tx.hash);
      setSuccess("Payment sent! Waiting for confirmation...");

      // Wait for transaction confirmation
      await tx.wait();

      // Register user with payment transaction
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          paymentTxHash: tx.hash
        }),
      });

      if (response.ok) {
        const { user, agent } = await response.json();
        setSuccess("Registration successful! Logging you in...");
        setTimeout(() => onLogin(user, agent), 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Registration failed");
      }
    } catch (err: any) {
      setError(err.message || "Payment failed");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Flaukowski</h1>
          <p className="text-muted-foreground">
            Autonomous Crypto Trading Agent
          </p>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wallet className="h-5 w-5" />
              Connect Your Wallet
            </CardTitle>
            <CardDescription>
              Use your Ethereum wallet to access the trading platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Wallet Connection */}
            {!walletAddress ? (
              <Button 
                onClick={connectWallet} 
                disabled={isConnecting}
                className="w-full"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect MetaMask
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-mono">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>

                {!showPayment ? (
                  <Button 
                    onClick={login} 
                    disabled={isLoggingIn}
                    className="w-full"
                    size="lg"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        To create an account, send exactly 0.001 ETH to activate your trading agent.
                      </AlertDescription>
                    </Alert>

                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <div className="text-sm font-medium">Payment Details:</div>
                      <div className="text-sm text-muted-foreground">
                        Amount: <span className="font-mono">0.001 ETH</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        To: <span className="font-mono text-xs">{import.meta.env.VITE_TARGET_WALLET_ADDRESS || "Configure wallet in .env"}</span>
                      </div>
                    </div>

                    <Button 
                      onClick={sendPayment} 
                      disabled={isRegistering}
                      className="w-full"
                      size="lg"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Pay 1 ETH & Register
                        </>
                      )}
                    </Button>

                    {paymentTx && (
                      <div className="text-xs text-center text-muted-foreground">
                        Transaction: <span className="font-mono">{paymentTx.slice(0, 10)}...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Status Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 gap-3 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            Autonomous ETH Trading
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            Advanced Risk Management
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            Secure Wallet Integration
          </div>
        </div>
      </div>
    </div>
  );
}