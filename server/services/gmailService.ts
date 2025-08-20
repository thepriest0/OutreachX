import { google } from 'googleapis';
import type { EmailProvider, EmailSendParams, EmailSendResult } from './emailService.js';

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  accessToken?: string;
}

export class GmailProvider implements EmailProvider {
  private oauth2Client: any;
  private gmail: any;

  constructor(config: GmailConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );

    this.oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
      access_token: config.accessToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async sendEmail(params: EmailSendParams): Promise<EmailSendResult> {
    try {
      // Generate a unique Message-ID for reply tracking
      const messageId = `<${Date.now()}.${Math.random().toString(36)}@${params.fromEmail.split('@')[1] || 'outreachx.com'}>`;
      
      // Construct email message with Message-ID header
      const emailMessage = this.constructEmailMessage({
        to: params.to,
        subject: params.subject,
        content: params.content, // Use content as-is (already tracked)
        fromName: params.fromName,
        fromEmail: params.fromEmail,
        messageId: messageId,
      });

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: emailMessage,
        },
      });

      return {
        success: true,
        messageId: messageId, // Return our custom Message-ID
        trackingId: params.trackingId,
      };
    } catch (error) {
      console.error('Gmail send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async trackOpen(trackingId: string): Promise<void> {
    console.log(`Email opened: ${trackingId}`);
    // Implementation handled by the tracking pixel endpoint
  }

  async trackClick(trackingId: string, url: string): Promise<void> {
    console.log(`Link clicked: ${trackingId} -> ${url}`);
    // Implementation handled by the link tracking endpoint
  }

  private constructEmailMessage(params: {
    to: string;
    subject: string;
    content: string;
    fromName: string;
    fromEmail: string;
    messageId?: string;
  }): string {
    const emailLines = [
      `From: ${params.fromName} <${params.fromEmail}>`,
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
    ];
    
    // Add Message-ID header for reply tracking
    if (params.messageId) {
      emailLines.push(`Message-ID: ${params.messageId}`);
    }
    
    emailLines.push(
      'Content-Type: text/html; charset=utf-8',
      '',
      params.content
    );

    const email = emailLines.join('\n');
    return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  }

  private addTracking(content: string, trackingId?: string): string {
    if (!trackingId) return content;

    // Add tracking pixel for open tracking
    const trackingPixel = `<img src="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/email/track-open/${trackingId}" width="1" height="1" style="display:none;" />`;

    // Add tracking to links
    const trackedContent = content.replace(
      /<a\s+href="([^"]+)"/g,
      `<a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/email/track-click/${trackingId}?url=$1"`
    );

    return trackedContent + trackingPixel;
  }

  static async getAuthUrl(config: Omit<GmailConfig, 'refreshToken' | 'accessToken'>): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  static async getTokensFromCode(
    code: string,
    config: Omit<GmailConfig, 'refreshToken' | 'accessToken'>
  ): Promise<{ refreshToken: string; accessToken: string }> {
    const oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    return {
      refreshToken: tokens.refresh_token!,
      accessToken: tokens.access_token!,
    };
  }
}