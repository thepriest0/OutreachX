import { storage } from "../storage";
import type { EmailCampaign } from "@shared/schema";

// Email service interface
export interface EmailProvider {
  sendEmail(params: EmailSendParams): Promise<EmailSendResult>;
  trackOpen(trackingId: string): Promise<void>;
  trackClick(trackingId: string, url: string): Promise<void>;
}

export interface EmailSendParams {
  to: string;
  subject: string;
  content: string;
  fromName: string;
  fromEmail: string;
  trackingId?: string;
  leadId?: string;
  campaignId?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  trackingId?: string;
}

// Mock email provider for development
class MockEmailProvider implements EmailProvider {
  async sendEmail(params: EmailSendParams): Promise<EmailSendResult> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`[MOCK EMAIL] Sending to: ${params.to}`);
    console.log(`[MOCK EMAIL] Subject: ${params.subject}`);
    console.log(`[MOCK EMAIL] From: ${params.fromName} <${params.fromEmail}>`);
    
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36)}`,
      trackingId: params.trackingId || `track_${Date.now()}`
    };
  }

  async trackOpen(trackingId: string): Promise<void> {
    console.log(`[MOCK EMAIL] Email opened: ${trackingId}`);
    // Update campaign status
    const campaign = await storage.getEmailCampaignByTrackingId(trackingId);
    if (campaign) {
      await storage.updateEmailCampaign(campaign.id, {
        status: "opened",
        // openedAt: new Date() // Will be set by storage layer
      });
    }
  }

  async trackClick(trackingId: string, url: string): Promise<void> {
    console.log(`[MOCK EMAIL] Link clicked: ${trackingId} -> ${url}`);
  }
}

// Email service class
export class EmailService {
  private provider: EmailProvider;

  constructor(provider?: EmailProvider) {
    this.provider = provider || new MockEmailProvider();
  }

  async sendCampaignEmail(campaignId: string, leadId: string): Promise<EmailSendResult> {
    const campaign = await storage.getEmailCampaignById(campaignId);
    const lead = await storage.getLeadById(leadId);

    if (!campaign || !lead) {
      return {
        success: false,
        error: "Campaign or lead not found"
      };
    }

    const trackingId = `${campaignId}_${Date.now()}`;

    // Add tracking pixels and links to email content
    const trackedContent = this.addEmailTracking(campaign.content, trackingId);

    const result = await this.provider.sendEmail({
      to: lead.email,
      subject: campaign.subject,
      content: trackedContent,
      fromName: "OutreachX Team", // TODO: Make configurable
      fromEmail: "outreach@yourcompany.com", // TODO: Make configurable
      trackingId,
      leadId,
      campaignId
    });

    if (result.success) {
      // Update campaign status
      await storage.updateEmailCampaign(campaignId, {
        status: "sent",
        // sentAt: new Date() // Will be set by storage layer
      });

      // Update lead last contact date
      await storage.updateLead(leadId, {
        lastContactDate: new Date()
      });
    }

    return result;
  }

  async scheduleFollowUp(parentCampaignId: string, delay: number): Promise<string> {
    const parentCampaign = await storage.getEmailCampaignById(parentCampaignId);
    if (!parentCampaign) {
      throw new Error("Parent campaign not found");
    }

    // Create follow-up campaign
    const followUpCampaign = await storage.createEmailCampaign({
      leadId: parentCampaign.leadId!,
      subject: `Re: ${parentCampaign.subject}`,
      content: await this.generateFollowUpContent(parentCampaign),
      tone: parentCampaign.tone,
      isFollowUp: true,
      followUpSequence: (parentCampaign.followUpSequence || 0) + 1,
      parentEmailId: parentCampaignId,
      createdBy: parentCampaign.createdBy!
    });

    // Schedule sending (in a real app, you'd use a job queue)
    setTimeout(async () => {
      if (parentCampaign.leadId) {
        await this.sendCampaignEmail(followUpCampaign.id, parentCampaign.leadId);
      }
    }, delay * 1000);

    return followUpCampaign.id;
  }

  private addEmailTracking(content: string, trackingId: string): string {
    // Add tracking pixel
    const trackingPixel = `<img src="/api/email/track/open/${trackingId}" width="1" height="1" style="display:none;" />`;
    
    // Add tracking to links (simplified implementation)
    const trackedContent = content.replace(
      /href="([^"]+)"/g,
      `href="/api/email/track/click/${trackingId}?url=$1"`
    );

    return trackedContent + trackingPixel;
  }

  private async generateFollowUpContent(parentCampaign: EmailCampaign): Promise<string> {
    // In a real app, this would use AI to generate contextual follow-ups
    const followUpTemplates = [
      "Hi there,\n\nI wanted to follow up on my previous email about our design services. I understand you're probably busy, but I'd love to chat for just 5 minutes about how we can help elevate your brand.\n\nWould you be available for a quick call this week?\n\nBest regards",
      "Hello,\n\nI hope this finds you well. I sent an email last week about how our design team has helped companies like yours increase their conversion rates by 40%.\n\nI'd be happy to share a quick case study that's relevant to your industry. Would that be of interest?\n\nThanks for your time!",
      "Hi,\n\nI wanted to reach out one more time about our conversation regarding design services. I have some new ideas that could be perfect for your current projects.\n\nWould you be open to a brief 10-minute call to discuss?\n\nBest"
    ];

    const sequence = parentCampaign.followUpSequence || 0;
    return followUpTemplates[sequence % followUpTemplates.length];
  }

  // Email tracking endpoints
  async handleEmailOpen(trackingId: string): Promise<void> {
    await this.provider.trackOpen(trackingId);
  }

  async handleEmailClick(trackingId: string, url: string): Promise<void> {
    await this.provider.trackClick(trackingId, url);
  }
}

export const emailService = new EmailService();