import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function AIInsights() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: insights, isLoading } = useQuery({
    queryKey: ["/api/insights"],
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/insights/generate");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      toast({
        title: "Success",
        description: "AI insights generated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate insights",
        variant: "destructive",
      });
    },
  });

  const latestInsight = insights && insights.length > 0 ? insights[0] : null;

  return (
    <Card className="bg-gradient-to-r from-secondary-500 to-purple-600 text-white border-0">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <i className="fas fa-brain mr-3 text-lg"></i>
              <h3 className="text-lg font-semibold">AI-Generated Insights</h3>
            </div>
            
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-white/20 rounded animate-pulse"></div>
                <div className="h-4 bg-white/20 rounded w-3/4 animate-pulse"></div>
              </div>
            ) : latestInsight ? (
              <div>
                <p className="text-white/90 mb-4">{latestInsight.content}</p>
                <p className="text-xs text-white/70 mb-4">
                  Generated {new Date(latestInsight.generatedAt).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-white/90 mb-4">
                No insights available yet. Generate your first AI insight based on your current outreach data.
              </p>
            )}

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => generateInsightsMutation.mutate()}
                disabled={generateInsightsMutation.isPending}
                className="text-white hover:text-white/80 hover:bg-white/10 p-0 h-auto font-medium"
              >
                {generateInsightsMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sync-alt mr-2"></i>
                    Generate New Insights
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                className="text-white hover:text-white/80 hover:bg-white/10 p-0 h-auto font-medium"
              >
                View Detailed Analysis
                <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            </div>
          </div>
          <div className="ml-6">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <i className="fas fa-chart-line text-2xl"></i>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
