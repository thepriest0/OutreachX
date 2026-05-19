import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Sparkles, Send, RefreshCw, ChevronDown, Check, User, Building, Mail } from "lucide-react";
import type { Lead } from "@shared/schema";

interface AIEmailGeneratorProps {
  leads?: Lead[];
  preselectedLead?: Lead | null;
  onClose: () => void;
  onSuccess: () => void;
}

type Tone = "professional" | "casual" | "direct";

export default function AIEmailGenerator({
  leads = [],
  preselectedLead,
  onClose,
  onSuccess,
}: AIEmailGeneratorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // If preselectedLead is provided (from leads page), use it directly
  const [selectedLead, setSelectedLead] = useState<Lead | null>(preselectedLead ?? null);
  const [tone, setTone] = useState<Tone>("professional");
  const [generatedSubject, setGeneratedSubject] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [leadPickerOpen, setLeadPickerOpen] = useState(false);
  const [step, setStep] = useState<"configure" | "review">("configure");
  const [includeResume, setIncludeResume] = useState(true);
  const [isJobApplication, setIsJobApplication] = useState(false);

  // Fetch leads if not provided
  const { data: fetchedLeads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    enabled: !preselectedLead && leads.length === 0,
  });

  const availableLeads = preselectedLead
    ? [preselectedLead]
    : leads.length > 0
    ? leads
    : fetchedLeads ?? [];

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLead) throw new Error("No lead selected");
      const res = await apiRequest("POST", "/api/ai/generate-email", {
        leadId: selectedLead.id,
        tone,
        isJobApplication,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedSubject(data.subject ?? "");
      setGeneratedContent(data.content ?? data.body ?? "");
      setStep("review");
    },
    onError: (err: any) => {
      toast({
        title: "Generation failed",
        description: err.message ?? "Could not generate email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLead) throw new Error("No lead selected");
      const res = await apiRequest("POST", "/api/email-campaigns", {
        leadId: selectedLead.id,
        subject: generatedSubject,
        content: generatedContent,
        tone,
        status: "draft",
        isFollowUp: false,
        followUpSequence: 0,
        includeResume,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Campaign saved!", description: "Email draft saved to campaigns." });
      onSuccess();
    },
    onError: (err: any) => {
      toast({
        title: "Save failed",
        description: err.message ?? "Could not save campaign.",
        variant: "destructive",
      });
    },
  });

  const sendDirectlyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLead) throw new Error("No lead selected");
      
      // 1. First save as draft
      const draftRes = await apiRequest("POST", "/api/email-campaigns", {
        leadId: selectedLead.id,
        subject: generatedSubject,
        content: generatedContent,
        tone,
        status: "draft",
        isFollowUp: false,
        followUpSequence: 0,
        includeResume,
      });
      const draft = await draftRes.json();
      
      // 2. Then immediately send it
      const sendRes = await apiRequest("POST", `/api/campaigns/${draft.id}/send`, {
        leadId: selectedLead.id,
        includeResume
      });
      return sendRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Email sent!", description: "Your email has been successfully sent." });
      onSuccess();
    },
    onError: (err: any) => {
      toast({
        title: "Send failed",
        description: err.message ?? "Could not send email.",
        variant: "destructive",
      });
    },
  });

  const toneLabels: Record<Tone, { label: string; desc: string }> = {
    professional: { label: "Professional", desc: "Formal, business-focused tone" },
    casual: { label: "Casual", desc: "Friendly, conversational tone" },
    direct: { label: "Direct", desc: "Short, straight-to-the-point" },
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Email Generator
          </DialogTitle>
          <DialogDescription>
            {step === "configure"
              ? "Select a lead and tone to generate a personalized email."
              : "Review and edit the generated email before saving."}
          </DialogDescription>
        </DialogHeader>

        {step === "configure" && (
          <div className="space-y-5 py-2">
            {/* Lead selector — hidden if preselected */}
            {!preselectedLead && (
              <div className="space-y-2">
                <Label>Select Lead</Label>
                <Popover open={leadPickerOpen} onOpenChange={setLeadPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={leadPickerOpen}
                      className="w-full justify-between"
                    >
                      {selectedLead ? (
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {selectedLead.name} — {selectedLead.company?.trim() ? selectedLead.company : "Not provided"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Choose a lead…</span>
                      )}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search leads…" />
                      <CommandEmpty>No leads found.</CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {availableLeads.map((lead) => (
                          <CommandItem
                            key={lead.id}
                            value={`${lead.name} ${lead.company || ""} ${lead.email}`}
                            onSelect={() => {
                              setSelectedLead(lead);
                              setLeadPickerOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedLead?.id === lead.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <div>
                              <p className="font-medium text-sm">{lead.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {lead.company ? `${lead.company} · ${lead.email}` : lead.email}
                              </p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Selected lead preview */}
            {selectedLead && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {selectedLead.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{selectedLead.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        {selectedLead.company?.trim() ? (
                          <>
                            <Building className="h-3 w-3" /> {selectedLead.company}
                          </>
                        ) : (
                          <span>Company not provided</span>
                        )}
                        {selectedLead.role && ` · ${selectedLead.role}`}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {selectedLead.email}
                      </p>
                      {selectedLead.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Notes: {selectedLead.notes}
                        </p>
                      )}
                    </div>
                    <Badge
                      className="ml-auto shrink-0 capitalize text-xs"
                      variant="secondary"
                    >
                      {selectedLead.status ?? "new"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tone selection */}
            <div className="space-y-2">
              <Label>Email Tone</Label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(toneLabels) as Tone[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      tone === t
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium text-sm">{toneLabels[t].label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{toneLabels[t].desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="job-application-mode"
                checked={isJobApplication}
                onCheckedChange={(checked) => setIsJobApplication(!!checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="job-application-mode"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Job application mode
                </label>
                <p className="text-xs text-muted-foreground">
                  Tailor the email as a formal job application instead of a service pitch.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={generatedSubject}
                onChange={(e) => setGeneratedSubject(e.target.value)}
                placeholder="Email subject…"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Body</Label>
              <Textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={14}
                className="font-mono text-sm resize-none"
                placeholder="Email content…"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2 border-t">
              <Checkbox
                id="include-resume"
                checked={includeResume}
                onCheckedChange={(c) => setIncludeResume(!!c)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="include-resume"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Attach Resume PDF
                </label>
                <p className="text-xs text-muted-foreground">
                  Includes Oladimeji_Abubakar_Resume.pdf as an attachment.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          {step === "review" && (
            <Button
              variant="outline"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${generateMutation.isPending ? "animate-spin" : ""}`}
              />
              Regenerate
            </Button>
          )}

          {step === "configure" && (
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!selectedLead || generateMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              <Sparkles
                className={`h-4 w-4 mr-2 ${generateMutation.isPending ? "animate-pulse" : ""}`}
              />
              {generateMutation.isPending ? "Generating…" : "Generate Email"}
            </Button>
          )}

          {step === "review" && (
            <>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || sendDirectlyMutation.isPending || !generatedSubject || !generatedContent}
                variant="secondary"
              >
                Save Draft
              </Button>
              <Button
                onClick={() => sendDirectlyMutation.mutate()}
                disabled={saveMutation.isPending || sendDirectlyMutation.isPending || !generatedSubject || !generatedContent}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendDirectlyMutation.isPending ? "Sending…" : "Send Directly"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
