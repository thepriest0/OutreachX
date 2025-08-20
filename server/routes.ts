import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireRole } from "./auth";
import { emailService } from "./services/emailService";
import { insertLeadSchema, insertEmailCampaignSchema, insertInsightSchema } from "@shared/schema";
import { generateColdEmail, generateFollowUpEmail, generateInsights } from "./services/gemini";
import { parseLeadsFromCSV, validateCSVLeads, convertLeadsToCSV, getCSVTemplate } from "./services/csvHandler";
import { followUpScheduler } from "./services/followUpScheduler";
import { emailTrackingService } from "./services/emailTrackingService";
import { emailReplyTracker } from "./services/emailReplyTracker";
import { GmailProvider } from "./services/gmailService";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Start follow-up scheduler
  followUpScheduler.start();

  // Start email reply tracker if Gmail credentials are available
  if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
    emailReplyTracker.start();
    console.log('🔄 Email reply tracker started');
  } else {
    console.log('⚠️ Email reply tracker not started - Gmail credentials not configured');
  }

  // Email tracking routes
  app.get('/api/email/track-open/:trackingId', async (req, res) => {
    try {
      console.log(`📧 TRACKING: Email open request for trackingId: ${req.params.trackingId}`);
      await emailTrackingService.trackEmailOpen(req.params.trackingId);
      // Return 1x1 transparent pixel
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      );
      res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(pixel);
    } catch (error) {
      console.error('Error tracking email open:', error);
      res.status(500).end();
    }
  });

  app.get('/api/email/track-click/:trackingId', async (req, res) => {
    try {
      const originalUrl = req.query.url as string;
      if (!originalUrl) {
        return res.status(400).json({ message: 'Missing URL parameter' });
      }
      
      const redirectUrl = await emailTrackingService.trackEmailClick(req.params.trackingId, originalUrl);
      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error('Error tracking email click:', error);
      res.status(500).json({ message: 'Tracking failed' });
    }
  });

  // Gmail OAuth routes
  app.get('/api/auth/gmail', async (req, res) => {
    try {
      if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
        return res.status(500).json({ message: 'Gmail OAuth not configured' });
      }

      const authUrl = await GmailProvider.getAuthUrl({
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        redirectUri: process.env.GMAIL_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/gmail/callback`,
      });

      res.redirect(authUrl);
    } catch (error) {
      console.error('Error generating Gmail auth URL:', error);
      res.status(500).json({ message: 'Failed to initiate Gmail authentication' });
    }
  });

  app.get('/api/auth/gmail/callback', async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).json({ message: 'Missing authorization code' });
      }

      const tokens = await GmailProvider.getTokensFromCode(code, {
        clientId: process.env.GMAIL_CLIENT_ID!,
        clientSecret: process.env.GMAIL_CLIENT_SECRET!,
        redirectUri: process.env.GMAIL_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/gmail/callback`,
      });

      // In a real app, you'd store these tokens securely for the user
      // For now, just return them (not secure - for demo only)
      res.json({
        message: 'Gmail authentication successful',
        tokens: {
          refreshToken: tokens.refreshToken,
          accessToken: tokens.accessToken,
        },
        note: 'Store these tokens as environment variables: GMAIL_REFRESH_TOKEN and GMAIL_ACCESS_TOKEN'
      });
    } catch (error) {
      console.error('Error handling Gmail callback:', error);
      res.status(500).json({ message: 'Failed to complete Gmail authentication' });
    }
  });

  // Email reply tracker testing endpoint
  app.post('/api/email/check-replies', requireAuth, async (req, res) => {
    try {
      if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
        return res.status(400).json({ 
          message: 'Gmail credentials not configured. Reply tracking is disabled.' 
        });
      }

      await emailReplyTracker.checkNow();
      res.json({ 
        success: true,
        message: 'Reply check completed successfully' 
      });
    } catch (error) {
      console.error('Error checking replies:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to check for replies',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Debug endpoint to manually test email open tracking
  app.post('/api/email/test-tracking/:campaignId', requireAuth, async (req, res) => {
    try {
      const campaignId = req.params.campaignId;
      
      // Find a tracking ID for this campaign (simulate open tracking)
      const campaign = await storage.getEmailCampaignById(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Update campaign as opened
      await storage.updateEmailCampaign(campaignId, {
        status: 'opened',
        openedAt: new Date(),
      });

      res.json({ 
        success: true,
        message: `Campaign ${campaignId} manually marked as opened`,
        campaign: campaign
      });
    } catch (error) {
      console.error('Error in test tracking:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to test tracking',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // User info route (already handled in auth.ts)

  // Dashboard routes
  app.get('/api/dashboard/stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/recent-leads', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 5;
      const leads = await storage.getRecentLeads(userId, limit);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching recent leads:", error);
      res.status(500).json({ message: "Failed to fetch recent leads" });
    }
  });

  // Leads routes
  app.get('/api/leads', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      
      let leads;
      if (search) {
        leads = await storage.searchLeads(search, userId);
      } else {
        leads = await storage.getLeads(userId, limit);
      }
      
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get('/api/leads/:id', requireAuth, async (req, res) => {
    try {
      const lead = await storage.getLeadById(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.post('/api/leads', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead({ ...validatedData, createdBy: userId });
      res.status(201).json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(400).json({ message: "Failed to create lead" });
    }
  });

  app.put('/api/leads/:id', requireAuth, async (req, res) => {
    try {
      const validatedData = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(req.params.id, validatedData);
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(400).json({ message: "Failed to update lead" });
    }
  });

  app.delete('/api/leads/:id', requireAuth, async (req, res) => {
    try {
      await storage.deleteLead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // CSV import/export routes
  app.post('/api/leads/import', requireAuth, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const parsedLeads = parseLeadsFromCSV(csvContent);
      const { valid, errors } = validateCSVLeads(parsedLeads);

      if (errors.length > 0) {
        return res.status(400).json({ message: "Validation errors", errors });
      }

      const createdLeads = [];
      for (const leadData of valid) {
        const lead = await storage.createLead({ 
          ...leadData, 
          createdBy: userId,
          status: "new"
        });
        createdLeads.push(lead);
      }

      res.json({ 
        message: `Successfully imported ${createdLeads.length} leads`,
        leads: createdLeads
      });
    } catch (error) {
      console.error("Error importing leads:", error);
      res.status(500).json({ message: "Failed to import leads" });
    }
  });

  app.get('/api/leads/export', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const leads = await storage.getLeads(userId);
      const csv = convertLeadsToCSV(leads);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting leads:", error);
      res.status(500).json({ message: "Failed to export leads" });
    }
  });

  app.get('/api/leads/csv-template', (req, res) => {
    try {
      const template = getCSVTemplate();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leads-template.csv');
      res.send(template);
    } catch (error) {
      console.error("Error generating CSV template:", error);
      res.status(500).json({ message: "Failed to generate CSV template" });
    }
  });

  // Email campaign routes
  app.get('/api/email-campaigns', requireAuth, async (req, res) => {
    try {
      const leadId = req.query.leadId as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const campaigns = await storage.getEmailCampaigns(leadId, limit);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching email campaigns:", error);
      res.status(500).json({ message: "Failed to fetch email campaigns" });
    }
  });

  app.post('/api/email-campaigns', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertEmailCampaignSchema.parse(req.body);
      const campaign = await storage.createEmailCampaign({ ...validatedData, createdBy: userId });
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating email campaign:", error);
      res.status(400).json({ message: "Failed to create email campaign" });
    }
  });

  app.put('/api/email-campaigns/:id', requireAuth, async (req, res) => {
    try {
      const validatedData = insertEmailCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateEmailCampaign(req.params.id, validatedData);
      res.json(campaign);
    } catch (error) {
      console.error("Error updating email campaign:", error);
      res.status(400).json({ message: "Failed to update email campaign" });
    }
  });

  app.post('/api/email-campaigns/:id/send', requireAuth, async (req, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await storage.getEmailCampaignById(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (!campaign.leadId) {
        return res.status(400).json({ message: "Campaign has no associated lead" });
      }
      
      const result = await emailService.sendCampaignEmail(campaignId, campaign.leadId);
      
      if (result.success) {
        res.json({ message: "Email sent successfully", result });
      } else {
        res.status(500).json({ message: "Failed to send email", error: result.error });
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      res.status(500).json({ message: "Failed to send campaign" });
    }
  });

  app.post('/api/email-campaigns/:id/schedule-followup', requireAuth, async (req: any, res) => {
    try {
      const campaignId = req.params.id;
      const { delayDays } = req.body;
      const userId = req.user.id;
      
      if (!delayDays || delayDays < 1 || delayDays > 30) {
        return res.status(400).json({ message: "Delay days must be between 1 and 30" });
      }
      
      const followUpId = await followUpScheduler.scheduleFollowUp(campaignId, delayDays, userId);
      res.json({ message: "Follow-up scheduled successfully", followUpId });
    } catch (error) {
      console.error("Error scheduling follow-up:", error);
      res.status(500).json({ message: "Failed to schedule follow-up" });
    }
  });

  // Add campaigns routes (alias for email-campaigns)
  app.get('/api/campaigns', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaigns = await storage.getEmailCampaignsByUser(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.delete('/api/campaigns/:id', requireAuth, async (req, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await storage.getEmailCampaignById(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      await storage.deleteEmailCampaign(campaignId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  app.delete('/api/email-campaigns/:id/cancel-followups', requireAuth, async (req, res) => {
    try {
      const campaign = await storage.getEmailCampaignById(req.params.id);
      if (!campaign || !campaign.leadId) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      await followUpScheduler.cancelFollowUpsForLead(campaign.leadId);
      res.json({ message: "Follow-ups cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling follow-ups:", error);
      res.status(500).json({ message: "Failed to cancel follow-ups" });
    }
  });

  app.get('/api/email-campaigns/:id/followups', requireAuth, async (req, res) => {
    try {
      const campaign = await storage.getEmailCampaignById(req.params.id);
      if (!campaign || !campaign.leadId) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      const followUps = await storage.getFollowUpCampaignsForLead(campaign.leadId);
      res.json(followUps);
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
      res.status(500).json({ message: "Failed to fetch follow-ups" });
    }
  });

  app.post('/api/email-campaigns/:id/generate-followup', requireAuth, async (req, res) => {
    try {
      const { sequence, tone, delayDays } = req.body;
      const campaign = await storage.getEmailCampaignById(req.params.id);
      
      if (!campaign || !campaign.leadId) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const lead = await storage.getLeadById(campaign.leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      const followUpEmail = await generateFollowUpEmail({
        name: lead.name,
        role: lead.role || 'Decision Maker',
        company: lead.company,
        tone: tone,
        isFollowUp: true,
        previousEmailContent: campaign.content,
        followUpSequence: sequence,
      });

      res.json(followUpEmail);
    } catch (error) {
      console.error("Error generating follow-up email:", error);
      res.status(500).json({ message: "Failed to generate follow-up email" });
    }
  });

  app.post('/api/email-campaigns/:id/update-followups', requireAuth, async (req: any, res) => {
    try {
      const { schedules } = req.body;
      const userId = req.user?.id;
      const parentCampaign = await storage.getEmailCampaignById(req.params.id);
      
      if (!parentCampaign || !parentCampaign.leadId) {
        return res.status(404).json({ message: "Parent campaign not found" });
      }

      // Cancel existing follow-ups first
      await followUpScheduler.cancelFollowUpsForLead(parentCampaign.leadId);

      const results = [];
      for (const schedule of schedules) {
        if (schedule.enabled && schedule.subject && schedule.content) {
          const scheduledAt = new Date();
          scheduledAt.setDate(scheduledAt.getDate() + schedule.delayDays);

          const followUpCampaign = await storage.createEmailCampaign({
            leadId: parentCampaign.leadId,
            subject: schedule.subject,
            content: schedule.content,
            tone: schedule.tone,
            status: 'draft',
            isFollowUp: true,
            followUpSequence: schedule.sequence,
            parentEmailId: req.params.id,
            scheduledAt,
            createdBy: userId,
          });

          results.push(followUpCampaign);
          console.log(`Follow-up #${schedule.sequence} scheduled for ${scheduledAt.toISOString()}`);
        }
      }

      res.json({ message: "Follow-up schedules updated successfully", followUps: results });
    } catch (error) {
      console.error("Error updating follow-up schedules:", error);
      res.status(500).json({ message: "Failed to update follow-up schedules" });
    }
  });

  app.delete('/api/email-campaigns/followup/:id', requireAuth, async (req, res) => {
    try {
      const followUpId = req.params.id;
      await followUpScheduler.cancelFollowUp(followUpId);
      res.json({ message: "Follow-up deleted successfully" });
    } catch (error) {
      console.error("Error deleting follow-up:", error);
      res.status(500).json({ message: "Failed to delete follow-up" });
    }
  });

  app.post('/api/email-campaigns/:id/mark-replied', requireAuth, async (req, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await storage.getEmailCampaignById(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      await storage.updateEmailCampaign(campaignId, {
        status: 'replied',
        repliedAt: new Date(),
      });
      
      // Cancel any scheduled follow-ups for this lead
      if (campaign.leadId) {
        await followUpScheduler.cancelFollowUpsForLead(campaign.leadId);
      }
      
      res.json({ message: "Campaign marked as replied successfully" });
    } catch (error) {
      console.error("Error marking campaign as replied:", error);
      res.status(500).json({ message: "Failed to mark campaign as replied" });
    }
  });

  app.get('/api/leads/:leadId/follow-ups', requireAuth, async (req, res) => {
    try {
      const leadId = req.params.leadId;
      const followUps = await storage.getFollowUpCampaignsForLead(leadId);
      
      res.json(followUps);
    } catch (error) {
      console.error("Error getting follow-ups:", error);
      res.status(500).json({ message: "Failed to get follow-ups" });
    }
  });

  // AI email generation routes
  app.post('/api/ai/generate-email', requireAuth, async (req, res) => {
    try {
      const { leadId, tone, isFollowUp, parentEmailId } = req.body;
      
      const lead = await storage.getLeadById(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      let generatedEmail;
      if (isFollowUp && parentEmailId) {
        const parentEmail = await storage.getEmailCampaignById(parentEmailId);
        generatedEmail = await generateFollowUpEmail({
          name: lead.name,
          role: lead.role || 'Decision Maker',
          company: lead.company,
          tone,
          isFollowUp: true,
          previousEmailContent: parentEmail?.content || ''
        });
      } else {
        generatedEmail = await generateColdEmail({
          name: lead.name,
          role: lead.role || 'Decision Maker',
          company: lead.company,
          tone
        });
      }

      res.json(generatedEmail);
    } catch (error) {
      console.error("Error generating email:", error);
      res.status(500).json({ message: "Failed to generate email" });
    }
  });

  // Email reply webhook (for Gmail integration)
  app.post('/api/email/webhook/reply', async (req, res) => {
    try {
      const { messageId, from, subject, threadId } = req.body;
      
      // Find campaign by message ID or thread ID
      const campaigns = await storage.getEmailCampaigns();
      const campaign = campaigns.find(c => 
        c.messageId === messageId || 
        c.messageId === threadId ||
        (c.trackingId && subject.includes(c.trackingId))
      );
      
      if (campaign) {
        await emailTrackingService.markEmailReplied(campaign.messageId || campaign.id);
        console.log(`Email reply detected: Campaign ${campaign.id} from ${from}`);
        res.json({ success: true, message: "Reply tracked successfully" });
      } else {
        console.log(`No campaign found for reply from ${from}`);
        res.json({ success: false, message: "Campaign not found" });
      }
    } catch (error) {
      console.error('Error processing email reply webhook:', error);
      res.status(500).json({ error: 'Failed to process reply webhook' });
    }
  });

  // Manual reply marking endpoint
  app.post('/api/campaigns/:campaignId/mark-replied', async (req, res) => {
    try {
      const { campaignId } = req.params;
      const campaign = await storage.getEmailCampaignById(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      await emailTrackingService.markEmailReplied(campaign.messageId || campaign.id);
      res.json({ success: true, message: "Campaign marked as replied" });
    } catch (error) {
      console.error("Error marking campaign as replied:", error);
      res.status(500).json({ error: "Failed to mark as replied" });
    }
  });

  // Email campaign tracking routes
  app.get('/api/email/track/open/:trackingId', async (req, res) => {
    try {
      const { trackingId } = req.params;
      await emailService.handleEmailOpen(trackingId);
      
      // Return 1x1 transparent pixel
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set({
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.send(pixel);
    } catch (error) {
      console.error("Error tracking email open:", error);
      res.status(200).send(); // Still return success to avoid broken images
    }
  });

  app.get('/api/email/track/click/:trackingId', async (req, res) => {
    try {
      const { trackingId } = req.params;
      const { url } = req.query;
      
      if (url) {
        await emailService.handleEmailClick(trackingId, url as string);
        res.redirect(url as string);
      } else {
        res.status(400).json({ message: "URL parameter required" });
      }
    } catch (error) {
      console.error("Error tracking email click:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });

  app.post('/api/campaigns/:id/send', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { leadId } = req.body;
      
      if (!leadId) {
        return res.status(400).json({ success: false, error: "Lead ID is required" });
      }
      
      const result = await emailService.sendCampaignEmail(id, leadId);
      
      if (result.success) {
        res.json({ success: true, messageId: result.messageId, trackingId: result.trackingId });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ success: false, message: "Failed to send email" });
    }
  });

  app.post('/api/campaigns/:id/schedule-followup', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { delay } = req.body; // delay in seconds
      
      const followUpId = await followUpScheduler.scheduleFollowUp(id, delay || 86400, req.user?.id || 'anonymous'); // Default 24 hours
      
      res.json({ success: true, followUpCampaignId: followUpId });
    } catch (error) {
      console.error("Error scheduling follow-up:", error);
      res.status(500).json({ message: "Failed to schedule follow-up" });
    }
  });

  // Insights routes
  app.get('/api/insights', requireAuth, async (req, res) => {
    try {
      const type = req.query.type as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const insights = await storage.getInsights(type, limit);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching insights:", error);
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  app.post('/api/insights/generate', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getDashboardStats(userId);
      
      const insightContent = await generateInsights({
        totalLeads: stats.totalLeads,
        emailsSent: stats.emailsSent,
        responseRate: stats.responseRate,
        followupsScheduled: stats.followupsScheduled,
        timeframe: 'this week'
      });

      const insight = await storage.createInsight({
        type: 'weekly',
        content: insightContent,
        metrics: stats,
        createdBy: userId
      });

      res.json(insight);
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  // Dashboard statistics routes
  app.get('/api/dashboard/performance', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const performance = await storage.getPerformanceData(userId);
      res.json(performance);
    } catch (error) {
      console.error("Error fetching performance data:", error);
      res.status(500).json({ message: "Failed to fetch performance data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
