import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import type { Lead, InsertLead } from '@shared/schema';

export interface CSVLead {
  name: string;
  email: string;
  company: string;
  role?: string;
  notes?: string;
}

export function parseLeadsFromCSV(csvContent: string): CSVLead[] {
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records.map((record: any) => ({
      name: record.name || record.Name || '',
      email: record.email || record.Email || '',
      company: record.company || record.Company || '',
      role: record.role || record.Role || record.title || record.Title || '',
      notes: record.notes || record.Notes || '',
    }));
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${error}`);
  }
}

export function validateCSVLeads(leads: CSVLead[]): { valid: CSVLead[]; errors: string[] } {
  const valid: CSVLead[] = [];
  const errors: string[] = [];

  leads.forEach((lead, index) => {
    const rowNumber = index + 1;
    
    if (!lead.name?.trim()) {
      errors.push(`Row ${rowNumber}: Name is required`);
      return;
    }
    
    if (!lead.email?.trim()) {
      errors.push(`Row ${rowNumber}: Email is required`);
      return;
    }
    
    if (!lead.company?.trim()) {
      errors.push(`Row ${rowNumber}: Company is required`);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lead.email)) {
      errors.push(`Row ${rowNumber}: Invalid email format`);
      return;
    }

    valid.push(lead);
  });

  return { valid, errors };
}

export function convertLeadsToCSV(leads: Lead[]): string {
  const csvData = leads.map(lead => ({
    name: lead.name,
    email: lead.email,
    company: lead.company,
    role: lead.role || '',
    status: lead.status,
    notes: lead.notes || '',
    lastContactDate: lead.lastContactDate?.toISOString().split('T')[0] || '',
    createdAt: lead.createdAt?.toISOString().split('T')[0] || '',
  }));

  return stringify(csvData, {
    header: true,
    columns: [
      'name',
      'email', 
      'company',
      'role',
      'status',
      'notes',
      'lastContactDate',
      'createdAt'
    ]
  });
}

export function getCSVTemplate(): string {
  const template = [
    { name: 'John Doe', email: 'john@example.com', company: 'Example Corp', role: 'CEO', notes: 'Interested in design services' },
  ];
  
  return stringify(template, {
    header: true,
    columns: ['name', 'email', 'company', 'role', 'notes']
  });
}
