import { Suspense, memo, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy load route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const CreateRoom = lazy(() => import("./pages/CreateRoom"));
const JoinRoom = lazy(() => import("./pages/JoinRoom"));
const ChatRoom = lazy(() => import("./pages/ChatRoom"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const RouteLoader = memo(() => (
  <div className="min-h-screen bg-gradient-space flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg text-muted-foreground animate-pulse">Loading...</p>
    </div>
  </div>
));

RouteLoader.displayName = 'RouteLoader';

// Enhanced error fallback for route loading
const RouteErrorBoundary = memo(({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary
    fallback={
      <div className="min-h-screen bg-gradient-space flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-destructive">Failed to load page</h2>
          <p className="text-muted-foreground">
            Something went wrong while loading this page. Please refresh the page or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
));

RouteErrorBoundary.displayName = 'RouteErrorBoundary';

// Enhanced QueryClient with performance optimizations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors, but retry on network errors and 5xx
        const errorResponse = error as any;
        if (errorResponse?.status >= 400 && errorResponse?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
  // Enable query deduplication and other performance features
  queryCache: new QueryCache({
    onError: (error) => {
      console.error('Query error:', error);
    },
    onSuccess: () => {
      // Optional: Log successful queries for debugging
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  }),
});

// Memoized App component to prevent unnecessary re-renders
const App = memo(() => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      // Custom error handling for the entire app
      console.error('App-level error:', { error, errorInfo });

      // You could integrate with error reporting service here
      // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }}
  >
    <QueryClientProvider client={queryClient}>
      <RouteErrorBoundary fallback={<div>Query client error occurred</div>}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <RouteErrorBoundary>
                      <Suspense fallback={<RouteLoader />}>
                        <Index />
                      </Suspense>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/create-room"
                  element={
                    <RouteErrorBoundary>
                      <Suspense fallback={<RouteLoader />}>
                        <CreateRoom />
                      </Suspense>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/join-room"
                  element={
                    <RouteErrorBoundary>
                      <Suspense fallback={<RouteLoader />}>
                        <JoinRoom />
                      </Suspense>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/room/:roomId"
                  element={
                    <RouteErrorBoundary>
                      <Suspense fallback={<RouteLoader />}>
                        <ChatRoom />
                      </Suspense>
                    </RouteErrorBoundary>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route
                  path="*"
                  element={
                    <RouteErrorBoundary>
                      <Suspense fallback={<RouteLoader />}>
                        <NotFound />
                      </Suspense>
                    </RouteErrorBoundary>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </RouteErrorBoundary>
    </QueryClientProvider>
  </ErrorBoundary>
));

App.displayName = 'App';

export default App;
