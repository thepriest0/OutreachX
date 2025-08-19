import { storage } from "../storage";

export class EmailTrackingService {
  async trackEmailOpen(trackingId: string): Promise<void> {
    try {
      const campaign = await storage.getEmailCampaignByTrackingId(trackingId);
      if (campaign && campaign.status === 'sent') {
        await storage.updateEmailCampaign(campaign.id, {
          status: 'opened',
        });
        console.log(`Email opened: Campaign ${campaign.id}`);
      }
    } catch (error) {
      console.error('Error tracking email open:', error);
    }
  }

  async trackEmailClick(trackingId: string, originalUrl: string): Promise<string> {
    try {
      const campaign = await storage.getEmailCampaignByTrackingId(trackingId);
      if (campaign) {
        // For now, we don't update status on click since we already track opens
        // In the future, you could add a separate clicks tracking table
        console.log(`Email link clicked: Campaign ${campaign.id} -> ${originalUrl}`);
      }
      return originalUrl;
    } catch (error) {
      console.error('Error tracking email click:', error);
      return originalUrl;
    }
  }

  async markEmailReplied(messageId: string): Promise<void> {
    try {
      // Find campaign by message ID
      const campaigns = await storage.getEmailCampaigns();
      const campaign = campaigns.find(c => c.messageId === messageId);
      
      if (campaign) {
        await storage.updateEmailCampaign(campaign.id, {
          status: 'replied',
        });
        
        // Cancel any scheduled follow-ups for this lead
        if (campaign.leadId) {
          await storage.cancelScheduledFollowUps(campaign.leadId);
        }
        
        console.log(`Email replied: Campaign ${campaign.id}`);
      }
    } catch (error) {
      console.error('Error marking email as replied:', error);
    }
  }
}

export const emailTrackingService = new EmailTrackingService();