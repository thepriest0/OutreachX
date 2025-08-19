import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EmailTrackingStatsProps {
  leadId?: string;
}

interface EmailCampaign {
  id: string;
  subject: string;
  status: 'draft' | 'sent' | 'opened' | 'replied' | 'bounced';
  sentAt?: string;
  openedAt?: string;
  repliedAt?: string;
  trackingId?: string;
  isFollowUp: boolean;
  followUpSequence?: number;
}

export default function EmailTrackingStats({ leadId }: EmailTrackingStatsProps) {
  const { data: campaigns = [], isLoading } = useQuery<EmailCampaign[]>({
    queryKey: leadId ? ["/api/email-campaigns", leadId] : ["/api/email-campaigns"],
    queryFn: async () => {
      const params = leadId ? `?leadId=${leadId}` : '';
      const response = await fetch(`/api/email-campaigns${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-700';
      case 'opened': return 'bg-green-100 text-green-700';
      case 'replied': return 'bg-emerald-100 text-emerald-700';
      case 'bounced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return 'fas fa-paper-plane';
      case 'opened': return 'fas fa-envelope-open';
      case 'replied': return 'fas fa-reply';
      case 'bounced': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-clock';
    }
  };

  const stats = {
    total: campaigns.length,
    sent: campaigns.filter(c => ['sent', 'opened', 'replied'].includes(c.status)).length,
    opened: campaigns.filter(c => ['opened', 'replied'].includes(c.status)).length,
    replied: campaigns.filter(c => c.status === 'replied').length,
    followUps: campaigns.filter(c => c.isFollowUp).length,
  };

  const openRate = stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0;
  const replyRate = stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <i className="fas fa-chart-line"></i>
          Email Tracking {leadId && "for Lead"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            <div className="text-sm text-muted-foreground">Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{openRate}%</div>
            <div className="text-sm text-muted-foreground">Open Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{replyRate}%</div>
            <div className="text-sm text-muted-foreground">Reply Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.followUps}</div>
            <div className="text-sm text-muted-foreground">Follow-ups</div>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="space-y-2">
          <h4 className="font-medium">Recent Campaigns</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {campaigns.slice(0, 10).map((campaign) => (
              <div 
                key={campaign.id} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                data-testid={`campaign-${campaign.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{campaign.subject}</p>
                    {campaign.isFollowUp && (
                      <Badge variant="outline" className="text-xs">
                        Follow-up #{campaign.followUpSequence}
                      </Badge>
                    )}
                  </div>
                  {campaign.sentAt && (
                    <p className="text-sm text-muted-foreground">
                      Sent: {new Date(campaign.sentAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Badge className={getStatusColor(campaign.status)}>
                  <i className={`${getStatusIcon(campaign.status)} mr-1 text-xs`}></i>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </Badge>
              </div>
            ))}
            
            {campaigns.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <i className="fas fa-inbox text-4xl mb-2"></i>
                <p>No email campaigns yet</p>
                <p className="text-sm">Create your first campaign to start tracking</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}