import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-navy-800 border-navy-600">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-alert-red/10 p-3 rounded-full">
                  <AlertCircle className="h-8 w-8 text-alert-red" />
                </div>
              </div>
              <CardTitle className="text-2xl text-text-light">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-text-muted text-center">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              {this.state.error && (
                <div className="bg-navy-700 rounded-lg p-3 mt-4">
                  <p className="text-xs font-mono text-text-muted">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <Button 
                onClick={this.handleReset}
                className="w-full bg-trading-blue hover:bg-blue-600"
              >
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}