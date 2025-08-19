import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/types";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const statsData = [
    {
      title: "Total Leads",
      value: stats?.totalLeads || 0,
      change: stats?.leadsGrowth || 0,
      icon: "fas fa-users",
      color: "blue",
      changeType: "month",
    },
    {
      title: "Emails Sent",
      value: stats?.emailsSent || 0,
      change: stats?.emailsGrowth || 0,
      icon: "fas fa-paper-plane",
      color: "green",
      changeType: "week",
    },
    {
      title: "Response Rate",
      value: `${stats?.responseRate || 0}%`,
      change: stats?.responseChange || 0,
      icon: "fas fa-reply",
      color: "yellow",
      changeType: "week",
    },
    {
      title: "Follow-ups Scheduled",
      value: stats?.followupsScheduled || 0,
      change: stats?.followupsGrowth || 0,
      icon: "fas fa-clock",
      color: "purple",
      changeType: "week",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-100 text-blue-600";
      case "green":
        return "bg-green-100 text-green-600";
      case "yellow":
        return "bg-yellow-100 text-yellow-600";
      case "purple":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return "fas fa-arrow-up";
    if (change < 0) return "fas fa-arrow-down";
    return "fas fa-minus";
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat) => (
        <Card key={stat.title} className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </p>
                <p className={`text-sm mt-1 ${getChangeColor(stat.change)}`}>
                  <i className={`${getChangeIcon(stat.change)} mr-1`}></i>
                  <span>{Math.abs(stat.change)}%</span> this {stat.changeType}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(stat.color)}`}>
                <i className={stat.icon}></i>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
