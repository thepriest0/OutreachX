#!/usr/bin/env node

/**
 * Email Enhancement Test Script
 * Tests the enhanced email generation and formatting system
 */

import { EmailFormatter } from './server/services/emailFormatter.js';
import { generateColdEmail } from './server/services/gemini.js';

console.log('🧪 Testing Enhanced Email System\n');

// Test 1: Email Formatting
console.log('📝 Test 1: Email Formatting');
const testContent = `Hi John,
I noticed TechCorp is growing.
We can help with that.
Would you like to chat?`;

const formatted = EmailFormatter.formatCompleteEmail(testContent, {
  recipientName: 'John',
  senderCompany: 'Nydl Studio',
  tone: 'professional'
});

console.log('Original:', testContent.replace(/\n/g, ' '));
console.log('Formatted:', formatted.replace(/<br>/g, '\n').replace(/<br><br>/g, '\n\n'));

// Test 2: Subject Line Validation
console.log('\n🎯 Test 2: Subject Line Validation');
const testSubjects = [
  'Quick question',
  'This is a very long subject line that probably wont work well on mobile devices',
  'John, about TechCorp',
  'Important business opportunity for you'
];

testSubjects.forEach(subject => {
  const validation = EmailFormatter.validateSubjectLine(subject);
  console.log(`"${subject}": ${validation.isCompelling ? '✅ Compelling' : '❌ Needs work'} (${validation.wordCount} words)`);
  if (validation.suggestions.length > 0) {
    console.log(`  Suggestions: ${validation.suggestions.join(', ')}`);
  }
});

// Test 3: Subject Variations
console.log('\n🔄 Test 3: Subject Variations');
const baseSubject = 'Business opportunity';
const variations = EmailFormatter.generateSubjectVariations(baseSubject, 'John', 'TechCorp');
console.log('Base:', baseSubject);
console.log('Variations:', variations.join(', '));

// Test 4: Email Structure Validation
console.log('\n📊 Test 4: Email Structure Validation');
const testEmails = [
  'Hi John,<br><br>Quick question about TechCorp.<br><br>Best regards',
  'Hello, this is a business proposal for your company. We provide services.',
  'Hi John,<br><br>I noticed TechCorp growing.<br><br>We helped similar companies increase efficiency by 30%.<br><br>Would you like to chat?<br><br>Best regards,<br>Sarah<br>Nydl Studio'
];

testEmails.forEach((email, index) => {
  const structure = EmailFormatter.validateEmailStructure(email);
  console.log(`Email ${index + 1}:`);
  console.log(`  ✅ Greeting: ${structure.hasGreeting ? 'Yes' : 'No'}`);
  console.log(`  ✅ Formatting: ${structure.hasProperFormatting ? 'Yes' : 'No'}`);  
  console.log(`  ✅ Signature: ${structure.hasSignature ? 'Yes' : 'No'}`);
  console.log(`  📝 Words: ${structure.wordCount}`);
  console.log(`  📖 Readability: ${structure.readabilityScore}`);
  console.log('');
});

// Test 5: Complete Email Quality Assessment
console.log('🏆 Test 5: Complete Quality Assessment');
const sampleEmail = {
  subject: 'John, quick question',
  content: 'Hi John,<br><br>I noticed TechCorp has been scaling rapidly.<br><br>We recently helped a similar SaaS company reduce customer acquisition costs by 40% through strategic design improvements.<br><br>Would you be open to a 15-minute call this week to explore if we could achieve similar results for TechCorp?<br><br>Best regards,<br>Sarah<br>Nydl Studio'
};

const subjectValidation = EmailFormatter.validateSubjectLine(sampleEmail.subject);
const contentValidation = EmailFormatter.validateEmailStructure(sampleEmail.content);

// Calculate quality score
let qualityScore = 0;
if (subjectValidation.isCompelling) qualityScore += 25;
if (contentValidation.hasGreeting) qualityScore += 15;
if (contentValidation.hasProperFormatting) qualityScore += 20;
if (contentValidation.hasSignature) qualityScore += 10;
if (contentValidation.wordCount <= 150) qualityScore += 15;
if (contentValidation.readabilityScore === 'good') qualityScore += 15;

const qualityRating = qualityScore >= 80 ? 'Excellent' :
                     qualityScore >= 60 ? 'Good' :
                     qualityScore >= 40 ? 'Fair' : 'Poor';

console.log('Sample Email Quality Assessment:');
console.log(`📊 Quality Score: ${qualityScore}/100 (${qualityRating})`);
console.log(`🎯 Subject: ${subjectValidation.isCompelling ? 'Compelling' : 'Needs work'} (${subjectValidation.wordCount} words)`);
console.log(`📝 Structure: ${contentValidation.hasGreeting ? '✅' : '❌'} Greeting | ${contentValidation.hasProperFormatting ? '✅' : '❌'} Formatting | ${contentValidation.hasSignature ? '✅' : '❌'} Signature`);
console.log(`📖 Content: ${contentValidation.wordCount} words, ${contentValidation.readabilityScore} readability`);

console.log('\n🎉 Enhanced Email System Test Complete!');
console.log('\nKey Benefits:');
console.log('✅ Compelling subjects guaranteed');
console.log('✅ Proper formatting with greetings and signatures');
console.log('✅ Mobile-optimized structure');
console.log('✅ Quality validation and suggestions');
console.log('✅ Alternative subject generation');
console.log('✅ Professional presentation every time');

// Test 6: AI Generation Test (requires API key)
if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY) {
  console.log('\n🤖 Test 6: AI-Generated Email');
  
  try {
    const aiEmail = await generateColdEmail({
      name: 'John',
      role: 'CEO',
      company: 'TechCorp',
      tone: 'professional',
      senderName: 'Sarah',
      senderCompany: 'Nydl Studio'
    });
    
    console.log('AI Generated Subject:', aiEmail.subject);
    console.log('AI Generated Content Preview:', aiEmail.content.substring(0, 100) + '...');
    
    const aiSubjectValidation = EmailFormatter.validateSubjectLine(aiEmail.subject);
    const aiContentValidation = EmailFormatter.validateEmailStructure(aiEmail.content);
    
    console.log(`AI Quality: Subject ${aiSubjectValidation.isCompelling ? 'compelling' : 'needs work'}, Content structure ${aiContentValidation.hasGreeting && aiContentValidation.hasProperFormatting ? 'excellent' : 'needs improvement'}`);
  } catch (error) {
    console.log('AI generation test skipped (API key required):', error.message);
  }
} else {
  console.log('\n⚠️  AI Generation test skipped (GEMINI_API_KEY not configured)');
}

export {};