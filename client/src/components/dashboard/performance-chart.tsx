import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { useState } from "react";

interface PerformanceData {
  emailsSent: Array<{ date: string; count: number; }>;
  responseRates: Array<{ date: string; rate: number; }>;
  leadsByStatus: Array<{ status: string; count: number; color: string; }>;
  monthlyTrends: Array<{ month: string; leads: number; emails: number; responses: number; }>;
}

const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted-foreground))"
};

function EmailTrendsChart({ data }: { data: PerformanceData["emailsSent"] }) {
  if (!data.length) return null;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: number) => [value, "Emails Sent"]}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px"
            }}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: CHART_COLORS.primary, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ResponseRateChart({ data }: { data: PerformanceData["responseRates"] }) {
  if (!data.length) return null;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
          <Tooltip 
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: number) => [`${value}%`, "Response Rate"]}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px"
            }}
          />
          <Bar 
            dataKey="rate" 
            fill={CHART_COLORS.success}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LeadStatusChart({ data }: { data: PerformanceData["leadsByStatus"] }) {
  if (!data.length) return null;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [value, props.payload.status]}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px"
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function PerformanceChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-24 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full rounded" />
      </CardContent>
    </Card>
  );
}

export default function PerformanceChart() {
  const [chartType, setChartType] = useState<"emails" | "responses" | "leads">("emails");
  
  const { data, isLoading, error, refetch, isRefetching } = useQuery<PerformanceData>({
    queryKey: ["/api/dashboard/performance"],
    refetchInterval: 120000, // Refetch every 2 minutes
  });

  if (isLoading) {
    return <PerformanceChartSkeleton />;
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-destructive" />
                <span>Performance Analytics</span>
              </CardTitle>
              <CardDescription>
                Unable to load performance data
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              data-testid="button-retry-performance"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Failed to load performance analytics. Please try again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.emailsSent.length > 0 || data.responseRates.length > 0 || data.leadsByStatus.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Performance Analytics</span>
              </CardTitle>
              <CardDescription>
                Track your outreach campaign performance over time
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No performance data yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Send some emails and track responses to see your performance analytics.
            </p>
            <Button size="sm" data-testid="button-start-campaign">
              Start Your First Campaign
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartOptions = [
    { value: "emails", label: "Email Trends", icon: TrendingUp },
    { value: "responses", label: "Response Rates", icon: BarChart3 },
    { value: "leads", label: "Lead Status", icon: Calendar }
  ] as const;

  const renderChart = () => {
    switch (chartType) {
      case "emails":
        return <EmailTrendsChart data={data.emailsSent} />;
      case "responses":
        return <ResponseRateChart data={data.responseRates} />;
      case "leads":
        return <LeadStatusChart data={data.leadsByStatus} />;
      default:
        return <EmailTrendsChart data={data.emailsSent} />;
    }
  };

  return (
    <Card className="card-hover" data-testid="performance-chart-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Performance Analytics</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                Live
              </Badge>
            </CardTitle>
            <CardDescription>
              Track your outreach campaign performance over time
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger className="w-40" data-testid="select-chart-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chartOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              data-testid="button-refresh-performance"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}