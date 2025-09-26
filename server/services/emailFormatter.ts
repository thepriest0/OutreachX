/**
 * Email formatting utilities to ensure consistent, compelling email structure
 * Guarantees proper formatting, greetings, and professional presentation
 */

export interface EmailFormatOptions {
  recipientName: string;
  senderName?: string;
  senderCompany: string;
  includeSignature?: boolean;
  tone?: 'professional' | 'casual' | 'direct';
}

export class EmailFormatter {
  
  /**
   * Ensures email has proper greeting
   */
  static ensureProperGreeting(content: string, recipientName: string, tone: string = 'professional'): string {
    const greetings = {
      professional: `Hi ${recipientName},`,
      casual: `Hi ${recipientName}!`,  
      direct: `${recipientName},`
    };

    const greeting = greetings[tone as keyof typeof greetings] || greetings.professional;
    
    // Check if email already has proper greeting
    const hasGreeting = content.toLowerCase().match(/^(hi|hello|dear)\s+\w+[,!]/);
    
    if (!hasGreeting) {
      content = `${greeting}<br><br>${content}`;
    }
    
    return content;
  }

  /**
   * Ensures proper HTML formatting with line breaks
   */
  static ensureProperFormatting(content: string): string {
    // Convert plain text line breaks to HTML
    if (!content.includes('<br>')) {
      content = content
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
    }

    // Ensure double line breaks between paragraphs
    content = content.replace(/<br><br><br>/g, '<br><br>');
    
    // Ensure proper spacing around line breaks
    content = content.replace(/\s*<br>\s*/g, '<br>');
    content = content.replace(/\s*<br><br>\s*/g, '<br><br>');

    return content;
  }

  /**
   * Ensures professional email signature
   */
  static ensureProperSignature(content: string, senderName?: string, senderCompany?: string): string {
    const hasSignature = content.toLowerCase().includes('best regards') || 
                        content.toLowerCase().includes('sincerely') ||
                        content.toLowerCase().includes('thanks') ||
                        content.toLowerCase().includes('kind regards');

    if (!hasSignature && senderCompany) {
      const signature = senderName 
        ? `<br><br>Best regards,<br>${senderName}<br>${senderCompany}`
        : `<br><br>Best regards,<br>The ${senderCompany} Team`;
      
      content += signature;
    }

    return content;
  }

  /**
   * Validates and enhances email content structure
   */
  static validateEmailStructure(content: string): {
    hasGreeting: boolean;
    hasProperFormatting: boolean;
    hasSignature: boolean;
    wordCount: number;
    readabilityScore: 'good' | 'fair' | 'poor';
  } {
    const hasGreeting = /^(hi|hello|dear)\s+\w+[,!]/i.test(content);
    const hasProperFormatting = content.includes('<br><br>');
    const hasSignature = /(best regards|sincerely|thanks|kind regards)/i.test(content);
    
    // Remove HTML tags for word count
    const plainText = content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).length;
    
    // Simple readability assessment
    const sentences = plainText.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentences;
    const readabilityScore = avgWordsPerSentence < 15 ? 'good' : 
                           avgWordsPerSentence < 20 ? 'fair' : 'poor';

    return {
      hasGreeting,
      hasProperFormatting,
      hasSignature,
      wordCount,
      readabilityScore
    };
  }

  /**
   * Complete email formatting pipeline
   */
  static formatCompleteEmail(content: string, options: EmailFormatOptions): string {
    let formattedEmail = content;

    // 1. Ensure proper greeting
    formattedEmail = this.ensureProperGreeting(formattedEmail, options.recipientName, options.tone);

    // 2. Ensure proper HTML formatting
    formattedEmail = this.ensureProperFormatting(formattedEmail);

    // 3. Ensure proper signature
    if (options.includeSignature !== false) {
      formattedEmail = this.ensureProperSignature(formattedEmail, options.senderName, options.senderCompany);
    }

    // 4. Final cleanup
    formattedEmail = this.finalCleanup(formattedEmail);

    return formattedEmail;
  }

  /**
   * Final cleanup to remove any formatting issues
   */
  private static finalCleanup(content: string): string {
    // Remove excessive line breaks
    content = content.replace(/(<br><br>){3,}/g, '<br><br>');
    
    // Trim whitespace
    content = content.trim();
    
    // Ensure no trailing commas or periods before line breaks
    content = content.replace(/[,.](\s*<br>)/g, '$1');

    return content;
  }

  /**
   * Generate subject line variations for A/B testing
   */
  static generateSubjectVariations(baseSubject: string, recipientName: string, company: string): string[] {
    const variations = [
      baseSubject,
      `${recipientName}, ${baseSubject.toLowerCase()}`,
      `Quick question about ${company}`,
      `${company} + 30 seconds`,
      `This caught my attention, ${recipientName}`,
      `${recipientName}, brief question`
    ];

    // Remove duplicates and return unique variations
    const uniqueVariations = Array.from(new Set(variations));
    return uniqueVariations.slice(0, 4);
  }

  /**
   * Validate subject line quality
   */
  static validateSubjectLine(subject: string): {
    length: number;
    wordCount: number;
    hasPersonalization: boolean;
    hasCuriosity: boolean;
    isCompelling: boolean;
    suggestions: string[];
  } {
    const length = subject.length;
    const wordCount = subject.split(/\s+/).length;
    const hasPersonalization = /\b(you|your|you're)\b/i.test(subject) || subject.includes(',');
    
    const curiosityWords = ['question', 'quick', 'about', 'regarding', 'thought', 'noticed', 'caught'];
    const hasCuriosity = curiosityWords.some(word => subject.toLowerCase().includes(word));
    
    const isCompelling = length <= 50 && wordCount <= 6 && (hasPersonalization || hasCuriosity);
    
    const suggestions = [];
    if (length > 50) suggestions.push('Shorten subject line for mobile (under 50 characters)');
    if (wordCount > 6) suggestions.push('Reduce word count (6 words or less)');
    if (!hasPersonalization && !hasCuriosity) suggestions.push('Add personalization or curiosity element');
    if (!hasCuriosity) suggestions.push('Create more curiosity to increase open rates');

    return {
      length,
      wordCount,
      hasPersonalization,
      hasCuriosity,
      isCompelling,
      suggestions
    };
  }
}

/**
 * Pre-built templates for common email scenarios
 */
export class EmailTemplates {
  
  static getCompellingSubjects(name: string, company: string): string[] {
    return [
      `${name}, quick question`,
      `About ${company}`,
      `${name}, 30 seconds?`,
      `Quick ${company} question`,
      `${name}, this caught my attention`,
      `Noticed ${company}'s growth`
    ];
  }

  static getColdEmailTemplate(name: string, company: string, senderCompany: string): string {
    return `Hi ${name},<br><br>I noticed ${company} has been growing rapidly in your space.<br><br>We recently helped a similar company increase their efficiency by 30% in just 6 weeks using our design solutions.<br><br>Would you be open to a brief 15-minute conversation this week to explore if we could achieve similar results for ${company}?<br><br>Best regards,<br>The ${senderCompany} Team`;
  }

  static getFollowUpTemplate(name: string, company: string, senderCompany: string): string {
    return `Hi ${name},<br><br>Following up on my previous email about helping ${company} improve efficiency.<br><br>I understand you're busy, but wanted to share one insight that could save you significant time this quarter.<br><br>Would you be interested in a 10-minute call this week?<br><br>Best regards,<br>The ${senderCompany} Team`;
  }
}