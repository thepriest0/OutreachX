import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  pgEnum,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Enums
export const userRoleEnum = pgEnum("user_role", ["head_admin", "admin", "founder", "strategist", "designer"]);
export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "replied", "follow_up_scheduled", "qualified", "closed"]);
export const emailStatusEnum = pgEnum("email_status", ["draft", "sent", "opened", "replied", "bounced"]);
export const emailToneEnum = pgEnum("email_tone", ["professional", "casual", "direct"]);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("designer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leads table
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  company: varchar("company").notNull(),
  role: varchar("role"),
  notes: text("notes"),
  status: leadStatusEnum("status").default("new"),
  lastContactDate: timestamp("last_contact_date"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email campaigns table
export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id),
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  tone: emailToneEnum("tone").notNull(),
  status: emailStatusEnum("status").default("draft"),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  repliedAt: timestamp("replied_at"),
  isFollowUp: boolean("is_follow_up").default(false),
  followUpSequence: integer("follow_up_sequence").default(0),
  parentEmailId: varchar("parent_email_id"),
  messageId: varchar("message_id"), // For tracking email responses
  trackingId: varchar("tracking_id"), // For email open/click tracking
  scheduledAt: timestamp("scheduled_at"), // For follow-up scheduling
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analytics/Insights table
export const insights = pgTable("insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // 'weekly', 'monthly', 'campaign'
  content: text("content").notNull(),
  metrics: jsonb("metrics"), // Store relevant metrics as JSON
  generatedAt: timestamp("generated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  leads: many(leads),
  emailCampaigns: many(emailCampaigns),
  insights: many(insights),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [leads.createdBy],
    references: [users.id],
  }),
  emailCampaigns: many(emailCampaigns),
}));

export const emailCampaignsRelations = relations(emailCampaigns, ({ one, many }) => ({
  lead: one(leads, {
    fields: [emailCampaigns.leadId],
    references: [leads.id],
  }),
  createdBy: one(users, {
    fields: [emailCampaigns.createdBy],
    references: [users.id],
  }),
}));

export const insightsRelations = relations(insights, ({ one }) => ({
  createdBy: one(users, {
    fields: [insights.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertLeadSchema = createInsertSchema(leads).pick({
  name: true,
  email: true,
  company: true,
  role: true,
  notes: true,
  status: true,
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).pick({
  leadId: true,
  subject: true,
  content: true,
  tone: true,
  status: true,
  isFollowUp: true,
  followUpSequence: true,
  parentEmailId: true,
  messageId: true,
  trackingId: true,
  scheduledAt: true,
});

export const insertInsightSchema = createInsertSchema(insights).pick({
  type: true,
  content: true,
  metrics: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema> & { id: string };
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = z.infer<typeof insertInsightSchema>;

// Dashboard stats type
export type DashboardStats = {
  totalLeads: number;
  emailsSent: number;
  responseRate: number;
  followupsScheduled: number;
  leadsGrowth: number;
  emailsGrowth: number;
  responseChange: number;
  followupsGrowth: number;
};
