
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
    queryKey: ["/api/email-campaigns"],
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

  const markRepliedMutation = useMutation({
    mutationFn: async ({ campaignId }: { campaignId: string }) => {
      const response = await apiRequest("POST", `/api/email-campaigns/${campaignId}/mark-replied`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Marked as replied!",
        description: "The campaign has been marked as replied.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/email-campaigns"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to mark as replied",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const scheduleFollowUpMutation = useMutation({
    mutationFn: async ({ campaignId, delay }: { campaignId: string; delay: number }) => {
      const response = await apiRequest("POST", `/api/email-campaigns/${campaignId}/schedule-followup`, { delayDays: Math.ceil(delay / 86400) });
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

  return null;
}
