import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PerformanceChart from "@/components/dashboard/performance-chart";
import type { DashboardStats } from "@shared/schema";

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["/api/insights"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-chart-bar text-white text-2xl animate-pulse"></i>
          </div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header 
          title="Analytics"
          subtitle="Analyze your outreach performance and get AI-powered insights."
        />
        
        <div className="p-6 space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Open Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">67.5%</p>
                    <p className="text-green-600 text-sm mt-1">
                      <i className="fas fa-arrow-up mr-1"></i>
                      +5.2% vs last month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-envelope-open text-blue-600"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Response Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {stats ? `${stats.responseRate}%` : '24.3%'}
                    </p>
                    <p className="text-yellow-600 text-sm mt-1">
                      <i className="fas fa-minus mr-1"></i>
                      {stats ? `${stats.responseChange}%` : '-2%'} vs last week
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-reply text-yellow-600"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Conversion Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">8.7%</p>
                    <p className="text-green-600 text-sm mt-1">
                      <i className="fas fa-arrow-up mr-1"></i>
                      +1.3% vs last month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-handshake text-green-600"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Avg. Follow-ups</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">2.3</p>
                    <p className="text-blue-600 text-sm mt-1">
                      <i className="fas fa-arrow-up mr-1"></i>
                      +0.4 vs last month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-redo text-purple-600"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <PerformanceChart />

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-brain mr-3 text-secondary-500"></i>
                AI-Generated Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating insights...</p>
                </div>
              ) : insights && Array.isArray(insights) && insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight: any) => (
                    <div key={insight.id} className="p-4 bg-gradient-to-r from-secondary-50 to-purple-50 rounded-lg border border-secondary-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-gray-800 mb-2">{insight.content}</p>
                          <p className="text-xs text-gray-500">
                            Generated {new Date(insight.generatedAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-secondary-600 border-secondary-300">
                          {insight.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-brain text-gray-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No insights available</h3>
                  <p className="text-gray-500">
                    AI insights will be generated as you accumulate more outreach data.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Best Performing Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Best Performing Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <h4 className="font-medium text-gray-900">Professional tone outreach</h4>
                    <p className="text-sm text-gray-600">45% response rate • 156 emails sent</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">45%</p>
                    <p className="text-xs text-green-600">Response Rate</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <h4 className="font-medium text-gray-900">Follow-up sequence #2</h4>
                    <p className="text-sm text-gray-600">38% response rate • 89 emails sent</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">38%</p>
                    <p className="text-xs text-blue-600">Response Rate</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <h4 className="font-medium text-gray-900">Direct tone outreach</h4>
                    <p className="text-sm text-gray-600">32% response rate • 203 emails sent</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-600">32%</p>
                    <p className="text-xs text-yellow-600">Response Rate</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
