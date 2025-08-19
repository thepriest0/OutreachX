import { useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsCards from "@/components/dashboard/stats-cards";
import AIInsights from "@/components/dashboard/ai-insights";
import RecentLeads from "@/components/dashboard/recent-leads";
import QuickActions from "@/components/dashboard/quick-actions";
import PerformanceChart from "@/components/dashboard/performance-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Loader2 } from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
          <TrendingUp className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header 
          title="Dashboard"
          subtitle="Welcome back! Here's your outreach overview."
        />
        
        <div className="p-8 space-y-8">
          {/* Stats skeleton */}
          <div className="stats-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border p-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>

          {/* AI Insights skeleton */}
          <div className="bg-card rounded-xl border p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Dashboard is now protected by ProtectedRoute, so user should always exist
  if (!user) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header 
          title="Dashboard"
          subtitle="Welcome back! Here's your outreach overview."
        />
        
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          <Suspense fallback={<DashboardSkeleton />}>
            <StatsCards />
            <AIInsights />
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2">
                <RecentLeads />
              </div>
              <div>
                <QuickActions />
              </div>
            </div>
            
            <PerformanceChart />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
