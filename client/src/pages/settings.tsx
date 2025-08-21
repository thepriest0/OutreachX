import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings as SettingsIcon, 
  Mail, 
  Building, 
  Zap, 
  Bell, 
  Shield, 
  Key,
  Database,
  Palette,
  Globe,
  Save,
  AlertTriangle
} from "lucide-react";

interface UserSettings {
  // Email Configuration
  fromName?: string;
  fromEmail?: string;
  emailSignature?: string;
  
  // Company Branding
  companyName?: string;
  companyWebsite?: string;
  companyDescription?: string;
  
  // AI Preferences
  defaultTone?: string;
  aiPersonality?: string;
  
  // Notifications
  emailNotifications?: boolean;
  campaignNotifications?: boolean;
  leadNotifications?: boolean;
  
  // Advanced
  trackingEnabled?: boolean;
  analyticsEnabled?: boolean;
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("email");

  // Fetch user settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/auth/settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/auth/settings");
      return await response.json();
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      const response = await apiRequest("PUT", "/api/auth/settings", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your settings have been successfully saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = (sectionData: Partial<UserSettings>) => {
    updateSettingsMutation.mutate(sectionData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <SettingsIcon className="h-8 w-8" />
            <span>Settings</span>
          </h1>
          <p className="text-muted-foreground">Configure your account preferences and integrations</p>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="email" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Company</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced</span>
            </TabsTrigger>
          </TabsList>

          {/* Email Configuration */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Email Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure how your emails appear to recipients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      defaultValue={settings?.fromName || ""}
                      placeholder="Your Name"
                      onBlur={(e) => handleSave({ fromName: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">This will appear as the sender name</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      defaultValue={settings?.fromEmail || ""}
                      placeholder="your.email@company.com"
                      onBlur={(e) => handleSave({ fromEmail: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Must be connected via Gmail integration</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emailSignature">Email Signature</Label>
                  <Textarea
                    id="emailSignature"
                    defaultValue={settings?.emailSignature || ""}
                    placeholder="Best regards,&#10;Your Name&#10;Your Company&#10;your.email@company.com"
                    rows={4}
                    onBlur={(e) => handleSave({ emailSignature: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">This signature will be added to all outbound emails</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Branding */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Company Information</span>
                </CardTitle>
                <CardDescription>
                  Configure your company branding for AI-generated emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      defaultValue={settings?.companyName || "Nydl Studio"}
                      placeholder="Your Company Name"
                      onBlur={(e) => handleSave({ companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite">Company Website</Label>
                    <Input
                      id="companyWebsite"
                      defaultValue={settings?.companyWebsite || ""}
                      placeholder="https://yourcompany.com"
                      onBlur={(e) => handleSave({ companyWebsite: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyDescription">Company Description</Label>
                  <Textarea
                    id="companyDescription"
                    defaultValue={settings?.companyDescription || "A UI/UX and branding design studio"}
                    placeholder="Brief description of what your company does..."
                    rows={3}
                    onBlur={(e) => handleSave({ companyDescription: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Used by AI to better represent your company in emails</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Preferences */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>AI Preferences</span>
                </CardTitle>
                <CardDescription>
                  Customize how AI generates emails for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultTone">Default Email Tone</Label>
                    <Select 
                      defaultValue={settings?.defaultTone || "professional"}
                      onValueChange={(value) => handleSave({ defaultTone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>AI Status</Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Zap className="h-3 w-3 mr-1" />
                        Gemini AI Active
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="aiPersonality">AI Personality</Label>
                  <Textarea
                    id="aiPersonality"
                    defaultValue={settings?.aiPersonality || "Professional, helpful, and results-oriented"}
                    placeholder="Describe how you want the AI to represent you in emails..."
                    rows={3}
                    onBlur={(e) => handleSave({ aiPersonality: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">This helps AI match your communication style</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive notifications about email activity</p>
                    </div>
                    <Switch
                      defaultChecked={settings?.emailNotifications ?? true}
                      onCheckedChange={(checked) => handleSave({ emailNotifications: checked })}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Campaign Notifications</Label>
                      <p className="text-xs text-muted-foreground">Get notified when campaigns are sent or completed</p>
                    </div>
                    <Switch
                      defaultChecked={settings?.campaignNotifications ?? true}
                      onCheckedChange={(checked) => handleSave({ campaignNotifications: checked })}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Lead Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive alerts when leads reply or take action</p>
                    </div>
                    <Switch
                      defaultChecked={settings?.leadNotifications ?? true}
                      onCheckedChange={(checked) => handleSave({ leadNotifications: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Advanced Settings</span>
                </CardTitle>
                <CardDescription>
                  Advanced configuration options for power users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Tracking</Label>
                      <p className="text-xs text-muted-foreground">Track email opens and clicks</p>
                    </div>
                    <Switch
                      defaultChecked={settings?.trackingEnabled ?? true}
                      onCheckedChange={(checked) => handleSave({ trackingEnabled: checked })}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Analytics Collection</Label>
                      <p className="text-xs text-muted-foreground">Collect performance analytics and insights</p>
                    </div>
                    <Switch
                      defaultChecked={settings?.analyticsEnabled ?? true}
                      onCheckedChange={(checked) => handleSave({ analyticsEnabled: checked })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>Data Management</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                    <Button variant="outline" className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
