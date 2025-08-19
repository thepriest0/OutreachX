import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AIEmailGenerator from "@/components/email/ai-email-generator";
import CSVImport from "@/components/leads/csv-import";

export default function QuickActions() {
  const [showEmailGenerator, setShowEmailGenerator] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);

  const quickActions = [
    {
      title: "Import CSV",
      description: "Bulk upload leads",
      icon: "fas fa-upload",
      color: "blue",
      action: () => setShowCSVImport(true),
    },
    {
      title: "AI Email Generator",
      description: "Create with Gemini AI",
      icon: "fas fa-robot",
      color: "purple",
      action: () => setShowEmailGenerator(true),
    },
    {
      title: "Schedule Follow-up",
      description: "Automate sequences",
      icon: "fas fa-calendar-plus",
      color: "green",
      action: () => console.log("Schedule follow-up"),
    },
    {
      title: "View Analytics",
      description: "Detailed reports",
      icon: "fas fa-chart-bar",
      color: "yellow",
      action: () => window.location.href = "/analytics",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-100 text-blue-600 group-hover:bg-blue-200";
      case "purple":
        return "bg-purple-100 text-purple-600 group-hover:bg-purple-200";
      case "green":
        return "bg-green-100 text-green-600 group-hover:bg-green-200";
      case "yellow":
        return "bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200";
      default:
        return "bg-gray-100 text-gray-600 group-hover:bg-gray-200";
    }
  };

  const getBorderColor = (color: string) => {
    switch (color) {
      case "blue":
        return "hover:border-blue-300 hover:bg-blue-50";
      case "purple":
        return "hover:border-purple-300 hover:bg-purple-50";
      case "green":
        return "hover:border-green-300 hover:bg-green-50";
      case "yellow":
        return "hover:border-yellow-300 hover:bg-yellow-50";
      default:
        return "hover:border-gray-300 hover:bg-gray-50";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {quickActions.map((action) => (
          <Button
            key={action.title}
            variant="outline"
            onClick={action.action}
            className={`w-full flex items-center justify-start p-4 h-auto border-2 border-dashed border-gray-300 ${getBorderColor(action.color)} transition-colors group`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(action.color)}`}>
              <i className={action.icon}></i>
            </div>
            <div className="ml-3 text-left">
              <p className="font-medium text-gray-900">{action.title}</p>
              <p className="text-sm text-gray-500">{action.description}</p>
            </div>
          </Button>
        ))}

        {/* Email Integration Status */}
        <div className="pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Email Integration</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <i className="fab fa-google mr-2 text-red-500"></i>
                <span className="text-sm text-gray-700">Gmail</span>
              </div>
              <Badge className="bg-green-100 text-green-800">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <i className="fab fa-microsoft mr-2 text-blue-500"></i>
                <span className="text-sm text-gray-700">Outlook</span>
              </div>
              <Button variant="ghost" className="text-primary-600 hover:text-primary-700 font-medium text-xs h-auto p-1">
                Connect
              </Button>
            </div>
          </div>
        </div>

        {/* AI Email Generator Modal */}
        {showEmailGenerator && (
          <AIEmailGenerator
            onClose={() => setShowEmailGenerator(false)}
            onSuccess={() => setShowEmailGenerator(false)}
          />
        )}

        {/* CSV Import Modal */}
        {showCSVImport && (
          <CSVImport
            onClose={() => setShowCSVImport(false)}
            onSuccess={() => setShowCSVImport(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}
