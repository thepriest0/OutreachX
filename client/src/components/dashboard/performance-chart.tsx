import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DashboardStats } from "@shared/schema";

export default function PerformanceChart() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Mock chart data - in a real app this would come from the API
  const chartData = [
    {
      label: "Emails Sent",
      value: stats?.emailsSent || 2851,
      percentage: 85,
      color: "bg-blue-500",
    },
    {
      label: "Opened",
      value: Math.floor((stats?.emailsSent || 2851) * 0.675),
      percentage: 68,
      color: "bg-green-500",
    },
    {
      label: "Replied",
      value: Math.floor((stats?.emailsSent || 2851) * (stats?.responseRate || 24.3) / 100),
      percentage: stats?.responseRate || 24,
      color: "bg-yellow-500",
    },
    {
      label: "Follow-ups Sent",
      value: stats?.followupsScheduled || 428,
      percentage: 15,
      color: "bg-purple-500",
    },
  ];

  const metrics = [
    {
      label: "Open Rate",
      value: "67.5%",
    },
    {
      label: "Response Rate",
      value: `${stats?.responseRate || 24.3}%`,
    },
    {
      label: "Conversion Rate",
      value: "8.7%",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Email Campaign Performance</CardTitle>
          <Select defaultValue="7">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart Bars */}
        <div className="space-y-4 mb-6">
          {chartData.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium">{item.value.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${item.color} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200">
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center">
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-500">{metric.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
