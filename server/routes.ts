import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { emailService } from "./services/emailService";
import { generateEmail } from "./services/gemini";
import { insertLeadSchema, insertEmailCampaignSchema, insertInsightSchema } from "@shared/schema";
import { generateColdEmail, generateFollowUpEmail, generateInsights } from "./services/gemini";
import { parseLeadsFromCSV, validateCSVLeads, convertLeadsToCSV, getCSVTemplate } from "./services/csvHandler";
import { followUpScheduler } from "./services/followUpScheduler";
import { emailTrackingService } from "./services/emailTrackingService";
import { GmailProvider } from "./services/gmailService";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Start follow-up scheduler
  followUpScheduler.start();

  // Email tracking routes
  app.get('/api/email/track-open/:trackingId', async (req, res) => {
    try {
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

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/recent-leads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 5;
      const leads = await storage.getRecentLeads(userId, limit);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching recent leads:", error);
      res.status(500).json({ message: "Failed to fetch recent leads" });
    }
  });

  // Leads routes
  app.get('/api/leads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/leads/:id', isAuthenticated, async (req, res) => {
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

  app.post('/api/leads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead({ ...validatedData, createdBy: userId });
      res.status(201).json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(400).json({ message: "Failed to create lead" });
    }
  });

  app.put('/api/leads/:id', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(req.params.id, validatedData);
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(400).json({ message: "Failed to update lead" });
    }
  });

  app.delete('/api/leads/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteLead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // CSV import/export routes
  app.post('/api/leads/import', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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

  app.get('/api/leads/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get('/api/email-campaigns', isAuthenticated, async (req, res) => {
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

  app.post('/api/email-campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertEmailCampaignSchema.parse(req.body);
      const campaign = await storage.createEmailCampaign({ ...validatedData, createdBy: userId });
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating email campaign:", error);
      res.status(400).json({ message: "Failed to create email campaign" });
    }
  });

  app.put('/api/email-campaigns/:id', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEmailCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateEmailCampaign(req.params.id, validatedData);
      res.json(campaign);
    } catch (error) {
      console.error("Error updating email campaign:", error);
      res.status(400).json({ message: "Failed to update email campaign" });
    }
  });

  app.post('/api/email-campaigns/:id/send', isAuthenticated, async (req, res) => {
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

  app.post('/api/email-campaigns/:id/schedule-followup', isAuthenticated, async (req: any, res) => {
    try {
      const campaignId = req.params.id;
      const { delayDays } = req.body;
      const userId = req.user.claims.sub;
      
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

  app.delete('/api/email-campaigns/:id/cancel-followups', isAuthenticated, async (req, res) => {
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

  // AI email generation routes
  app.post('/api/ai/generate-email', isAuthenticated, async (req, res) => {
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

  app.post('/api/campaigns/:id/send', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { leadId } = req.body;
      
      const result = await emailService.sendCampaignEmail(id, leadId);
      
      if (result.success) {
        res.json({ success: true, messageId: result.messageId });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  app.post('/api/campaigns/:id/schedule-followup', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { delay } = req.body; // delay in seconds
      
      const followUpId = await emailService.scheduleFollowUp(id, delay || 86400); // Default 24 hours
      
      res.json({ success: true, followUpCampaignId: followUpId });
    } catch (error) {
      console.error("Error scheduling follow-up:", error);
      res.status(500).json({ message: "Failed to schedule follow-up" });
    }
  });

  // Insights routes
  app.get('/api/insights', isAuthenticated, async (req, res) => {
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

  app.post('/api/insights/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get('/api/dashboard/performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
