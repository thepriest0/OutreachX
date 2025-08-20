import { storage } from "../storage";

export class EmailTrackingService {
  async trackEmailOpen(trackingId: string): Promise<void> {
    try {
      const [campaignId] = trackingId.split('_');
      
      await storage.updateEmailCampaign(campaignId, {
        status: 'opened',
      });
      
      console.log(`Email opened: Campaign ${campaignId}`);
    } catch (error) {
      console.error('Error tracking email open:', error);
    }
  }

  async trackEmailClick(trackingId: string, originalUrl: string): Promise<string> {
    try {
      const [campaignId] = trackingId.split('_');
      
      await storage.updateEmailCampaign(campaignId, {
        status: 'clicked',
      });
      
      console.log(`Email link clicked: Campaign ${campaignId}`);
      return originalUrl;
    } catch (error) {
      console.error('Error tracking email click:', error);
      return originalUrl;
    }
  }

  async markEmailReplied(messageId: string): Promise<void> {
    try {
      // Find campaign by message ID or campaign ID
      const campaigns = await storage.getEmailCampaigns();
      let campaign = campaigns.find(c => c.messageId === messageId);
      
      // If not found by messageId, try by campaign ID
      if (!campaign) {
        campaign = campaigns.find(c => c.id === messageId);
      }
      
      if (campaign) {
        await storage.updateEmailCampaign(campaign.id, {
          status: 'replied',
          repliedAt: new Date(),
        });
        
        // Cancel any scheduled follow-ups for this lead
        if (campaign.leadId) {
          await storage.cancelScheduledFollowUps(campaign.leadId);
          console.log(`Cancelled all follow-ups for lead ${campaign.leadId} due to reply`);
        }
        
        console.log(`Email replied: Campaign ${campaign.id}`);
      } else {
        console.log(`No campaign found for messageId: ${messageId}`);
      }
    } catch (error) {
      console.error('Error marking email as replied:', error);
    }
  }
}

export const emailTrackingService = new EmailTrackingService();