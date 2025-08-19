import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Mail, 
  Target, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import type { DashboardStats } from "@shared/schema";

const statCards = [
  {
    key: "totalLeads" as keyof DashboardStats,
    title: "Total Leads",
    icon: Users,
    description: "Active prospects",
    format: (value: number) => value.toLocaleString(),
    growthKey: "leadsGrowth" as keyof DashboardStats
  },
  {
    key: "emailsSent" as keyof DashboardStats,
    title: "Emails Sent",
    icon: Mail,
    description: "This month",
    format: (value: number) => value.toLocaleString(),
    growthKey: "emailsGrowth" as keyof DashboardStats
  },
  {
    key: "responseRate" as keyof DashboardStats,
    title: "Response Rate",
    icon: Target,
    description: "Email replies",
    format: (value: number) => `${value}%`,
    growthKey: "responseChange" as keyof DashboardStats
  },
  {
    key: "followupsScheduled" as keyof DashboardStats,
    title: "Follow-ups",
    icon: Calendar,
    description: "Scheduled",
    format: (value: number) => value.toLocaleString(),
    growthKey: "followupsGrowth" as keyof DashboardStats
  }
];

function StatCard({ 
  title, 
  value, 
  growth, 
  icon: Icon, 
  description,
  format 
}: {
  title: string;
  value: number;
  growth: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  format: (value: number) => string;
}) {
  const isPositive = growth > 0;
  const isNeutral = growth === 0;
  
  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{format(value)}</div>
        <div className="flex items-center space-x-2 mt-1">
          <CardDescription className="text-xs">
            {description}
          </CardDescription>
          {!isNeutral && (
            <Badge 
              variant="secondary" 
              className={`text-xs px-1.5 py-0.5 ${
                isPositive 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200" 
                  : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {Math.abs(growth)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatsCards() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="stats-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="stats-grid">
        {statCards.map((card, i) => (
          <Card key={i} className="border-destructive/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">--</div>
              <CardDescription className="text-xs">
                Unable to load data
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid" data-testid="stats-cards">
      {statCards.map((card) => (
        <StatCard
          key={card.key}
          title={card.title}
          value={stats[card.key] as number}
          growth={stats[card.growthKey] as number}
          icon={card.icon}
          description={card.description}
          format={card.format}
        />
      ))}
    </div>
  );
}