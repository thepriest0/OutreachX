import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FollowUpSchedulerProps {
  campaignId: string;
  leadName: string;
  onSuccess?: () => void;
}

export default function FollowUpScheduler({ campaignId, leadName, onSuccess }: FollowUpSchedulerProps) {
  const [delayDays, setDelayDays] = useState<number>(3);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const scheduleFollowUpMutation = useMutation({
    mutationFn: async (data: { delayDays: number }) => {
      return await apiRequest("POST", `/api/email-campaigns/${campaignId}/schedule-followup`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Follow-up scheduled for ${delayDays} days from now`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/email-campaigns"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule follow-up",
        variant: "destructive",
      });
    },
  });

  const cancelFollowUpsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/email-campaigns/${campaignId}/cancel-followups`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "All scheduled follow-ups have been cancelled",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/email-campaigns"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel follow-ups",
        variant: "destructive",
      });
    },
  });

  const handleScheduleFollowUp = () => {
    if (delayDays < 1 || delayDays > 30) {
      toast({
        title: "Invalid Input",
        description: "Delay must be between 1 and 30 days",
        variant: "destructive",
      });
      return;
    }
    scheduleFollowUpMutation.mutate({ delayDays });
  };

  const handleCancelFollowUps = () => {
    cancelFollowUpsMutation.mutate();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Follow-up Scheduler</CardTitle>
        <p className="text-sm text-muted-foreground">
          Schedule automated follow-ups for {leadName}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="delay-days">Follow-up Delay</Label>
          <Select
            value={delayDays.toString()}
            onValueChange={(value) => setDelayDays(parseInt(value))}
          >
            <SelectTrigger data-testid="select-delay-days">
              <SelectValue placeholder="Select delay" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 day</SelectItem>
              <SelectItem value="2">2 days</SelectItem>
              <SelectItem value="3">3 days</SelectItem>
              <SelectItem value="5">5 days</SelectItem>
              <SelectItem value="7">1 week</SelectItem>
              <SelectItem value="14">2 weeks</SelectItem>
              <SelectItem value="30">1 month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleScheduleFollowUp}
            disabled={scheduleFollowUpMutation.isPending}
            className="flex-1"
            data-testid="button-schedule-followup"
          >
            {scheduleFollowUpMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Scheduling...
              </>
            ) : (
              <>
                <i className="fas fa-clock mr-2"></i>
                Schedule Follow-up
              </>
            )}
          </Button>

          <Button
            onClick={handleCancelFollowUps}
            disabled={cancelFollowUpsMutation.isPending}
            variant="outline"
            data-testid="button-cancel-followups"
          >
            {cancelFollowUpsMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Cancelling...
              </>
            ) : (
              <>
                <i className="fas fa-times mr-2"></i>
                Cancel All
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Follow-ups will be sent automatically if no reply is received</p>
          <p>• Follow-ups are cancelled when the lead replies to any email</p>
          <p>• Maximum 3 follow-ups per lead</p>
        </div>
      </CardContent>
    </Card>
  );
}