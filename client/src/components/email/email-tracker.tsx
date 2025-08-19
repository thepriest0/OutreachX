import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmailCampaign, Lead } from "@shared/schema";

interface EmailTrackerProps {
  campaignId?: string;
  leadId?: string;
}

export default function EmailTracker({ campaignId, leadId }: EmailTrackerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<string>("");

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: leads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ campaignId, leadId }: { campaignId: string; leadId: string }) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/send`, { leadId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email sent!",
        description: "The email has been sent successfully and is being tracked.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const scheduleFollowUpMutation = useMutation({
    mutationFn: async ({ campaignId, delay }: { campaignId: string; delay: number }) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/schedule-followup`, { delay });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Follow-up scheduled!",
        description: "The follow-up email has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to schedule follow-up",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string | null) => {
    const statusColors = {
      draft: "secondary",
      sent: "default",
      opened: "outline",
      replied: "default",
      bounced: "destructive"
    } as const;

    const color = statusColors[status as keyof typeof statusColors] || "secondary";
    
    return (
      <Badge variant={color}>
        {status || "draft"}
      </Badge>
    );
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "sent":
        return "📤";
      case "opened":
        return "👁️";
      case "replied":
        return "💬";
      case "bounced":
        return "❌";
      default:
        return "📝";
    }
  };

  if (campaignsLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading email campaigns...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="mr-3">📊</span>
            Email Campaign Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns && campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getStatusIcon(campaign.status)}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{campaign.subject}</h4>
                        <p className="text-sm text-gray-600">
                          {campaign.isFollowUp ? "Follow-up" : "Initial"} • Sequence #{campaign.followUpSequence || 0}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-white rounded border">
                      <p className="text-2xl font-bold text-blue-600">
                        {campaign.sentAt ? "1" : "0"}
                      </p>
                      <p className="text-sm text-gray-600">Sent</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded border">
                      <p className="text-2xl font-bold text-green-600">
                        {campaign.openedAt ? "1" : "0"}
                      </p>
                      <p className="text-sm text-gray-600">Opened</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded border">
                      <p className="text-2xl font-bold text-purple-600">
                        {campaign.repliedAt ? "1" : "0"}
                      </p>
                      <p className="text-sm text-gray-600">Replied</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {campaign.sentAt && (
                        <p>Sent: {new Date(campaign.sentAt).toLocaleString()}</p>
                      )}
                      {campaign.openedAt && (
                        <p>Opened: {new Date(campaign.openedAt).toLocaleString()}</p>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {campaign.status === "draft" && leads && (
                        <>
                          <Select value={selectedLead} onValueChange={setSelectedLead}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Select lead" />
                            </SelectTrigger>
                            <SelectContent>
                              {leads.map((lead) => (
                                <SelectItem key={lead.id} value={lead.id}>
                                  {lead.name} ({lead.company})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => sendEmailMutation.mutate({ 
                              campaignId: campaign.id, 
                              leadId: selectedLead 
                            })}
                            disabled={!selectedLead || sendEmailMutation.isPending}
                            size="sm"
                          >
                            {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
                          </Button>
                        </>
                      )}

                      {campaign.status === "sent" && !campaign.isFollowUp && (
                        <Button
                          onClick={() => scheduleFollowUpMutation.mutate({ 
                            campaignId: campaign.id, 
                            delay: 86400 // 24 hours
                          })}
                          disabled={scheduleFollowUpMutation.isPending}
                          size="sm"
                          variant="outline"
                        >
                          {scheduleFollowUpMutation.isPending ? "Scheduling..." : "Schedule Follow-up"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📧</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No email campaigns yet</h3>
                <p className="text-gray-500">
                  Create your first email campaign to start tracking opens, clicks, and replies.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}