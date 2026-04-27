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
import Users from "@/pages/users";
import Analytics from "@/pages/analytics";
import IntegrationPage from "@/pages/integration";
import ProfilePage from "@/pages/profile";
import InviteAcceptPage from "@/pages/invite-accept";

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
      <Route path="/auth" component={AuthPage} />
      <Route path="/invite/:token" component={InviteAcceptPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/leads" component={Leads} />
      <ProtectedRoute path="/campaigns" component={Campaigns} />
      <ProtectedRoute path="/users" component={Users} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/integrations" component={IntegrationPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/" component={Dashboard} />
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
