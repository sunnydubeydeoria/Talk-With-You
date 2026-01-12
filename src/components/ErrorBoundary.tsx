import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: crypto.randomUUID(),
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: crypto.randomUUID(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for debugging
    console.error('Error Boundary caught an error:', {
      error,
      errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Report to external monitoring service if available
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo): void => {
    // Send error to monitoring service (placeholder for future analytics integration)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // Google Analytics error reporting
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          errorId: this.state.errorId,
          componentStack: errorInfo.componentStack,
        },
      });
    }

    // You could integrate with Sentry, LogRocket, or other error tracking services here
    // For example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  };

  private handleRetry = (): void => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: crypto.randomUUID(),
      });
    }
  };

  private handleGoHome = (): void => {
    // Navigate to home page
    window.location.href = '/';
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private copyErrorDetails = async (): Promise<void> => {
    if (!this.state.error || !this.state.errorInfo) return;

    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error.message,
      stack: this.state.error.stack,
      componentStack: this.state.errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      // You could show a toast notification here
      console.log('Error details copied to clipboard');
    } catch {
      console.warn('Failed to copy error details to clipboard');
    }
  };

  render(): ReactNode {
    // If custom fallback is provided, use it
    if (this.state.hasError && this.props.fallback) {
      return this.props.fallback;
    }

    // Default error UI
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-space flex items-center justify-center p-4">
          <Card className="w-full max-w-lg mx-auto border-destructive/20 shadow-lg">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
              <CardDescription className="text-muted-foreground">
                We apologize for the inconvenience. An unexpected error has occurred.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error ID for support reference */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-mono text-muted-foreground">
                  Error ID: {this.state.errorId}
                </p>
              </div>

              {/* Error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <details className="bg-muted/30 rounded-lg p-3">
                  <summary className="text-sm font-medium cursor-pointer hover:text-primary transition-colors">
                    Error Details (Development)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-mono bg-background rounded p-2 border border-border">
                      <p className="font-semibold text-destructive">{this.state.error.name}</p>
                      <p className="text-foreground break-words">{this.state.error.message}</p>
                    </div>
                    {this.state.errorInfo?.componentStack && (
                      <div className="text-xs font-mono bg-background rounded p-2 border border-border max-h-32 overflow-y-auto">
                        <p className="font-semibold text-primary">Component Stack:</p>
                        <pre className="whitespace-pre-wrap text-muted-foreground">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {this.retryCount < this.maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again ({this.maxRetries - this.retryCount} left)
                  </Button>
                )}

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>

                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              {/* Copy error details button for support */}
              <div className="pt-2 border-t border-border">
                <Button
                  onClick={this.copyErrorDetails}
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Copy Error Details (for support)
                </Button>
              </div>

              {/* Additional help text */}
              <div className="text-center text-xs text-muted-foreground pt-2">
                <p>If this problem persists, please contact support with the Error ID above.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Custom hook for handling errors in functional components
export function useErrorHandler(): (error: Error) => void {
  return React.useCallback((error: Error) => {
    // Log the error
    console.error('Error caught by useErrorHandler:', error);

    // You could integrate with error reporting service here
    // For example: Sentry.captureException(error);

    // In development, you might want to show the error
    if (import.meta.env.DEV) {
      throw error; // Re-throw in development to see in React DevTools
    }
  }, []);
}