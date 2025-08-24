
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FollowUpSchedule {
  id?: string;
  sequence: number;
  delayDays: number;
  subject: string;
  content: string;
  tone: string;
  enabled: boolean;
  status?: string;
  scheduledAt?: string;
}

interface FollowUpSchedulerProps {
  campaignId: string;
  leadName: string;
  leadCompany: string;
  leadRole: string;
  originalTone: string;
  onSuccess?: () => void;
}

export default function FollowUpScheduler({ 
  campaignId, 
  leadName, 
  leadCompany, 
  leadRole, 
  originalTone,
  onSuccess 
}: FollowUpSchedulerProps) {
  const [schedules, setSchedules] = useState<FollowUpSchedule[]>([
    {
      sequence: 1,
      delayDays: 3,
      subject: "",
      content: "",
      tone: originalTone,
      enabled: true
    },
    {
      sequence: 2,
      delayDays: 7,
      subject: "",
      content: "",
      tone: originalTone,
      enabled: false
    },
    {
      sequence: 3,
      delayDays: 14,
      subject: "",
      content: "",
      tone: originalTone,
      enabled: false
    }
  ]);

  const [activeTab, setActiveTab] = useState("schedule-1");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing follow-ups
  const { data: existingFollowUps } = useQuery({
    queryKey: [`/api/email-campaigns/${campaignId}/followups`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/email-campaigns/${campaignId}/followups`);
      return response.json();
    },
  });

  // Load existing follow-ups into schedules
  useEffect(() => {
    if (existingFollowUps?.length > 0) {
      const updatedSchedules = [...schedules];
      existingFollowUps.forEach((followUp: any) => {
        const index = followUp.followUpSequence - 1;
        if (index >= 0 && index < 3) {
          updatedSchedules[index] = {
            id: followUp.id,
            sequence: followUp.followUpSequence,
            delayDays: followUp.delayDays || updatedSchedules[index].delayDays,
            subject: followUp.subject,
            content: followUp.content,
            tone: followUp.tone,
            enabled: true,
            status: followUp.status,
            scheduledAt: followUp.scheduledAt
          };
        }
      });
      setSchedules(updatedSchedules);
    }
  }, [existingFollowUps]);

  const generateEmailMutation = useMutation({
    mutationFn: async (data: { sequence: number; tone: string; delayDays: number }) => {
      const response = await apiRequest("POST", `/api/email-campaigns/${campaignId}/generate-followup`, data);
      return await response.json();
    },
    onSuccess: (response, variables) => {
      const { sequence } = variables;
      const index = sequence - 1;
      
      console.log('AI Generated Email Response:', response);
      
      setSchedules(prev => {
        const newSchedules = [...prev];
        newSchedules[index] = {
          ...newSchedules[index],
          subject: response.subject,
          content: response.content
        };
        return newSchedules;
      });
      toast({
        title: "Email Generated",
        description: `Follow-up #${sequence} content generated successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate email content",
        variant: "destructive",
      });
    },
  });

  const saveSchedulesMutation = useMutation({
    mutationFn: async (data: { schedules: FollowUpSchedule[] }) => {
      const response = await apiRequest("POST", `/api/email-campaigns/${campaignId}/update-followups`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Follow-up schedules saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/email-campaigns/${campaignId}/followups`] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-campaigns"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save follow-up schedules",
        variant: "destructive",
      });
    },
  });

  const deleteFollowUpMutation = useMutation({
    mutationFn: async (followUpId: string) => {
      return await apiRequest("DELETE", `/api/email-campaigns/followup/${followUpId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Follow-up deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/email-campaigns/${campaignId}/followups`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete follow-up",
        variant: "destructive",
      });
    },
  });

  const updateSchedule = (index: number, updates: Partial<FollowUpSchedule>) => {
    setSchedules(prev => {
      const newSchedules = [...prev];
      newSchedules[index] = { ...newSchedules[index], ...updates };
      return newSchedules;
    });
  };

  const handleGenerateEmail = (sequence: number) => {
    const schedule = schedules[sequence - 1];
    generateEmailMutation.mutate({
      sequence,
      tone: schedule.tone,
      delayDays: schedule.delayDays
    });
  };

  const handleSaveSchedules = () => {
    // Only send new follow-ups (ones without an ID) that are enabled and have content
    const newSchedules = schedules.filter(s => 
      s.enabled && 
      s.subject && 
      s.content && 
      !s.id // Only new ones, not existing
    );
    
    if (newSchedules.length === 0) {
      toast({
        title: "No New Follow-ups",
        description: "All enabled follow-ups have already been created",
        variant: "default",
      });
      return;
    }
    
    saveSchedulesMutation.mutate({ schedules: newSchedules });
  };

  const handleDeleteFollowUp = (followUpId: string, sequence: number) => {
    deleteFollowUpMutation.mutate(followUpId);
    // Reset the schedule to default
    updateSchedule(sequence - 1, {
      id: undefined,
      subject: "",
      content: "",
      enabled: false,
      status: undefined,
      scheduledAt: undefined
    });
  };

  const getStatusBadge = (schedule: FollowUpSchedule) => {
    if (!schedule.enabled) return <Badge variant="secondary">Disabled</Badge>;
    if (!schedule.id) {
      // If it has content but no ID, it's ready to be saved
      if (schedule.subject && schedule.content) {
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ready to Save</Badge>;
      }
      return <Badge variant="outline">Not Created</Badge>;
    }
    
    switch (schedule.status) {
      case "draft":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Created & Scheduled</Badge>;
      case "sent":
        return <Badge variant="destructive">Sent</Badge>;
      case "bounced":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Follow-up Campaign Manager</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure up to 3 automated follow-ups for {leadName} at {leadCompany}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {schedules.map((schedule, index) => (
              <TabsTrigger key={index} value={`schedule-${index + 1}`} className="relative">
                Follow-up #{index + 1}
                {schedule.enabled && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {schedules.map((schedule, index) => (
            <TabsContent key={index} value={`schedule-${index + 1}`} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={schedule.enabled}
                    onCheckedChange={(enabled) => updateSchedule(index, { enabled })}
                  />
                  <Label>Enable Follow-up #{index + 1}</Label>
                </div>
                {getStatusBadge(schedule)}
              </div>

              {schedule.enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Delay (Days)</Label>
                      <Select
                        value={schedule.delayDays.toString()}
                        onValueChange={(value) => updateSchedule(index, { delayDays: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="2">2 days</SelectItem>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="5">5 days</SelectItem>
                          <SelectItem value="7">1 week</SelectItem>
                          <SelectItem value="14">2 weeks</SelectItem>
                          <SelectItem value="21">3 weeks</SelectItem>
                          <SelectItem value="30">1 month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tone</Label>
                      <Select
                        value={schedule.tone}
                        onValueChange={(value) => updateSchedule(index, { tone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="direct">Direct</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Email Subject</Label>
                    <Input
                      value={schedule.subject}
                      onChange={(e) => updateSchedule(index, { subject: e.target.value })}
                      placeholder={`Follow-up #${index + 1} subject line`}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email Content</Label>
                    <Textarea
                      value={schedule.content}
                      onChange={(e) => updateSchedule(index, { content: e.target.value })}
                      placeholder={`Follow-up #${index + 1} email content`}
                      rows={8}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleGenerateEmail(index + 1)}
                      disabled={generateEmailMutation.isPending}
                      variant="outline"
                      size="sm"
                    >
                      {generateEmailMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Generating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-robot mr-2"></i>
                          Generate with AI
                        </>
                      )}
                    </Button>

                    {schedule.id && (
                      <Button
                        onClick={() => handleDeleteFollowUp(schedule.id!, index + 1)}
                        disabled={deleteFollowUpMutation.isPending}
                        variant="outline"
                        size="sm"
                      >
                        <i className="fas fa-trash mr-2"></i>
                        Delete
                      </Button>
                    )}
                  </div>

                  {schedule.scheduledAt && (
                    <div className="text-xs text-muted-foreground">
                      Scheduled for: {new Date(schedule.scheduledAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 pt-4 border-t">
          {(() => {
            const newSchedules = schedules.filter(s => 
              s.enabled && 
              s.subject && 
              s.content && 
              !s.id
            );
            const existingSchedules = schedules.filter(s => s.id);
            
            return (
              <>
                {newSchedules.length > 0 || existingSchedules.length > 0 ? (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                      {existingSchedules.length > 0 && (
                        <p className="mb-1">
                          ✅ {existingSchedules.length} follow-up(s) already created and locked
                        </p>
                      )}
                      {newSchedules.length > 0 ? (
                        <p className="text-green-700">
                          🆕 {newSchedules.length} new follow-up(s) ready to create: 
                          {newSchedules.map(s => ` #${s.sequence}`).join(',')}
                        </p>
                      ) : (
                        <p className="text-gray-600">No new follow-ups to create</p>
                      )}
                    </div>
                  </div>
                ) : null}
                
                <Button
                  onClick={handleSaveSchedules}
                  disabled={saveSchedulesMutation.isPending || newSchedules.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                >
                  {saveSchedulesMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Creating Follow-ups...
                    </>
                  ) : newSchedules.length > 0 ? (
                    <>
                      <i className="fas fa-plus mr-2"></i>
                      Create {newSchedules.length} New Follow-up{newSchedules.length > 1 ? 's' : ''}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check mr-2"></i>
                      All Follow-ups Created
                    </>
                  )}
                </Button>
              </>
            );
          })()}
        </div>

        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>• Follow-ups are created incrementally - existing ones won't be affected</p>
          <p>• Created follow-ups are locked and can only be edited individually</p>
          <p>• Follow-ups will be sent automatically after the specified delay</p>
          <p>• Follow-ups are cancelled when the lead replies to any email</p>
          <p>• Each follow-up can have different timing, content, and tone</p>
        </div>
      </CardContent>
    </Card>
  );
}
