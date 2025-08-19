import {
  users,
  leads,
  emailCampaigns,
  insights,
  type User,
  type UpsertUser,
  type Lead,
  type InsertLead,
  type EmailCampaign,
  type InsertEmailCampaign,
  type Insight,
  type InsertInsight,
  type DashboardStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, and, gte, sql, lt, isNotNull } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Lead operations
  getLeads(userId: string, limit?: number): Promise<Lead[]>;
  getLeadById(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead & { createdBy: string }): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  searchLeads(query: string, userId: string): Promise<Lead[]>;
  
  // Email campaign operations
  getEmailCampaigns(leadId?: string, limit?: number): Promise<EmailCampaign[]>;
  getEmailCampaignById(id: string): Promise<EmailCampaign | undefined>;
  getEmailCampaignByTrackingId(trackingId: string): Promise<EmailCampaign | undefined>;
  createEmailCampaign(campaign: InsertEmailCampaign & { createdBy: string }): Promise<EmailCampaign>;
  updateEmailCampaign(id: string, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign>;
  getScheduledEmailCampaigns(beforeDate: Date): Promise<EmailCampaign[]>;
  getRecentEmailReplies(leadId: string, days: number): Promise<EmailCampaign[]>;
  cancelScheduledFollowUps(leadId: string): Promise<void>;
  
  // Insights operations
  getInsights(type?: string, limit?: number): Promise<Insight[]>;
  createInsight(insight: InsertInsight & { createdBy: string }): Promise<Insight>;
  
  // Dashboard operations
  getDashboardStats(userId: string): Promise<DashboardStats>;
  getRecentLeads(userId: string, limit?: number): Promise<Lead[]>;
  getPerformanceData(userId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Lead operations
  async getLeads(userId: string, limit = 50): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(eq(leads.createdBy, userId))
      .orderBy(desc(leads.createdAt))
      .limit(limit);
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async createLead(lead: InsertLead & { createdBy: string }): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async updateLead(id: string, lead: Partial<InsertLead> & { lastContactDate?: Date }): Promise<Lead> {
    const [updatedLead] = await db
      .update(leads)
      .set({ ...lead, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return updatedLead;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  async searchLeads(query: string, userId: string): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.createdBy, userId),
          sql`(${leads.name} ILIKE ${`%${query}%`} OR ${leads.company} ILIKE ${`%${query}%`} OR ${leads.email} ILIKE ${`%${query}%`})`
        )
      )
      .orderBy(desc(leads.createdAt));
  }

  // Email campaign operations
  async getEmailCampaignByTrackingId(trackingId: string): Promise<EmailCampaign | null> {
    const [campaign] = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.trackingId, trackingId));
    return campaign || null;
  }

  async getEmailCampaigns(leadId?: string, limit = 50): Promise<EmailCampaign[]> {
    const query = db.select().from(emailCampaigns);
    
    if (leadId) {
      return await query
        .where(eq(emailCampaigns.leadId, leadId))
        .orderBy(desc(emailCampaigns.createdAt))
        .limit(limit);
    }
    
    return await query
      .orderBy(desc(emailCampaigns.createdAt))
      .limit(limit);
  }

  async getEmailCampaignById(id: string): Promise<EmailCampaign | undefined> {
    const [campaign] = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, id));
    return campaign;
  }

  async createEmailCampaign(campaign: InsertEmailCampaign & { createdBy: string }): Promise<EmailCampaign> {
    const [newCampaign] = await db
      .insert(emailCampaigns)
      .values(campaign)
      .returning();
    return newCampaign!;
  }

  async updateEmailCampaign(id: string, campaign: Partial<InsertEmailCampaign> & { sentAt?: Date; openedAt?: Date; repliedAt?: Date }): Promise<EmailCampaign> {
    const updateData: any = { ...campaign, updatedAt: new Date() };
    
    // Set timestamps based on status
    if (campaign.status === 'sent' && !updateData.sentAt) {
      updateData.sentAt = new Date();
    }
    if (campaign.status === 'opened' && !updateData.openedAt) {
      updateData.openedAt = new Date();
    }
    if (campaign.status === 'replied' && !updateData.repliedAt) {
      updateData.repliedAt = new Date();
    }

    const [updatedCampaign] = await db
      .update(emailCampaigns)
      .set(updateData)
      .where(eq(emailCampaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  // Insights operations
  async getInsights(type?: string, limit = 10): Promise<Insight[]> {
    const query = db.select().from(insights);
    
    if (type) {
      return await query
        .where(eq(insights.type, type))
        .orderBy(desc(insights.generatedAt))
        .limit(limit);
    }
    
    return await query
      .orderBy(desc(insights.generatedAt))
      .limit(limit);
  }

  async createInsight(insight: InsertInsight & { createdBy: string }): Promise<Insight> {
    const [newInsight] = await db.insert(insights).values(insight).returning();
    return newInsight;
  }

  // Dashboard operations
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Get total leads
    const [totalLeadsResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.createdBy, userId));

    // Get emails sent
    const [emailsSentResult] = await db
      .select({ count: count() })
      .from(emailCampaigns)
      .where(eq(emailCampaigns.createdBy, userId));

    // Get replied emails for response rate
    const [repliedEmailsResult] = await db
      .select({ count: count() })
      .from(emailCampaigns)
      .where(
        and(
          eq(emailCampaigns.createdBy, userId),
          eq(emailCampaigns.status, "replied")
        )
      );

    // Get follow-ups scheduled
    const [followupsResult] = await db
      .select({ count: count() })
      .from(emailCampaigns)
      .where(
        and(
          eq(emailCampaigns.createdBy, userId),
          eq(emailCampaigns.isFollowUp, true)
        )
      );

    // Get growth metrics (simplified calculation)
    const [recentLeadsResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(
        and(
          eq(leads.createdBy, userId),
          gte(leads.createdAt, oneWeekAgo)
        )
      );

    const [recentEmailsResult] = await db
      .select({ count: count() })
      .from(emailCampaigns)
      .where(
        and(
          eq(emailCampaigns.createdBy, userId),
          gte(emailCampaigns.createdAt, oneWeekAgo)
        )
      );

    const totalLeads = totalLeadsResult.count;
    const emailsSent = emailsSentResult.count;
    const repliedEmails = repliedEmailsResult.count;
    const responseRate = emailsSent > 0 ? (repliedEmails / emailsSent) * 100 : 0;

    return {
      totalLeads,
      emailsSent,
      responseRate: parseFloat(responseRate.toFixed(1)),
      followupsScheduled: followupsResult.count,
      leadsGrowth: 12, // Simplified - would need more complex calculation
      emailsGrowth: 18,
      responseChange: -2,
      followupsGrowth: 8,
    };
  }

  async getRecentLeads(userId: string, limit = 5): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(eq(leads.createdBy, userId))
      .orderBy(desc(leads.updatedAt))
      .limit(limit);
  }

  async getScheduledEmailCampaigns(beforeDate: Date): Promise<EmailCampaign[]> {
    return await db
      .select()
      .from(emailCampaigns)
      .where(
        and(
          eq(emailCampaigns.status, "draft"),
          isNotNull(emailCampaigns.scheduledAt),
          lt(emailCampaigns.scheduledAt, beforeDate)
        )
      )
      .orderBy(emailCampaigns.scheduledAt);
  }

  async getRecentEmailReplies(leadId: string, days: number): Promise<EmailCampaign[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    return await db
      .select()
      .from(emailCampaigns)
      .where(
        and(
          eq(emailCampaigns.leadId, leadId),
          eq(emailCampaigns.status, "replied"),
          gte(emailCampaigns.repliedAt, sinceDate)
        )
      );
  }

  async cancelScheduledFollowUps(leadId: string): Promise<void> {
    await db
      .update(emailCampaigns)
      .set({ 
        status: "bounced", // Using bounced as cancelled status
        updatedAt: new Date() 
      })
      .where(
        and(
          eq(emailCampaigns.leadId, leadId),
          eq(emailCampaigns.status, "draft"),
          eq(emailCampaigns.isFollowUp, true),
          isNotNull(emailCampaigns.scheduledAt)
        )
      );
  }

  async getPerformanceData(userId: string): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get emails sent over time
    const emailsSent = await db
      .select({
        date: sql<string>`date(${emailCampaigns.sentAt})`,
        count: count(),
      })
      .from(emailCampaigns)
      .where(
        and(
          eq(emailCampaigns.createdBy, userId),
          eq(emailCampaigns.status, "sent"),
          gte(emailCampaigns.sentAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`date(${emailCampaigns.sentAt})`)
      .orderBy(sql`date(${emailCampaigns.sentAt})`);

    // Get response rates
    const responseRates = await db
      .select({
        date: sql<string>`date(${emailCampaigns.sentAt})`,
        totalSent: sql<number>`count(*)`,
        totalReplies: sql<number>`sum(case when ${emailCampaigns.status} = 'replied' then 1 else 0 end)`,
      })
      .from(emailCampaigns)
      .where(
        and(
          eq(emailCampaigns.createdBy, userId),
          gte(emailCampaigns.sentAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`date(${emailCampaigns.sentAt})`)
      .orderBy(sql`date(${emailCampaigns.sentAt})`);

    // Calculate response rates
    const responseRatesData = responseRates.map(row => ({
      date: row.date,
      rate: row.totalSent > 0 ? Math.round((row.totalReplies / row.totalSent) * 100) : 0
    }));

    // Get leads by status
    const leadsByStatus = await db
      .select({
        status: leads.status,
        count: count(),
      })
      .from(leads)
      .where(eq(leads.createdBy, userId))
      .groupBy(leads.status);

    const statusColors = {
      new: "#3b82f6",
      contacted: "#f59e0b", 
      replied: "#8b5cf6",
      qualified: "#10b981",
      closed: "#6b7280",
      follow_up_scheduled: "#ef4444"
    };

    const leadsByStatusData = leadsByStatus.map(row => ({
      status: row.status || 'new',
      count: row.count,
      color: statusColors[row.status as keyof typeof statusColors] || statusColors.new
    }));

    return {
      emailsSent: emailsSent.map(row => ({
        date: row.date,
        count: row.count
      })),
      responseRates: responseRatesData,
      leadsByStatus: leadsByStatusData,
      monthlyTrends: [] // Placeholder for more complex trends analysis
    };
  }
}

export const storage = new DatabaseStorage();
