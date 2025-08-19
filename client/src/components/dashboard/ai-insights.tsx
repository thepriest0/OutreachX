import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb,
  Target,
  Clock,
  Users,
  RefreshCw
} from "lucide-react";

interface AIInsight {
  id: string;
  type: "trend" | "recommendation" | "alert" | "optimization";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  confidence: number;
  action?: string;
  createdAt: string;
}

const insightIcons = {
  trend: TrendingUp,
  recommendation: Lightbulb,
  alert: AlertTriangle,
  optimization: Target
};

const impactColors = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
};

function InsightCard({ insight }: { insight: AIInsight }) {
  const Icon = insightIcons[insight.type];
  
  return (
    <div className="p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-sm">{insight.title}</h4>
            <Badge variant="secondary" className={`text-xs px-1.5 py-0.5 ${impactColors[insight.impact]}`}>
              {insight.impact}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
            {insight.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Brain className="h-3 w-3" />
                <span>{insight.confidence}% confident</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            {insight.action && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs"
                data-testid={`button-insight-action-${insight.id}`}
              >
                {insight.action}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AIInsightsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border">
            <div className="flex items-start space-x-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-16 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function AIInsights() {
  const { data: insights, isLoading, error, refetch, isRefetching } = useQuery<AIInsight[]>({
    queryKey: ["/api/insights"],
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  if (isLoading) {
    return <AIInsightsSkeleton />;
  }

  if (error || !insights) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-destructive" />
                <span>AI Insights</span>
              </CardTitle>
              <CardDescription>
                Unable to load AI insights
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              data-testid="button-retry-insights"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Failed to generate AI insights. Check your API configuration.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights.length) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-primary" />
                <span>AI Insights</span>
              </CardTitle>
              <CardDescription>
                AI-powered recommendations for your outreach
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              data-testid="button-refresh-insights"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No insights yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add more leads and send some emails to get AI-powered insights and recommendations.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              data-testid="button-generate-insights"
            >
              Generate Insights
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover" data-testid="ai-insights-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>AI Insights</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {insights.length} insights
              </Badge>
            </CardTitle>
            <CardDescription>
              AI-powered recommendations for your outreach campaigns
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            data-testid="button-refresh-insights"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
        
        {insights.length > 3 && (
          <div className="pt-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full"
              data-testid="button-view-all-insights"
            >
              View all insights ({insights.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}