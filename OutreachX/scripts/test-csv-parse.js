// Quick test script to parse and validate CSV using server csvHandler logic
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

function parseLeadsFromCSV(csvContent) {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records.map((record) => ({
    name: record.name || record.Name || '',
    email: record.email || record.Email || '',
    company: record.company || record.Company || '',
    role: record.role || record.Role || record.title || record.Title || '',
    notes: record.notes || record.Notes || '',
  }));
}

function validateCSVLeads(leads) {
  const valid = [];
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
    if (!emailRegex.test(lead.email)) {
      errors.push(`Row ${rowNumber}: Invalid email format`);
      return;
    }
    valid.push(lead);
  });
  return { valid, errors };
}

const csvPath = path.join(__dirname, '..', 'sample-minimal-leads.csv');
const csv = fs.readFileSync(csvPath, 'utf8');
const parsed = parseLeadsFromCSV(csv);
const { valid, errors } = validateCSVLeads(parsed);
console.log('Parsed leads:', parsed);
console.log('Validation errors:', errors);
console.log('Valid leads count:', valid.length);
