import { storage } from "../storage";
import type { EmailCampaign } from "@shared/schema";
import { GmailProvider, type GmailConfig } from "./gmailService";
import { emailTrackingService } from "./emailTrackingService";

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
  messageId?: string;
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
    // Update campaign status in storage layer
  }

  async trackClick(trackingId: string, url: string): Promise<void> {
    console.log(`[MOCK EMAIL] Link clicked: ${trackingId} -> ${url}`);
  }
}

// Email service class
export class EmailService {
  private provider: EmailProvider;

  constructor(provider?: EmailProvider) {
    this.provider = provider || this.createProvider();
  }

  private createProvider(): EmailProvider {
    // Check if Gmail credentials are available
    if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
      console.log('📧 Using Gmail provider for email sending');
      return new GmailProvider({
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        redirectUri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/api/auth/gmail/callback',
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: process.env.GMAIL_ACCESS_TOKEN,
      });
    }
    
    // Fall back to mock provider for development
    console.log('📧 Using Mock provider for email sending (tracking will not work)');
    return new MockEmailProvider();
  }

  // Simple email sending method for invitations and other non-campaign emails
  async sendEmail(params: { to: string; subject: string; content: string; fromName?: string; fromEmail?: string; }): Promise<EmailSendResult> {
    return await this.provider.sendEmail({
      to: params.to,
      subject: params.subject,
      content: params.content,
      fromName: params.fromName || process.env.FROM_NAME || "OutreachX Team",
      fromEmail: params.fromEmail || process.env.FROM_EMAIL || "noreply@outreachx.com",
    });
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
    // Generate unique Message-ID for reply tracking
    const messageId = `<${campaignId}.${Date.now()}@outreachx.com>`;

    // Add tracking pixels and links to email content
    const trackedContent = this.addEmailTracking(campaign.content, trackingId);

    const result = await this.provider.sendEmail({
      to: lead.email,
      subject: campaign.subject,
      content: trackedContent,
      fromName: process.env.FROM_NAME || "OutreachX Team",
      fromEmail: process.env.FROM_EMAIL || "outreach@yourcompany.com",
      trackingId,
      leadId,
      campaignId,
      messageId
    });

    if (result.success) {
      // Update campaign with tracking info and sent status
      await storage.updateEmailCampaign(campaignId, {
        status: "sent",
        messageId: messageId, // Use our generated messageId for reply tracking
        trackingId: result.trackingId,
        sentAt: new Date()
      });

      // Update lead last contact date and status
      await storage.updateLead(leadId, {
        lastContactDate: new Date(),
        status: 'contacted'
      });
    }

    return result;
  }

  addEmailTracking(content: string, trackingId?: string): string {
    // Convert newlines to HTML breaks for proper formatting
    let formattedContent = content.replace(/\n/g, '<br>');
    
    if (!trackingId) return formattedContent;

    // Determine the correct base URL based on environment and normalize it
    let baseUrl = '';
    if (process.env.NODE_ENV === 'production') {
      // Use the Render app URL or a custom domain
      baseUrl = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'https://outreachx.onrender.com';
    } else {
      // Development environment
      baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000';
    }

    // Ensure protocol is present (default to http for dev, https for prod)
    if (!/^https?:\/\//i.test(baseUrl)) {
      baseUrl = (process.env.NODE_ENV === 'production' ? 'https://' : 'http://') + baseUrl;
    }
    // Remove any trailing slashes to avoid '//' when concatenating paths
    baseUrl = baseUrl.replace(/\/+$/, '');

    // Add invisible tracking pixel for open tracking
    const trackingPixel = `<img src="${baseUrl}/api/email/track-open/${trackingId}" width="1" height="1" style="display:none;" alt="" />`;

    // Add tracking to links (normalize link replacement to use encoded original URL)
    const trackedContent = formattedContent.replace(
      /<a\s+href="([^"]+)"/g,
      (match: string, p1: string) => `<a href="${baseUrl}/api/email/track-click/${trackingId}?url=${encodeURIComponent(p1)}"`
    );

    console.log(`📧 Adding tracking pixel: ${baseUrl}/api/email/track-open/${trackingId}`);

    return trackedContent + trackingPixel;
  }

  async handleEmailOpen(trackingId: string): Promise<void> {
    await emailTrackingService.trackEmailOpen(trackingId);
  }

  async handleEmailClick(trackingId: string, url: string): Promise<string> {
    return await emailTrackingService.trackEmailClick(trackingId, url);
  }
}

export const emailService = new EmailService();