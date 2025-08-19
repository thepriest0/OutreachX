import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AIEmailGenerator from "@/components/email/ai-email-generator";
import FollowUpScheduler from "@/components/email/follow-up-scheduler";
import EmailTracker from "@/components/email/email-tracker";
import type { EmailCampaign } from "@shared/schema";

export default function Campaigns() {
  const [showEmailGenerator, setShowEmailGenerator] = useState(false);
  
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

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/campaigns"],
    enabled: isAuthenticated,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "opened":
        return "bg-yellow-100 text-yellow-800";
      case "replied":
        return "bg-green-100 text-green-800";
      case "bounced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-envelope text-white text-2xl animate-pulse"></i>
          </div>
          <p className="text-gray-600">Loading campaigns...</p>
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
          title="Email Campaigns"
          subtitle="Manage your email outreach campaigns and track performance."
        />
        
        <div className="p-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-gray-900">All Campaigns</h3>
            </div>
            <Button
              onClick={() => setShowEmailGenerator(true)}
              className="bg-primary-500 hover:bg-primary-600"
            >
              <i className="fas fa-robot mr-2"></i>
              Generate AI Email
            </Button>
          </div>

          {/* Email Tracking Dashboard */}
          <EmailTracker />

          {/* Campaigns Grid */}
          {campaignsLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading campaigns...</p>
            </div>
          ) : campaigns && Array.isArray(campaigns) && campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign: EmailCampaign) => (
                <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-medium text-gray-900 line-clamp-1">
                          {campaign.subject}
                        </CardTitle>
                        <div className="flex items-center mt-2">
                          <Badge className={getStatusColor(campaign.status)}>
                            {formatStatus(campaign.status)}
                          </Badge>
                          {campaign.isFollowUp && (
                            <Badge variant="outline" className="ml-2">
                              Follow-up #{campaign.followUpSequence}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 line-clamp-3">
                        {campaign.content.substring(0, 150)}...
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {campaign.tone.charAt(0).toUpperCase() + campaign.tone.slice(1)} tone
                        </span>
                        <span>
                          {campaign.createdAt 
                            ? new Date(campaign.createdAt).toLocaleDateString()
                            : ""
                          }
                        </span>
                      </div>

                      {campaign.sentAt && (
                        <div className="text-xs text-gray-500">
                          Sent: {new Date(campaign.sentAt).toLocaleString()}
                        </div>
                      )}

                      {campaign.openedAt && (
                        <div className="text-xs text-green-600">
                          Opened: {new Date(campaign.openedAt).toLocaleString()}
                        </div>
                      )}

                      {campaign.repliedAt && (
                        <div className="text-xs text-blue-600">
                          Replied: {new Date(campaign.repliedAt).toLocaleString()}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <Button variant="ghost" size="sm">
                          <i className="fas fa-eye mr-1"></i>
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          <i className="fas fa-edit mr-1"></i>
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-envelope text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-500 mb-4">
                Get started by generating your first AI-powered email campaign.
              </p>
              <Button
                onClick={() => setShowEmailGenerator(true)}
                className="bg-primary-500 hover:bg-primary-600"
              >
                <i className="fas fa-robot mr-2"></i>
                Generate Your First Email
              </Button>
            </div>
          )}
        </div>

        {/* AI Email Generator Modal */}
        {showEmailGenerator && (
          <AIEmailGenerator
            onClose={() => setShowEmailGenerator(false)}
            onSuccess={() => {
              setShowEmailGenerator(false);
              // Optionally refresh campaigns
            }}
          />
        )}
      </main>
    </div>
  );
}
