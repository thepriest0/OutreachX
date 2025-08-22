import cron from 'node-cron';
import { storage } from '../storage';
import { emailService } from './emailService';
import { generateFollowUpEmail } from './gemini';

export class FollowUpScheduler {
  private static instance: FollowUpScheduler;
  private isRunning = false;

  private constructor() {}

  static getInstance(): FollowUpScheduler {
    if (!FollowUpScheduler.instance) {
      FollowUpScheduler.instance = new FollowUpScheduler();
    }
    return FollowUpScheduler.instance;
  }

  start(): void {
    if (this.isRunning) return;

    // Run every minute to check for scheduled follow-ups (especially for minute-based testing)
    cron.schedule('* * * * *', async () => {
      await this.processScheduledFollowUps();
    });

    this.isRunning = true;
    console.log('Follow-up scheduler started - checking every minute for scheduled emails (Nigerian timezone)');
  }

  stop(): void {
    this.isRunning = false;
    console.log('Follow-up scheduler stopped');
  }

  async scheduleFollowUp(
    parentCampaignId: string,
    delayDays: number,
    userId: string,
    delayMinutes?: number
  ): Promise<string> {
    const parentCampaign = await storage.getEmailCampaignById(parentCampaignId);
    if (!parentCampaign || !parentCampaign.leadId) {
      throw new Error('Parent campaign not found');
    }

    const lead = await storage.getLeadById(parentCampaign.leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Get user information for personalization
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if we already have 3 follow-ups for this lead
    const existingFollowUps = await storage.getFollowUpCampaignsForLead(parentCampaign.leadId);
    if (existingFollowUps.length >= 3) {
      throw new Error('Maximum of 3 follow-ups per lead already reached');
    }

    // Check if parent campaign was already replied to
    if (parentCampaign.status === 'replied' || parentCampaign.repliedAt) {
      throw new Error('Cannot schedule follow-up for a campaign that has been replied to');
    }

    // Create sender name from user's first and last name
    const senderName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
    const senderCompany = "Nydl Studio";

    // Generate follow-up email content
    const followUpEmail = await generateFollowUpEmail({
      name: lead.name,
      role: lead.role || 'Decision Maker',
      company: lead.company,
      tone: parentCampaign.tone,
      isFollowUp: true,
      previousEmailContent: parentCampaign.content,
      senderName,
      senderCompany,
      notes: lead.notes || undefined
    });

    // Calculate scheduled time in West Africa Time (Nigeria - UTC+1)
    const scheduledAt = new Date();
    
    if (delayMinutes && delayMinutes > 0) {
      // For minute delays (testing purposes)
      scheduledAt.setMinutes(scheduledAt.getMinutes() + delayMinutes);
      console.log(`Scheduling follow-up for ${delayMinutes} minutes from now (Nigerian time): ${scheduledAt.toString()}`);
      console.log(`UTC equivalent: ${scheduledAt.toISOString()}`);
    } else {
      // For day delays (production use)
      scheduledAt.setDate(scheduledAt.getDate() + delayDays);
      console.log(`Scheduling follow-up for ${delayDays} days from now (Nigerian time): ${scheduledAt.toString()}`);
      console.log(`UTC equivalent: ${scheduledAt.toISOString()}`);
    }

    // Create follow-up campaign
    const followUpCampaign = await storage.createEmailCampaign({
      leadId: parentCampaign.leadId,
      subject: followUpEmail.subject,
      content: followUpEmail.content,
      tone: parentCampaign.tone,
      status: 'draft',
      isFollowUp: true,
      followUpSequence: (parentCampaign.followUpSequence || 0) + 1,
      followUpDelay: delayDays,
      delayMinutes: delayMinutes,
      parentEmailId: parentCampaignId,
      scheduledAt,
      createdBy: userId,
    });

    console.log(`Follow-up #${followUpCampaign.followUpSequence} scheduled for ${scheduledAt.toISOString()}`);
    return followUpCampaign.id;
  }

  private async processScheduledFollowUps(): Promise<void> {
    try {
      // Use local time (Nigerian time) for processing
      const now = new Date();
      console.log(`Checking for scheduled follow-ups at ${now.toString()} (Nigerian time)`);
      console.log(`UTC equivalent: ${now.toISOString()}`);
      
      const scheduledCampaigns = await storage.getScheduledEmailCampaigns(now);
      console.log(`Found ${scheduledCampaigns.length} scheduled campaigns ready to send`);

      for (const campaign of scheduledCampaigns) {
        if (!campaign.scheduledAt) {
          console.log(`Skipping campaign ${campaign.id} - no scheduled time`);
          continue;
        }
        
        const scheduledTime = new Date(campaign.scheduledAt);
        console.log(`Processing campaign ${campaign.id} scheduled for ${scheduledTime.toString()} (Nigerian time)`);
        await this.processScheduledCampaign(campaign);
      }
    } catch (error) {
      console.error('Error processing scheduled follow-ups:', error);
    }
  }

  private async processScheduledCampaign(campaign: any): Promise<void> {
    try {
      // Check if parent email was replied to
      if (campaign.parentEmailId) {
        const parentCampaign = await storage.getEmailCampaignById(campaign.parentEmailId);
        if (parentCampaign?.repliedAt) {
          console.log(`Skipping follow-up ${campaign.id} - parent email was replied to`);
          // Mark as cancelled
          await storage.updateEmailCampaign(campaign.id, {
            status: 'bounced', // Using bounced as cancelled status
          });
          return;
        }
      }

      // Check if lead has been replied to any recent emails
      if (campaign.leadId) {
        const recentReplies = await storage.getRecentEmailReplies(campaign.leadId, 7); // Check last 7 days
        if (recentReplies.length > 0) {
          console.log(`Skipping follow-up ${campaign.id} - lead has recent replies`);
          await storage.updateEmailCampaign(campaign.id, {
            status: 'bounced', // Using bounced as cancelled status
          });
          return;
        }
      }

      // Send the follow-up email
      console.log(`Sending scheduled follow-up ${campaign.id}`);
      const result = await emailService.sendCampaignEmail(campaign.id, campaign.leadId!);

      if (result.success) {
        console.log(`Follow-up ${campaign.id} sent successfully`);
      } else {
        console.error(`Failed to send follow-up ${campaign.id}:`, result.error);
      }
    } catch (error) {
      console.error(`Error processing campaign ${campaign.id}:`, error);
    }
  }

  async cancelFollowUpsForLead(leadId: string): Promise<void> {
    await storage.cancelScheduledFollowUps(leadId);
    console.log(`Cancelled scheduled follow-ups for lead ${leadId}`);
  }

  async cancelFollowUp(campaignId: string): Promise<void> {
    await storage.updateEmailCampaign(campaignId, {
      status: 'bounced', // Using bounced as cancelled status
    });
    console.log(`Cancelled follow-up ${campaignId}`);
  }
}

// Export singleton instance
export const followUpScheduler = FollowUpScheduler.getInstance();