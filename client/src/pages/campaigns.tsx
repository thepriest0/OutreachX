import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AIEmailGenerator from "@/components/email/ai-email-generator";
import FollowUpScheduler from "@/components/email/follow-up-scheduler";
import EmailTracker from "@/components/email/email-tracker";
import { Search, Filter, Plus, Trash2, Edit, Send, Clock, Eye, MoreHorizontal, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { EmailCampaign, EmailCampaignWithUser, Lead } from "@shared/schema";

export default function Campaigns() {
  const [showEmailGenerator, setShowEmailGenerator] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [showFollowUpScheduler, setShowFollowUpScheduler] = useState(false);
  const [selectedCampaignForSchedule, setSelectedCampaignForSchedule] = useState<EmailCampaign | null>(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createdByFilter, setCreatedByFilter] = useState<string>("all");
  const [showLeadSelector, setShowLeadSelector] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaignWithUser | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editContent, setEditContent] = useState("");

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Update edit fields when campaign is selected for editing
  useEffect(() => {
    if (editingCampaign && isEditMode) {
      setEditSubject(editingCampaign.subject);
      setEditContent(editingCampaign.content);
    }
  }, [editingCampaign, isEditMode]);

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<EmailCampaignWithUser[]>({
    queryKey: ["/api/campaigns"],
    enabled: !!user,
  });

  const { data: leads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    enabled: !!user,
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return apiRequest("DELETE", `/api/campaigns/${campaignId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "Campaign deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete campaign", variant: "destructive" });
    },
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      // Get the campaign to find the leadId
      const campaign = campaigns?.find(c => c.id === campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }
      return apiRequest("POST", `/api/campaigns/${campaignId}/send`, {
        leadId: campaign.leadId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "Campaign sent successfully" });
    },
    onError: () => {
      toast({ title: "Failed to send campaign", variant: "destructive" });
    },
  });

  // Mark as replied mutation
  const markRepliedMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return apiRequest("POST", `/api/email-campaigns/${campaignId}/mark-replied`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "Marked as replied!" });
    },
    onError: () => {
      toast({ title: "Failed to mark as replied", variant: "destructive" });
    },
  });

  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, data }: { campaignId: string; data: { subject: string; content: string } }) => {
      return apiRequest("PUT", `/api/email-campaigns/${campaignId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "Campaign updated successfully!" });
      setEditingCampaign(null);
      setIsEditMode(false);
    },
    onError: () => {
      toast({ title: "Failed to update campaign", variant: "destructive" });
    },
  });

  const handleUpdateCampaign = () => {
    if (!editingCampaign) return;
    updateCampaignMutation.mutate({
      campaignId: editingCampaign.id,
      data: {
        subject: editSubject,
        content: editContent
      }
    });
  };

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

  // Group campaigns by parent/follow-up relationship
  const groupedCampaigns = () => {
    if (!campaigns) return [];
    
    const parentCampaigns = campaigns.filter(c => !c.isFollowUp);
    const followUpCampaigns = campaigns.filter(c => c.isFollowUp);
    
    return parentCampaigns.map(parent => {
      const relatedFollowUps = followUpCampaigns
        .filter(followUp => followUp.parentEmailId === parent.id)
        .sort((a, b) => (a.followUpSequence || 0) - (b.followUpSequence || 0));
      
      return {
        parent,
        followUps: relatedFollowUps
      };
    });
  };

  // Filter campaigns based on search and status
  const filteredCampaigns = campaigns?.filter((campaign) => {
    const matchesSearch = campaign.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    const matchesCreatedBy = createdByFilter === "all" || campaign.createdBy === createdByFilter;
    return matchesSearch && matchesStatus && matchesCreatedBy;
  }) || [];

  // Filter the grouped campaigns
  const filteredGroupedCampaigns = groupedCampaigns().filter(group => {
    const { parent } = group;
    const lead = leads?.find(l => l.id === parent.leadId);
    
    // Search filter
    const matchesSearch = !searchTerm || 
      parent.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead?.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === "all" || parent.status === statusFilter;
    
    // Created by filter  
    const matchesCreatedBy = createdByFilter === "all" || parent.createdBy === createdByFilter;
    
    return matchesSearch && matchesStatus && matchesCreatedBy;
  });

  // Handle campaign selection
  const handleCampaignSelect = (campaignId: string, checked: boolean) => {
    if (checked) {
      setSelectedCampaigns([...selectedCampaigns, campaignId]);
    } else {
      setSelectedCampaigns(selectedCampaigns.filter(id => id !== campaignId));
    }
  };

  // Handle select all campaigns
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(filteredCampaigns.map(c => c.id));
    } else {
      setSelectedCampaigns([]);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    selectedCampaigns.forEach(id => {
      deleteCampaignMutation.mutate(id);
    });
    setSelectedCampaigns([]);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
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
              <h3 className="text-lg font-medium text-gray-900">Campaign Management</h3>
              {selectedCampaigns.length > 0 && (
                <Badge variant="secondary">
                  {selectedCampaigns.length} selected
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowEmailGenerator(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center space-x-2"
                data-testid="button-generate-email"
              >
                <Mail className="h-4 w-4" />
                <span>Generate AI Email</span>
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg border p-4 mb-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-campaigns"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40" data-testid="select-status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="opened">Opened</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={createdByFilter} onValueChange={setCreatedByFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Added By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {campaigns && Array.from(
                      new Map(
                        campaigns
                          .filter(c => c.createdByUser)
                          .map(c => [c.createdByUser!.id, c.createdByUser!])
                      ).values()
                    ).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedCampaigns.length > 0 && (
                <div className="flex items-center space-x-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" data-testid="button-bulk-delete">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Selected
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Campaigns</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedCampaigns.length} selected campaign(s)? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </div>

          {/* Email Tracking Dashboard */}
          <EmailTracker />

          {/* Campaigns Grid */}
          {campaignsLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading campaigns...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.length > 0 && (
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    checked={selectedCampaigns.length === filteredCampaigns.length}
                    onCheckedChange={handleSelectAll}
                    data-testid="checkbox-select-all"
                  />
                  <span className="text-sm text-gray-600">Select all</span>
                </div>
              )}
              
              <div className="space-y-6">
                {filteredGroupedCampaigns.map((group) => (
                  <div key={group.parent.id} className="space-y-3">
                    {/* Parent Campaign */}
                    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="pt-1">
                            <Checkbox
                              checked={selectedCampaigns.includes(group.parent.id)}
                              onCheckedChange={(checked) => handleCampaignSelect(group.parent.id, !!checked)}
                              data-testid={`checkbox-campaign-${group.parent.id}`}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {/* Header Section */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                                    {group.parent.subject}
                                  </h3>
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    Original Email
                                  </Badge>
                                </div>
                                
                                {/* Status and Tone Row */}
                                <div className="flex items-center space-x-4 mb-3">
                                  <Badge className={getStatusColor(group.parent.status || 'draft')}>
                                    {formatStatus(group.parent.status || 'draft')}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {group.parent.tone.charAt(0).toUpperCase() + group.parent.tone.slice(1)} tone
                                  </span>
                                  {group.parent.createdByUser && (
                                    <span className="text-sm text-gray-500">
                                      by {group.parent.createdByUser.firstName || group.parent.createdByUser.username}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Quick Actions */}
                              <div className="flex items-center space-x-1 ml-4 shrink-0">
                                <Button variant="ghost" size="sm" data-testid={`button-view-${group.parent.id}`} onClick={() => { setEditingCampaign(group.parent); setIsEditMode(false); }}> 
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {group.parent.status === 'draft' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => { setEditingCampaign(group.parent); setIsEditMode(true); }}
                                    data-testid={`button-edit-${group.parent.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" data-testid={`button-delete-${group.parent.id}`}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this campaign? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteCampaignMutation.mutate(group.parent.id)}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                            
                            {/* Recipient Information */}
                            {group.parent.leadId && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                {(() => {
                                  const lead = leads?.find(l => l.id === group.parent.leadId);
                                  return lead ? (
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-medium text-gray-900">{lead.name}</span>
                                          {lead.company && (
                                            <span className="text-sm text-gray-500">at {lead.company}</span>
                                          )}
                                        </div>
                                        <span className="text-sm text-gray-600">{lead.email}</span>
                                      </div>
                                      <Badge variant="secondary" className="text-xs">
                                        {lead.status}
                                      </Badge>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-500">Unknown recipient</span>
                                  );
                                })()}
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {group.parent.status === 'draft' && (
                                  <Button 
                                    size="sm"
                                    onClick={() => sendCampaignMutation.mutate(group.parent.id)}
                                    data-testid={`button-send-${group.parent.id}`}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Email
                                  </Button>
                                )}
                                {(group.parent.status === 'sent' || group.parent.status === 'opened') && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedCampaignForSchedule(group.parent);
                                        setShowFollowUpScheduler(true);
                                      }}
                                      data-testid={`button-schedule-${group.parent.id}`}
                                    >
                                      <Clock className="h-4 w-4 mr-2" />
                                      Schedule Follow-up
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => markRepliedMutation.mutate(group.parent.id)}
                                      data-testid={`button-mark-replied-${group.parent.id}`}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Mark as Replied
                                    </Button>
                                  </>
                                )}
                              </div>
                              
                              {group.parent.createdAt && (
                                <span className="text-xs text-gray-400">
                                  {new Date(group.parent.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Follow-up Campaigns */}
                    {group.followUps.length > 0 && (
                      <div className="ml-8 space-y-2">
                        {group.followUps.map((followUp) => (
                          <Card key={followUp.id} className="hover:shadow-sm transition-shadow border-l-4 border-l-blue-300 bg-blue-50/30">
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-4">
                                <div className="pt-1">
                                  <Checkbox
                                    checked={selectedCampaigns.includes(followUp.id)}
                                    onCheckedChange={(checked) => handleCampaignSelect(followUp.id, !!checked)}
                                    data-testid={`checkbox-campaign-${followUp.id}`}
                                  />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <h4 className="text-md font-medium text-gray-800">
                                          {followUp.subject}
                                        </h4>
                                        <Badge variant="outline" className="text-xs bg-blue-100">
                                          Follow-up #{followUp.followUpSequence}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center space-x-3 mb-2">
                                        <Badge className={getStatusColor(followUp.status || 'draft')} variant="secondary">
                                          {formatStatus(followUp.status || 'draft')}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                          {followUp.tone.charAt(0).toUpperCase() + followUp.tone.slice(1)} tone
                                        </span>
                                      </div>
                                      
                                      {followUp.scheduledAt && (
                                        <div className="text-xs text-gray-500">
                                          Scheduled for: {new Date(followUp.scheduledAt).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-2 ml-4">
                                      <Button variant="ghost" size="sm" onClick={() => { setEditingCampaign(followUp); setIsEditMode(false); }}> 
                                        <Eye className="h-3 w-3 mr-1" />
                                        View
                                      </Button>
                                      {followUp.status === 'draft' && (
                                        <>
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => { setEditingCampaign(followUp); setIsEditMode(true); }}
                                          >
                                            <Edit className="h-3 w-3 mr-1" />
                                            Edit
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => sendCampaignMutation.mutate(followUp.id)}
                                          >
                                            <Send className="h-3 w-3 mr-1" />
                                            Send Follow-up
                                          </Button>
                                        </>
                                      )}
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            Delete
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Follow-up</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete this follow-up campaign?
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteCampaignMutation.mutate(followUp.id)}>
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredGroupedCampaigns.length === 0 && !campaignsLoading && (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || statusFilter !== "all" ? "No campaigns match your filters" : "No campaigns yet"}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || statusFilter !== "all" 
                      ? "Try adjusting your search or filter criteria" 
                      : "Get started by creating your first AI-powered email campaign"
                    }
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Button
                      onClick={() => setShowEmailGenerator(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Create Your First Campaign
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lead Selector Modal */}
        {showLeadSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[70vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Select Leads for Email Campaign</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowLeadSelector(false)}
                    data-testid="button-close-lead-selector"
                  >
                    ×
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    {leads && leads.length > 0 ? (
                      <div className="space-y-2">
                        {leads.map((lead) => (
                          <div key={lead.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              checked={selectedLeads.some(l => l.id === lead.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedLeads([...selectedLeads, lead]);
                                } else {
                                  setSelectedLeads(selectedLeads.filter(l => l.id !== lead.id));
                                }
                              }}
                              data-testid={`checkbox-lead-${lead.id}`}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{lead.name}</div>
                              <div className="text-sm text-gray-500">{lead.company} • {lead.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No leads available. Add some leads first.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {selectedLeads.length} lead(s) selected
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => setShowLeadSelector(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          setShowLeadSelector(false);
                          setShowEmailGenerator(true);
                        }}
                        disabled={selectedLeads.length === 0}
                        data-testid="button-continue-to-generator"
                      >
                        Continue to Email Generator
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Email Generator Modal */}
        {showEmailGenerator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Generate AI Email Campaign</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowEmailGenerator(false)}
                    data-testid="button-close-email-generator"
                  >
                    ×
                  </Button>
                </div>
                <AIEmailGenerator
                  leads={selectedLeads}
                  onClose={() => setShowEmailGenerator(false)}
                  onSuccess={() => {
                    setShowEmailGenerator(false);
                    setSelectedLeads([]);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {showFollowUpScheduler && selectedCampaignForSchedule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Follow-up Campaign Manager</h2>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowFollowUpScheduler(false);
                      setSelectedCampaignForSchedule(null);
                    }}
                    data-testid="button-close-follow-up"
                  >
                    ×
                  </Button>
                </div>
                <FollowUpScheduler
                  campaignId={selectedCampaignForSchedule.id}
                  leadName={leads?.find(l => l.id === selectedCampaignForSchedule.leadId)?.name || 'Lead'}
                  leadCompany={leads?.find(l => l.id === selectedCampaignForSchedule.leadId)?.company || 'Company'}
                  leadRole={leads?.find(l => l.id === selectedCampaignForSchedule.leadId)?.role || 'Decision Maker'}
                  originalTone={selectedCampaignForSchedule.tone || 'professional'}
                  onSuccess={() => {
                    setShowFollowUpScheduler(false);
                    setSelectedCampaignForSchedule(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Edit/View Campaign Modal */}
        {editingCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {isEditMode ? 'Edit Campaign' : 'Campaign Details'}
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => { setEditingCampaign(null); setIsEditMode(false); }}
                  >
                    ×
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject</label>
                    {isEditMode ? (
                      <Input
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        placeholder="Email subject"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded border">
                        {editingCampaign.subject}
                      </div>
                    )}
                  </div>
                  
                  {/* Recipient Information */}
                  {editingCampaign.leadId && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Recipient</label>
                      <div className="p-3 bg-gray-50 rounded border">
                        {(() => {
                          const lead = leads?.find(l => l.id === editingCampaign.leadId);
                          return lead ? (
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">{lead.name}</div>
                              <div className="text-sm text-gray-600">{lead.email}</div>
                              {lead.company && (
                                <div className="text-sm text-gray-500">{lead.company}</div>
                              )}
                              {lead.role && (
                                <div className="text-sm text-gray-500">{lead.role}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">Unknown recipient</span>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Content</label>
                    {isEditMode ? (
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Email content"
                        className="min-h-[200px]"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded border min-h-[200px] whitespace-pre-wrap">
                        {editingCampaign.content}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <Badge className={getStatusColor(editingCampaign.status || 'draft')}>
                        {formatStatus(editingCampaign.status || 'draft')}
                      </Badge>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tone</label>
                      <div className="p-2 bg-gray-50 rounded border">
                        {editingCampaign.tone}
                      </div>
                    </div>
                  </div>
                  {editingCampaign.sentAt && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Sent At</label>
                      <div className="p-2 bg-gray-50 rounded border">
                        {new Date(editingCampaign.sentAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Created By</label>
                    <div className="p-2 bg-gray-50 rounded border">
                      {editingCampaign.createdByUser ? 
                        `${editingCampaign.createdByUser.firstName || ''} ${editingCampaign.createdByUser.lastName || ''}`.trim() || 
                        editingCampaign.createdByUser.username || 'Unknown User'
                        : 'Unknown User'
                      }
                    </div>
                  </div>
                  {isEditMode && (
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => { setIsEditMode(false); setEditingCampaign(null); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateCampaign}
                        disabled={updateCampaignMutation.isPending}
                      >
                        {updateCampaignMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}