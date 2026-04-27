export interface DashboardStats {
  totalLeads: number;
  emailsSent: number;
  responseRate: number;
  followupsScheduled: number;
  leadsGrowth: number;
  emailsGrowth: number;
  responseChange: number;
  followupsGrowth: number;
}

export interface EmailGenerationRequest {
  leadId: string;
  tone: 'professional' | 'casual' | 'direct';
  isFollowUp?: boolean;
  parentEmailId?: string;
}

export interface EmailGenerationResponse {
  subject: string;
  content: string;
}

export interface CSVImportResult {
  message: string;
  leads?: any[];
  errors?: string[];
}
