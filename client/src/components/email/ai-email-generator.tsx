import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import type { Lead } from "@shared/schema";
import type { EmailGenerationRequest, EmailGenerationResponse } from "@/types";

interface AIEmailGeneratorProps {
  onClose: () => void;
  onSuccess: () => void;
  preselectedLead?: Lead;
}

export default function AIEmailGenerator({ onClose, onSuccess, preselectedLead }: AIEmailGeneratorProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(preselectedLead?.id || "");
  const [selectedTone, setSelectedTone] = useState<"professional" | "casual" | "direct">("professional");
  const [generatedEmail, setGeneratedEmail] = useState<EmailGenerationResponse | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedSubject, setEditedSubject] = useState("");
  
  const { toast } = useToast();

  // Fetch leads for selection
  const { data: leads } = useQuery({
    queryKey: ["/api/leads"],
    enabled: !preselectedLead,
  });

  const selectedLead = preselectedLead || (leads?.find((lead: Lead) => lead.id === selectedLeadId));

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
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to generate email",
        variant: "destructive",
      });
    },
  });

  // Save email campaign mutation
  const saveMutation = useMutation({
    mutationFn: async (emailData: { subject: string; content: string }) => {
      const response = await apiRequest("POST", "/api/email-campaigns", {
        leadId: selectedLeadId,
        subject: emailData.subject,
        content: emailData.content,
        tone: selectedTone,
        isFollowUp: false,
        followUpSequence: 0,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email campaign saved successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to save email campaign",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!selectedLeadId) {
      toast({
        title: "Error",
        description: "Please select a lead first",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      leadId: selectedLeadId,
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <i className="fas fa-robot mr-3 text-secondary-500"></i>
            AI Email Generator
          </DialogTitle>
          <DialogDescription>
            Generate personalized outreach emails using AI based on your lead information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lead Selection */}
          {!preselectedLead && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Lead</label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lead to generate email for" />
                </SelectTrigger>
                <SelectContent>
                  {leads?.map((lead: Lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} - {lead.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected Lead Info */}
          {selectedLead && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {selectedLead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedLead.name}</p>
                    <p className="text-sm text-gray-600">
                      {selectedLead.role || 'Contact'} at {selectedLead.company}
                    </p>
                    <p className="text-xs text-gray-500">{selectedLead.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tone Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Email Tone</label>
            <div className="grid grid-cols-3 gap-3">
              {toneOptions.map((tone) => (
                <Button
                  key={tone.value}
                  variant={selectedTone === tone.value ? "default" : "outline"}
                  onClick={() => setSelectedTone(tone.value)}
                  className={`p-4 h-auto flex-col items-start ${
                    selectedTone === tone.value
                      ? "bg-primary-500 hover:bg-primary-600 text-white"
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
                disabled={!selectedLeadId || generateMutation.isPending}
                className="bg-secondary-500 hover:bg-secondary-600 text-white"
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
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="Email content will appear here..."
                />
              </div>

              {/* Email Preview */}
              <Card className="border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <strong>To:</strong> {selectedLead?.email}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Subject:</strong> {editedSubject}
                    </div>
                    <hr className="border-gray-200" />
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                      {editedContent}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {generatedEmail && (
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={generateMutation.isPending}
                className="text-gray-600 hover:text-gray-800"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Regenerate
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={generateMutation.isPending || saveMutation.isPending}
            >
              Cancel
            </Button>
            
            {generatedEmail && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
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
                  className="bg-primary-500 hover:bg-primary-600"
                  disabled={saveMutation.isPending}
                >
                  <i className="fas fa-paper-plane mr-2"></i>
                  Send Email
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
