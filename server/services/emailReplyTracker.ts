import { storage } from "../storage.js";
import { GmailProvider } from "./gmailService.js";

interface EmailReply {
  messageId: string;
  fromEmail: string;
  subject: string;
  receivedAt: Date;
  threadId?: string;
  inReplyTo?: string;
}

class EmailReplyTracker {
  private isRunning = false;
  private checkInterval = 30000; // Check every 30 seconds
  private intervalId: NodeJS.Timeout | null = null;

  async start() {
    if (this.isRunning) {
      console.log("📧 Reply tracker already running");
      return;
    }

    console.log("🚀 Starting email reply tracker...");
    this.isRunning = true;
    
    // Start checking for replies
    this.intervalId = setInterval(() => {
      this.checkForReplies().catch(error => {
        console.error("❌ Error checking for replies:", error);
      });
    }, this.checkInterval);

    // Run initial check
    this.checkForReplies().catch(error => {
      console.error("❌ Error in initial reply check:", error);
    });
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("⏹️ Email reply tracker stopped");
  }

  private async checkForReplies() {
    try {
      // Only proceed if Gmail is configured
      if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_REFRESH_TOKEN) {
        return;
      }

      console.log("🔍 Checking for email replies...");

      // Get all sent campaigns that haven't been replied to yet
      const sentCampaigns = await storage.getSentCampaignsWithoutReplies();
      
      if (sentCampaigns.length === 0) {
        console.log("📭 No campaigns pending reply tracking");
        return;
      }

      console.log(`📫 Checking ${sentCampaigns.length} campaigns for replies`);

      // Check for replies using Gmail API
      const replies = await this.fetchRecentReplies();
      
      if (replies.length === 0) {
        console.log("📪 No new replies found");
        return;
      }

      console.log(`📬 Found ${replies.length} potential replies`);

      // Match replies to campaigns
      for (const reply of replies) {
        await this.processReply(reply, sentCampaigns);
      }

    } catch (error) {
      console.error("❌ Error in reply checking process:", error);
    }
  }

  private async fetchRecentReplies(): Promise<EmailReply[]> {
    try {
      // Get recent emails from the last hour to avoid processing old emails
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Create Gmail provider instance
      const gmailProvider = new GmailProvider({
        clientId: process.env.GMAIL_CLIENT_ID!,
        clientSecret: process.env.GMAIL_CLIENT_SECRET!,
        redirectUri: process.env.GMAIL_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob',
        refreshToken: process.env.GMAIL_REFRESH_TOKEN!,
      });

      const gmailClient = (gmailProvider as any).gmail;

      // Search for recent emails in inbox
      const query = `in:inbox after:${Math.floor(oneHourAgo.getTime() / 1000)}`;
      
      const response = await gmailClient.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50,
      });

      const messages = response.data.messages || [];
      const replies: EmailReply[] = [];

      for (const message of messages) {
        if (!message.id) continue;

        const messageData = await gmailClient.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['Message-ID', 'In-Reply-To', 'References', 'From', 'Subject', 'Date'],
        });

        const headers = messageData.data.payload?.headers || [];
        const messageId = headers.find((h: any) => h.name === 'Message-ID')?.value;
        const inReplyTo = headers.find((h: any) => h.name === 'In-Reply-To')?.value;
        const references = headers.find((h: any) => h.name === 'References')?.value;
        const from = headers.find((h: any) => h.name === 'From')?.value;
        const subject = headers.find((h: any) => h.name === 'Subject')?.value;
        const date = headers.find((h: any) => h.name === 'Date')?.value;

        // Only process if this looks like a reply (has In-Reply-To or References)
        if (!inReplyTo && !references) continue;
        if (!from || !messageId) continue;

        // Extract email address from "Name <email@domain.com>" format
        const emailMatch = from.match(/<([^>]+)>/) || from.match(/([^\s<>]+@[^\s<>]+)/);
        const fromEmail = emailMatch ? emailMatch[1] : from;

        replies.push({
          messageId: messageId,
          fromEmail: fromEmail.toLowerCase(),
          subject: subject || '',
          receivedAt: date ? new Date(date) : new Date(),
          inReplyTo: inReplyTo,
        });
      }

      return replies;
    } catch (error) {
      console.error("❌ Error fetching replies from Gmail:", error);
      return [];
    }
  }

  private async processReply(reply: EmailReply, sentCampaigns: any[]) {
    try {
      // Find the campaign this reply belongs to
      const matchedCampaign = sentCampaigns.find(campaign => {
        // Match by recipient email and message ID reference
        const leadMatches = campaign.lead && 
                           campaign.lead.email.toLowerCase() === reply.fromEmail;
        
        // Check if this reply references our sent message
        const messageMatches = campaign.messageId && 
                              reply.inReplyTo && 
                              reply.inReplyTo.includes(campaign.messageId);

        return leadMatches && (messageMatches || this.isLikelyReply(reply, campaign));
      });

      if (!matchedCampaign) {
        console.log(`📧 No matching campaign found for reply from ${reply.fromEmail}`);
        return;
      }

      // Check if we've already processed this reply
      const existingReply = await storage.getEmailCampaignByReplyMessageId(reply.messageId);
      if (existingReply) {
        console.log(`📧 Reply already processed for campaign ${matchedCampaign.id}`);
        return;
      }

      console.log(`✅ Reply detected! Campaign ${matchedCampaign.id} from ${reply.fromEmail}`);

      // Mark the campaign as replied
      await storage.updateEmailCampaign(matchedCampaign.id, {
        status: 'replied' as any,
        repliedAt: reply.receivedAt,
      });

      // Cancel any scheduled follow-ups for this lead
      await storage.cancelScheduledFollowUps(matchedCampaign.leadId);

      console.log(`🎉 Campaign ${matchedCampaign.id} marked as replied and follow-ups cancelled`);

    } catch (error) {
      console.error(`❌ Error processing reply for ${reply.fromEmail}:`, error);
    }
  }

  private isLikelyReply(reply: EmailReply, campaign: any): boolean {
    // Additional heuristics to match replies when message ID matching fails
    
    // Check if reply subject contains "Re:" and part of original subject
    if (reply.subject.toLowerCase().includes('re:') && 
        campaign.subject && 
        reply.subject.toLowerCase().includes(campaign.subject.toLowerCase().substring(0, 20))) {
      return true;
    }

    // Check timing - reply should be after the campaign was sent
    if (campaign.sentAt && reply.receivedAt > new Date(campaign.sentAt)) {
      return true;
    }

    return false;
  }

  // Method to manually check for replies (for testing)
  async checkNow(): Promise<void> {
    console.log("🔍 Manual reply check triggered...");
    await this.checkForReplies();
  }
}

export const emailReplyTracker = new EmailReplyTracker();
