import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Zap,
  Calendar,
  Upload,
  Send,
  Sparkles,
  Clock,
  FileText,
  Mail
} from "lucide-react";
import { Link } from "wouter";

const quickActionButtons = [
  {
    id: "new-lead",
    title: "Add Lead",
    description: "Quick lead entry",
    icon: Plus,
    color: "bg-blue-500 hover:bg-blue-600",
    variant: "default" as const
  },
  {
    id: "generate-email",
    title: "AI Email",
    description: "Generate with AI",
    icon: Zap,
    color: "bg-purple-500 hover:bg-purple-600",
    variant: "default" as const,
    badge: "AI"
  },
  {
    id: "schedule-campaign",
    title: "Schedule",
    description: "Plan follow-ups",
    icon: Calendar,
    color: "bg-green-500 hover:bg-green-600",
    variant: "default" as const
  },
  {
    id: "import-leads",
    title: "Import CSV",
    description: "Bulk upload",
    icon: Upload,
    color: "bg-orange-500 hover:bg-orange-600",
    variant: "outline" as const
  }
];

interface NewLeadFormData {
  name: string;
  email: string;
  company: string;
  role: string;
  notes: string;
}

interface GenerateEmailFormData {
  leadId: string;
  tone: "professional" | "casual" | "direct";
  isFollowUp: boolean;
}

export default function QuickActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const [newLeadData, setNewLeadData] = useState<NewLeadFormData>({
    name: "",
    email: "",
    company: "",
    role: "",
    notes: ""
  });

  const [emailData, setEmailData] = useState<GenerateEmailFormData>({
    leadId: "",
    tone: "professional",
    isFollowUp: false
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data: NewLeadFormData) => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create lead");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Lead created successfully!",
      });
      setOpenDialog(null);
      setNewLeadData({
        name: "",
        email: "",
        company: "",
        role: "",
        notes: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate email mutation
  const generateEmailMutation = useMutation({
    mutationFn: async (data: GenerateEmailFormData) => {
      const response = await fetch("/api/ai/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate email");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email Generated!",
        description: "AI has created a personalized email for you.",
      });
      setOpenDialog(null);
      // Here you could open an email compose dialog with the generated content
      console.log("Generated email:", data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAction = (actionId: string) => {
    switch (actionId) {
      case "new-lead":
        setOpenDialog("new-lead");
        break;
      case "generate-email":
        setOpenDialog("generate-email");
        break;
      case "schedule-campaign":
        toast({
          title: "Coming Soon",
          description: "Campaign scheduling feature will be available soon!",
        });
        break;
      case "import-leads":
        // Trigger file input
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".csv";
        fileInput.onchange = handleFileUpload;
        fileInput.click();
        break;
    }
  };

  const handleFileUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/leads/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to import leads");
      }

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      toast({
        title: "Import Successful",
        description: result.message,
      });
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateLead = () => {
    if (!newLeadData.name || !newLeadData.email || !newLeadData.company) {
      toast({
        title: "Missing Information",
        description: "Please fill in name, email, and company fields.",
        variant: "destructive",
      });
      return;
    }

    createLeadMutation.mutate(newLeadData);
  };

  const handleGenerateEmail = () => {
    if (!emailData.leadId) {
      toast({
        title: "No Lead Selected",
        description: "Please select a lead to generate email for.",
        variant: "destructive",
      });
      return;
    }

    generateEmailMutation.mutate(emailData);
  };

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>Quick Actions</span>
        </CardTitle>
        <CardDescription>
          Fast-track your outreach workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActionButtons.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant={action.variant}
              className={`w-full justify-start h-auto py-3 px-4 ${
                action.variant === "default" ? action.color : ""
              }`}
              onClick={() => handleAction(action.id)}
              data-testid={`button-quick-${action.id}`}
            >
              <div className="flex items-center space-x-3 w-full">
                <Icon className="h-4 w-4 shrink-0" />
                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{action.title}</span>
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs opacity-75">{action.description}</div>
                </div>
              </div>
            </Button>
          );
        })}

        {/* Recent Activities */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2 flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Recent</span>
          </h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>3 new leads added today</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>12 emails sent this week</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>2 follow-ups scheduled</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* New Lead Dialog */}
      <Dialog open={openDialog === "new-lead"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Enter lead information to add them to your outreach pipeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={newLeadData.name}
                onChange={(e) => setNewLeadData({ ...newLeadData, name: e.target.value })}
                data-testid="input-lead-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                value={newLeadData.email}
                onChange={(e) => setNewLeadData({ ...newLeadData, email: e.target.value })}
                data-testid="input-lead-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                placeholder="Acme Corp"
                value={newLeadData.company}
                onChange={(e) => setNewLeadData({ ...newLeadData, company: e.target.value })}
                data-testid="input-lead-company"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role/Position</Label>
              <Input
                id="role"
                placeholder="Marketing Director"
                value={newLeadData.role}
                onChange={(e) => setNewLeadData({ ...newLeadData, role: e.target.value })}
                data-testid="input-lead-role"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information about this lead..."
                value={newLeadData.notes}
                onChange={(e) => setNewLeadData({ ...newLeadData, notes: e.target.value })}
                data-testid="textarea-lead-notes"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpenDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateLead}
              disabled={createLeadMutation.isPending}
              data-testid="button-create-lead"
            >
              {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Email Dialog */}
      <Dialog open={openDialog === "generate-email"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <span>Generate AI Email</span>
            </DialogTitle>
            <DialogDescription>
              Let AI create a personalized email for your outreach campaign.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lead">Select Lead</Label>
              <Select value={emailData.leadId} onValueChange={(value) => setEmailData({ ...emailData, leadId: value })}>
                <SelectTrigger data-testid="select-lead">
                  <SelectValue placeholder="Choose a lead to email" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo-lead-1">John Smith - Acme Corp</SelectItem>
                  <SelectItem value="demo-lead-2">Sarah Johnson - TechStart Inc</SelectItem>
                  <SelectItem value="demo-lead-3">Mike Chen - Growth Co</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Email Tone</Label>
              <Select value={emailData.tone} onValueChange={(value: any) => setEmailData({ ...emailData, tone: value })}>
                <SelectTrigger data-testid="select-tone">
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
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpenDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateEmail}
              disabled={generateEmailMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600"
              data-testid="button-generate-email"
            >
              {generateEmailMutation.isPending ? "Generating..." : "Generate Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}