import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export default function GmailIntegration() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const { toast } = useToast();

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    try {
      // Redirect to Gmail OAuth flow
      window.location.href = '/api/auth/gmail';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate Gmail connection",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const checkConnectionStatus = async () => {
    setConnectionStatus('checking');
    try {
      // In a real app, you'd check if Gmail tokens are valid
      // For now, we'll check if environment variables suggest it's configured
      const response = await fetch('/api/auth/gmail/status', {
        credentials: 'include',
      });
      
      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  // Check status on component mount
  useState(() => {
    checkConnectionStatus();
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <i className="fab fa-google text-red-500"></i>
            Gmail Integration
          </CardTitle>
          <Badge 
            variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
            className={connectionStatus === 'connected' ? 'bg-green-100 text-green-700' : ''}
          >
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'checking' ? 'Checking...' : 'Not Connected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionStatus === 'disconnected' && (
          <Alert>
            <i className="fas fa-info-circle h-4 w-4"></i>
            <AlertDescription>
              Connect your Gmail account to send emails directly from OutreachX. 
              You'll need to set up Gmail API credentials first.
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === 'connected' && (
          <Alert className="border-green-200 bg-green-50">
            <i className="fas fa-check-circle h-4 w-4 text-green-600"></i>
            <AlertDescription className="text-green-700">
              Gmail is connected and ready to send emails. All outreach emails will be sent through your Gmail account.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <h4 className="font-medium">Setup Instructions:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Go to Google Cloud Console and create a project</li>
            <li>Enable the Gmail API for your project</li>
            <li>Create OAuth 2.0 credentials</li>
            <li>Set the redirect URI to: <code className="bg-muted px-1 rounded">{window.location.origin}/api/auth/gmail/callback</code></li>
            <li>Add your credentials as environment variables</li>
          </ol>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleConnectGmail}
            disabled={isConnecting || connectionStatus === 'connected'}
            className="flex-1"
            data-testid="button-connect-gmail"
          >
            {isConnecting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Connecting...
              </>
            ) : connectionStatus === 'connected' ? (
              <>
                <i className="fas fa-check mr-2"></i>
                Connected to Gmail
              </>
            ) : (
              <>
                <i className="fab fa-google mr-2"></i>
                Connect Gmail
              </>
            )}
          </Button>

          {connectionStatus === 'connected' && (
            <Button
              onClick={checkConnectionStatus}
              variant="outline"
              data-testid="button-refresh-status"
            >
              <i className="fas fa-refresh mr-2"></i>
              Refresh
            </Button>
          )}
        </div>

        {connectionStatus === 'disconnected' && (
          <div className="text-xs text-muted-foreground">
            <p><strong>Required Environment Variables:</strong></p>
            <ul className="mt-1 space-y-1">
              <li>• GMAIL_CLIENT_ID</li>
              <li>• GMAIL_CLIENT_SECRET</li>
              <li>• GMAIL_REFRESH_TOKEN (obtained after first auth)</li>
              <li>• GMAIL_ACCESS_TOKEN (optional, will be refreshed automatically)</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}