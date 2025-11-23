import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import ChatRoom from "./pages/ChatRoom";
import NotFound from "./pages/NotFound";

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
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      // Custom error handling for the entire app
      console.error('App-level error:', { error, errorInfo });

      // You could integrate with error reporting service here
      // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }}
  >
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary fallback={<div>Query client error occurred</div>}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <ErrorBoundary>
                    <Index />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/create-room"
                element={
                  <ErrorBoundary>
                    <CreateRoom />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/join-room"
                element={
                  <ErrorBoundary>
                    <JoinRoom />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/room/:roomId"
                element={
                  <ErrorBoundary>
                    <ChatRoom />
                  </ErrorBoundary>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route
                path="*"
                element={
                  <ErrorBoundary>
                    <NotFound />
                  </ErrorBoundary>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
