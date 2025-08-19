import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import GmailIntegration from "@/components/email/gmail-integration";
import EmailTrackingStats from "@/components/dashboard/email-tracking-stats";

export default function IntegrationPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Integration Hub</h1>
        <p className="text-muted-foreground">
          Connect external services and configure email settings for your outreach campaigns
        </p>
      </div>

      <Tabs defaultValue="gmail" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gmail">Gmail Integration</TabsTrigger>
          <TabsTrigger value="tracking">Email Tracking</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="gmail" className="space-y-6">
          <div className="grid gap-6">
            <GmailIntegration />
            
            <Card>
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <i className="fas fa-info-circle h-4 w-4"></i>
                  <AlertDescription>
                    Your email settings are configured through environment variables for security:
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">From Name</label>
                      <div className="mt-1 p-2 bg-muted rounded text-sm">
                        {process.env.FROM_NAME || 'OutreachX Team'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">From Email</label>
                      <div className="mt-1 p-2 bg-muted rounded text-sm">
                        {process.env.FROM_EMAIL || 'Not configured'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <div className="grid gap-6">
            <EmailTrackingStats />
            
            <Card>
              <CardHeader>
                <CardTitle>Tracking Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-check text-green-600 text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-medium">Email Open Tracking</h4>
                      <p className="text-sm text-muted-foreground">
                        Track when recipients open your emails with invisible tracking pixels
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-check text-green-600 text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-medium">Link Click Tracking</h4>
                      <p className="text-sm text-muted-foreground">
                        Monitor which links recipients click in your emails
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-check text-green-600 text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-medium">Reply Detection</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically detect replies and cancel follow-up sequences
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-check text-green-600 text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-medium">Delivery Status</h4>
                      <p className="text-sm text-muted-foreground">
                        Monitor email delivery status and bounce notifications
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Follow-up Automation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <i className="fas fa-robot h-4 w-4"></i>
                  <AlertDescription>
                    Automated follow-up sequences are running in the background. 
                    Follow-ups are automatically cancelled when a lead replies.
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-clock text-blue-600 text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-medium">Scheduled Follow-ups</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically send follow-up emails after specified delays (1-30 days)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-brain text-purple-600 text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-medium">AI-Generated Content</h4>
                      <p className="text-sm text-muted-foreground">
                        Follow-ups use contextual AI generation based on previous emails
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-stop text-orange-600 text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-medium">Smart Cancellation</h4>
                      <p className="text-sm text-muted-foreground">
                        Follow-up sequences stop automatically when leads engage or reply
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-chart-line text-green-600 text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-medium">Performance Tracking</h4>
                      <p className="text-sm text-muted-foreground">
                        Monitor response rates and optimize your follow-up timing
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Maximum follow-ups per lead:</span>
                    <span className="font-medium">3 emails</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Follow-up delay range:</span>
                    <span className="font-medium">1-30 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto-cancellation on reply:</span>
                    <span className="font-medium text-green-600">✓ Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI content generation:</span>
                    <span className="font-medium text-green-600">✓ Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email tracking:</span>
                    <span className="font-medium text-green-600">✓ Enabled</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}