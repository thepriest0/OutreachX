import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page";
import SetupPage from "@/pages/setup-page";
import Dashboard from "@/pages/dashboard";
import Leads from "@/pages/leads";
import Campaigns from "@/pages/campaigns";
import Analytics from "@/pages/analytics";
import IntegrationPage from "@/pages/integration";

function Router() {
  const { setupNeeded, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (setupNeeded) {
    return <SetupPage onSetupComplete={() => window.location.reload()} />;
  }

  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/leads" component={Leads} />
      <ProtectedRoute path="/campaigns" component={Campaigns} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/integrations" component={IntegrationPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
