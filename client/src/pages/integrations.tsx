import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

interface IntegrationStatus {
  gmail: {
    connected: boolean;
    email: string | null;
  };
  sendgrid: {
    connected: boolean;
    verified: boolean;
  };
}

export default function Integrations() {
  const { isAuthenticated, isLoading } = useAuth();

  const { data: integrationStatus, isLoading: statusLoading } = useQuery<IntegrationStatus>({
    queryKey: ["/api/integrations/status"],
    enabled: isAuthenticated,
  });

  const handleConnectGmail = () => {
    window.location.href = "/api/auth/gmail";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-cog text-white text-2xl animate-spin"></i>
          </div>
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header 
          title="Integrations"
          subtitle="Connect your email services and external tools."
        />
        
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Services</h2>
              <p className="text-gray-600">
                Connect your email provider to start sending real outreach emails.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Gmail Integration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                        <i className="fab fa-google text-white"></i>
                      </div>
                      <div>
                        <CardTitle>Gmail</CardTitle>
                        <CardDescription>Send emails through your Gmail account</CardDescription>
                      </div>
                    </div>
                    {statusLoading ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                    ) : integrationStatus?.gmail?.connected ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>
                    ) : (
                      <Badge variant="secondary">Not Connected</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {integrationStatus?.gmail?.connected ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Connected as: <span className="font-medium">{integrationStatus.gmail.email}</span>
                        </p>
                        <p className="text-xs text-green-600">
                          ✓ Your emails will be sent through Gmail
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600 mb-4">
                          Connect your Gmail account to send professional emails with proper deliverability.
                        </p>
                        <Button 
                          onClick={handleConnectGmail}
                          className="w-full bg-red-500 hover:bg-red-600"
                          data-testid="button-connect-gmail"
                        >
                          <i className="fab fa-google mr-2"></i>
                          Connect Gmail Account
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SendGrid Integration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <i className="fas fa-envelope text-white"></i>
                      </div>
                      <div>
                        <CardTitle>SendGrid</CardTitle>
                        <CardDescription>Professional email delivery service</CardDescription>
                      </div>
                    </div>
                    {statusLoading ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                    ) : integrationStatus?.sendgrid?.connected ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>
                    ) : (
                      <Badge variant="secondary">Not Connected</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {integrationStatus?.sendgrid?.connected ? (
                      <div>
                        <p className="text-xs text-green-600 mb-2">
                          ✓ SendGrid API configured
                        </p>
                        <p className="text-sm text-gray-600">
                          Your emails will be sent through SendGrid's reliable infrastructure.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600 mb-4">
                          SendGrid provides enterprise-grade email delivery with analytics and high deliverability rates.
                        </p>
                        <Button variant="outline" className="w-full" disabled>
                          <i className="fas fa-key mr-2"></i>
                          Configure API Key
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          Contact support to add your SendGrid API key
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Email Service Status</CardTitle>
                <CardDescription>
                  Current configuration for sending emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600">Checking configuration...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {integrationStatus?.gmail?.connected ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <i className="fas fa-check-circle"></i>
                        <span className="font-medium">Gmail is connected and ready</span>
                      </div>
                    ) : integrationStatus?.sendgrid?.connected ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <i className="fas fa-check-circle"></i>
                        <span className="font-medium">SendGrid is configured and ready</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-orange-600">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span className="font-medium">Using mock email service (emails won't be delivered)</span>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600">
                      {integrationStatus?.gmail?.connected || integrationStatus?.sendgrid?.connected 
                        ? "Your outreach emails will be delivered to real recipients."
                        : "Connect Gmail or SendGrid to start sending real emails to your leads."
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}