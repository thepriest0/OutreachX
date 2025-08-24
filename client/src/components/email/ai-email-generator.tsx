import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import type { Lead } from "@shared/schema";
import type { EmailGenerationRequest, EmailGenerationResponse } from "@/types";

interface AIEmailGeneratorProps {
  onClose: () => void;
  onSuccess: () => void;
  preselectedLead?: Lead;
  leads?: Lead[];
}

export default function AIEmailGenerator({ onClose, onSuccess, preselectedLead, leads: preselectedLeads }: AIEmailGeneratorProps) {
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>(preselectedLead ? [preselectedLead.id] : []);
  const [selectedTone, setSelectedTone] = useState<"professional" | "casual" | "direct">("professional");
  const [generatedEmail, setGeneratedEmail] = useState<EmailGenerationResponse | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedSubject, setEditedSubject] = useState("");
  const [leadSelectorOpen, setLeadSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();

  // Fetch leads for selection
  const { data: fetchedLeads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    enabled: !preselectedLead && (!preselectedLeads || preselectedLeads.length === 0),
  });

  const availableLeads: Lead[] = (preselectedLeads && preselectedLeads.length > 0) ? preselectedLeads : (fetchedLeads || []);
  const selectedLeads = availableLeads.filter((lead: Lead) => selectedLeadIds.includes(lead.id));
  const primaryLead = selectedLeads[0]; // Use first selected lead for generation

  // Filter leads based on search term
  const filteredLeads = availableLeads.filter((lead: Lead) =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate email mutation
  const generateMutation = useMutation({
    mutationFn: async (request: EmailGenerationRequest) => {
      const response = await apiRequest("POST", "/api/ai/generate-email", request);
      return response.json();
    },
    onSuccess: (data: EmailGenerationResponse) => {
      setGeneratedEmail(data);
      setEditedSubject(data.subject);
      setEditedContent(data.content);
      toast({
        title: "Success",
        description: "Email generated successfully",
      });
    },
    onError: (error) => {
      if (false) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate email",
        variant: "destructive",
      });
    },
  });

  // Save email campaigns for multiple leads mutation
  const saveMutation = useMutation({
    mutationFn: async (emailData: { subject: string; content: string }) => {
      // Create campaigns for all selected leads
      const promises = selectedLeadIds.map(leadId => 
        apiRequest("POST", "/api/email-campaigns", {
          leadId: leadId,
          subject: emailData.subject,
          content: emailData.content,
          tone: selectedTone,
          isFollowUp: false,
          followUpSequence: 0,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Email campaigns created for ${selectedLeadIds.length} lead(s)`,
      });
      onSuccess();
    },
    onError: (error) => {
      if (false) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save email campaigns",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (selectedLeadIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one lead first",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      leadId: primaryLead.id,
      tone: selectedTone,
      isFollowUp: false,
    });
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleSave = () => {
    if (!editedSubject || !editedContent) {
      toast({
        title: "Error",
        description: "Please ensure both subject and content are filled",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      subject: editedSubject,
      content: editedContent,
    });
  };

  // Send email mutation for multiple leads
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      // First create campaigns for all selected leads
      const campaignPromises = selectedLeadIds.map(leadId => 
        apiRequest("POST", "/api/email-campaigns", {
          leadId: leadId,
          subject: editedSubject,
          content: editedContent,
          tone: selectedTone,
          isFollowUp: false,
          followUpSequence: 0,
        })
      );
      
      const campaignResponses = await Promise.all(campaignPromises);
      const campaigns = await Promise.all(campaignResponses.map(r => r.json()));

      // Then send all the emails
      const sendPromises = campaigns.map(campaign => 
        apiRequest("POST", `/api/campaigns/${campaign.id}/send`, {
          leadId: campaign.leadId
        })
      );
      
      return Promise.all(sendPromises);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Emails sent successfully to ${selectedLeadIds.length} lead(s)!`,
      });
      onSuccess();
    },
    onError: (error) => {
      if (false) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = () => {
    if (!editedSubject || !editedContent) {
      toast({
        title: "Error",
        description: "Please ensure both subject and content are filled",
        variant: "destructive",
      });
      return;
    }

    if (selectedLeadIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one lead first",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate();
  };

  const toneOptions = [
    {
      value: "professional" as const,
      label: "Professional",
      description: "Formal and business-oriented",
    },
    {
      value: "casual" as const,
      label: "Casual",
      description: "Friendly and conversational",
    },
    {
      value: "direct" as const,
      label: "Direct",
      description: "Straight to the point",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-card w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl rounded-t-lg sm:rounded-lg overflow-hidden sm:overflow-auto">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center">
              <i className="fas fa-robot mr-3 text-secondary-500"></i>
              AI Email Generator
            </h2>
            <Button
              variant="ghost"
              onClick={onClose}
              data-testid="button-close-email-generator"
            >
              ×
            </Button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
            {/* Lead Selection */}
            {!preselectedLead && (!preselectedLeads || preselectedLeads.length === 0) && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select Leads</label>
                <Popover open={leadSelectorOpen} onOpenChange={setLeadSelectorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={leadSelectorOpen}
                      className="w-full justify-between h-auto min-h-[40px] p-3"
                    >
                      <div className="flex flex-wrap gap-1">
                          {selectedLeads.length === 0 ? (
                          <span className="text-muted-foreground">Select leads...</span>
                        ) : (
                          <>
                            {selectedLeads.slice(0, 2).map((lead: Lead) => (
                              <Badge key={lead.id} variant="secondary" className="mr-1">
                                {lead.name}
                                <X
                                  className="ml-1 h-3 w-3 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLeadIds(selectedLeadIds.filter(id => id !== lead.id));
                                  }}
                                />
                              </Badge>
                            ))}
                            {selectedLeads.length > 2 && (
                              <Badge variant="secondary">
                                +{selectedLeads.length - 2} more
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full sm:w-[400px] max-h-[60vh] p-0 overflow-auto">
                    <Command>
                      <CommandInput 
                        placeholder="Search leads..." 
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>No leads found.</CommandEmpty>
                        <CommandGroup>
                          {filteredLeads.map((lead: Lead) => (
                            <CommandItem
                              key={lead.id}
                              value={lead.id}
                              onSelect={() => {
                                const isSelected = selectedLeadIds.includes(lead.id);
                                if (isSelected) {
                                  setSelectedLeadIds(selectedLeadIds.filter(id => id !== lead.id));
                                } else {
                                  setSelectedLeadIds([...selectedLeadIds, lead.id]);
                                }
                              }}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedLeadIds.includes(lead.id)}
                                onChange={() => {}} // Handled by parent onSelect
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{lead.name}</div>
                                <div className="text-xs text-gray-500">
                                  {lead.company} • {lead.email}
                                </div>
                              </div>
                              {selectedLeadIds.includes(lead.id) && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedLeads.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedLeads.length} lead(s) selected
                  </p>
                )}
              </div>
            )}

            {/* Selected Leads Info */}
            {selectedLeads.length > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-3">
                  <div className="">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Selected Leads ({selectedLeads.length})</span>
                    </div>
                    <div className="divide-y divide-blue-100">
                      {selectedLeads.map((lead: Lead) => (
                        <div key={lead.id} className="flex items-center space-x-3 py-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-medium">
                              {lead.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{lead.name}</p>
                            <p className="text-xs text-gray-600 truncate">
                              {lead.role || 'Contact'}{lead.company ? ` at ${lead.company}` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tone Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Email Tone</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {toneOptions.map((tone) => (
                  <Button
                    key={tone.value}
                    variant={selectedTone === tone.value ? "default" : "outline"}
                    onClick={() => setSelectedTone(tone.value)}
                    className={`p-4 h-auto flex-col items-start ${
                      selectedTone === tone.value
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <span className="font-medium">{tone.label}</span>
                    <span className="text-xs opacity-80">{tone.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            {!generatedEmail && (
              <div className="text-center">
                <Button
                  onClick={handleGenerate}
                  disabled={selectedLeadIds.length === 0 || generateMutation.isPending}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  {generateMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic mr-2"></i>
                      Generate AI Email
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Generated Email */}
            {generatedEmail && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Generated Email</h3>
                  <Badge variant="outline" className="text-secondary-600 border-secondary-300">
                    {selectedTone.charAt(0).toUpperCase() + selectedTone.slice(1)} tone
                  </Badge>
                </div>

                {/* Subject Line */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Subject Line</label>
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Email Content */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Content</label>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[200px] sm:min-h-[300px] text-sm"
                    placeholder="Email content will appear here..."
                  />
                </div>

                {/* Email Preview */}
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 truncate">
                        <strong>To:</strong> {selectedLeads.map(lead => lead.email).join(', ')}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        <strong>Subject:</strong> {editedSubject}
                      </div>
                      <hr className="border-gray-200" />
                      <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                        {editedContent}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 border-t">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-auto">
                {generatedEmail && (
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={generateMutation.isPending}
                    className="w-full sm:w-auto text-gray-600 hover:text-gray-800"
                  >
                    <i className="fas fa-sync-alt mr-2"></i>
                    Regenerate
                  </Button>
                )}
              </div>

              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center sm:space-x-3 gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={generateMutation.isPending || saveMutation.isPending || sendEmailMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>

                {generatedEmail && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleSave}
                      disabled={saveMutation.isPending || sendEmailMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {saveMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i>
                          Save Draft
                        </>
                      )}
                    </Button>

                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                      onClick={handleSendEmail}
                      disabled={saveMutation.isPending || sendEmailMutation.isPending}
                    >
                      {sendEmailMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane mr-2"></i>
                          Send Email
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}