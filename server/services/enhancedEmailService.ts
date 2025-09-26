import { EmailGenerationRequest, EmailGenerationResponse } from "./gemini";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || ""
});

export interface EnhancedEmailGenerationRequest extends EmailGenerationRequest {
  industryContext?: string;
  recentNews?: string;
  painPoints?: string[];
  companySize?: string;
}

export interface EnhancedEmailGenerationResponse extends EmailGenerationResponse {
  alternativeSubjects: string[];
  formattedContent: string;
  personalizedGreeting: string;
}

/**
 * Enhanced email generation service that ensures:
 * 1. Compelling subjects EVERY TIME
 * 2. Proper formatting with line breaks
 * 3. Professional greetings and introductions
 * 4. Multiple subject line options
 */
export class EnhancedEmailService {
  
  /**
   * Generate compelling subject lines that are irresistible
   */
  private async generateCompellingSubjects(
    name: string, 
    company: string, 
    tone: string,
    context?: string
  ): Promise<string[]> {
    const subjectPrompt = `You are the world's best email subject line copywriter. Your subject lines have a 40%+ open rate.

TARGET: ${name} at ${company}
TONE: ${tone}
CONTEXT: ${context || 'General business outreach'}

MASTER COPYWRITER'S SUBJECT LINE PSYCHOLOGY:
- Curiosity gaps that demand to be closed
- Pattern interrupts that stand out in inbox
- Personal relevance that feels handpicked
- Urgency without being salesy
- Intrigue that hints at value

PROVEN HIGH-CONVERTING FORMULAS:
1. "[Name], quick question about [Company]"  
2. "30 seconds to save [Company] [specific benefit]?"
3. "[Company] + [result] = [timeframe]?"
4. "Your [specific pain point] caught my attention"
5. "[Industry] insight for [Name]"
6. "This reminded me of [Company]"
7. "[Specific result] in [timeframe] possible?"

SUBJECT LINE REQUIREMENTS:
- Maximum 10 words (mobile optimization)
- Include recipient name when natural
- Create immediate curiosity
- Hint at value without revealing all
- Feel personal, not mass-sent
- Pass the "coworker test" - could be from a colleague

Generate 5 different compelling subject lines using different psychological triggers.
Make each one irresistible to open.

Format as JSON array of strings.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            items: { type: "string" }
          },
        },
        contents: subjectPrompt,
      });

      const subjects = JSON.parse(response.text || '[]');
      return subjects.length > 0 ? subjects : [`${name}, quick question`];
    } catch (error) {
      console.error('Subject generation failed:', error);
      return [`${name}, quick question`, `About ${company}`, `30 second question`];
    }
  }

  /**
   * Generate properly formatted email content with perfect structure
   */
  private async generateEnhancedEmailContent(request: EnhancedEmailGenerationRequest): Promise<string> {
    const { name, role, company, tone, senderName, senderCompany, notes, industryContext, painPoints } = request;

    const contextSection = [
      industryContext && `Industry Context: ${industryContext}`,
      painPoints && `Known Pain Points: ${painPoints.join(', ')}`,
      notes && `Special Notes: ${notes}`
    ].filter(Boolean).join('\n');

    const enhancedPrompt = `You are a master email copywriter who creates perfectly formatted, compelling outreach emails.

TARGET: ${name}, ${role} at ${company}
SENDER: ${senderCompany}
TONE: ${tone}

${contextSection && `ADDITIONAL CONTEXT:\n${contextSection}\n`}

ENHANCED EMAIL REQUIREMENTS:

1. PERFECT FORMATTING (CRITICAL):
   - Start with warm, personalized greeting
   - Use proper line breaks between paragraphs
   - Include proper spacing for readability
   - End with professional signature
   - Use HTML formatting: <br><br> for paragraph breaks

2. COMPELLING STRUCTURE:
   - Greeting: Warm, personal, mentions their name
   - Hook: Immediate attention grabber (first sentence)
   - Credibility: Quick establishment of authority
   - Value Proposition: Clear benefit for them
   - Social Proof: Subtle mention of success with similar companies
   - Call to Action: Simple, low-commitment request
   - Professional Close: Warm but professional ending

3. PSYCHOLOGICAL ELEMENTS:
   - Pattern interrupt in opening
   - Reciprocity (offer value first)
   - Social proof naturally woven in
   - Curiosity gap that requires response
   - Urgency without pressure

4. PERSONALIZATION REQUIREMENTS:
   - Reference their company specifically
   - Mention their role/responsibilities
   - Include relevant industry insights
   - Use provided notes/context naturally

5. FORMATTING STANDARDS:
   - Maximum 140 words
   - Short paragraphs (1-2 sentences)
   - Clear line breaks between ideas
   - Professional but conversational tone
   - Mobile-friendly formatting

EXAMPLE PERFECT FORMAT:
Hi [Name],<br><br>

[Compelling opening sentence that grabs attention]<br><br>

[One sentence establishing credibility and relevance]<br><br>

[Value proposition paragraph - what's in it for them]<br><br>

[Social proof or specific benefit]<br><br>

[Simple, clear call to action]<br><br>

Best regards,<br>
[Sender Name]<br>
${senderCompany}

Generate the email content with perfect formatting and compelling copy that demands a response.
Return only the formatted email content as a string.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: enhancedPrompt,
      });

      return response.text || this.getFallbackEmail(name, company, senderCompany);
    } catch (error) {
      console.error('Enhanced email generation failed:', error);
      return this.getFallbackEmail(name, company, senderCompany);
    }
  }

  /**
   * Fallback email with proper formatting
   */
  private getFallbackEmail(name: string, company: string, senderCompany: string): string {
    return `Hi ${name},<br><br>

I noticed ${company} is growing rapidly and thought you might be interested in how we've helped similar companies streamline their operations.<br><br>

We recently helped a company in your space increase efficiency by 30% in just 6 weeks.<br><br>

Would you be open to a brief 15-minute conversation this week to explore if we could achieve similar results for ${company}?<br><br>

Best regards,<br>
The ${senderCompany} Team`;
  }

  /**
   * Generate personalized greeting based on tone and context
   */
  private generatePersonalizedGreeting(name: string, tone: string, timeOfDay?: string): string {
    const greetings = {
      professional: [`Dear ${name},`, `Hello ${name},`, `Hi ${name},`],
      casual: [`Hi ${name}!`, `Hey ${name},`, `Hello ${name}!`],
      direct: [`${name},`, `Hi ${name},`]
    };

    const toneGreetings = greetings[tone as keyof typeof greetings] || greetings.professional;
    return toneGreetings[0]; // Return the first option
  }

  /**
   * Enhanced cold email generation with compelling subjects and perfect formatting
   */
  async generateEnhancedColdEmail(request: EnhancedEmailGenerationRequest): Promise<EnhancedEmailGenerationResponse> {
    try {
      // Generate multiple compelling subject lines
      const subjects = await this.generateCompellingSubjects(
        request.name, 
        request.company, 
        request.tone,
        request.industryContext
      );

      // Generate enhanced email content with perfect formatting
      const content = await this.generateEnhancedEmailContent(request);

      // Generate personalized greeting
      const greeting = this.generatePersonalizedGreeting(request.name, request.tone);

      return {
        subject: subjects[0], // Primary subject
        content: content,
        alternativeSubjects: subjects.slice(1), // Alternative options
        formattedContent: content, // Already formatted
        personalizedGreeting: greeting
      };
    } catch (error) {
      console.error('Enhanced email generation failed:', error);
      throw new Error(`Failed to generate enhanced email: ${error}`);
    }
  }

  /**
   * Enhanced follow-up email generation
   */
  async generateEnhancedFollowUp(request: EnhancedEmailGenerationRequest & {
    previousEmailContent: string;
    followUpSequence?: number;
  }): Promise<EnhancedEmailGenerationResponse> {
    const followUpPrompt = `You are a master follow-up email copywriter creating email #${request.followUpSequence || 1} in a sequence.

TARGET: ${request.name}, ${request.role} at ${request.company}
PREVIOUS EMAIL: ${request.previousEmailContent}
FOLLOW-UP #: ${request.followUpSequence || 1}

ENHANCED FOLLOW-UP REQUIREMENTS:

1. PERFECT FORMATTING:
   - Proper greeting with name
   - Clear paragraph breaks with <br><br>
   - Professional structure
   - Clean, mobile-friendly layout

2. FOLLOW-UP PSYCHOLOGY:
   - Acknowledge previous email subtly
   - Add NEW value, don't repeat
   - Create fresh curiosity
   - Show persistence without being pushy
   - Include easy "out" option

3. SEQUENCE-SPECIFIC APPROACH:
   ${request.followUpSequence === 1 ? 'First follow-up: Add value, show you understand they\'re busy' :
     request.followUpSequence === 2 ? 'Second follow-up: More direct, include social proof' :
     'Final follow-up: Last attempt with grace, provide best value upfront'}

4. COMPELLING ELEMENTS:
   - Different angle from previous email
   - Fresh reason to respond
   - Specific value proposition
   - Clear, simple call to action

Generate perfectly formatted follow-up email that compels response.
Maximum 120 words, proper HTML formatting with <br><br> for breaks.

Return only the formatted email content.`;

    try {
      const subjects = await this.generateCompellingSubjects(
        request.name, 
        request.company, 
        request.tone,
        `Follow-up #${request.followUpSequence || 1}`
      );

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: followUpPrompt,
      });

      const content = response.text || this.getFallbackFollowUp(request.name, request.company, request.senderCompany);

      return {
        subject: subjects[0],
        content: content,
        alternativeSubjects: subjects.slice(1),
        formattedContent: content,
        personalizedGreeting: this.generatePersonalizedGreeting(request.name, request.tone)
      };
    } catch (error) {
      console.error('Enhanced follow-up generation failed:', error);
      throw new Error(`Failed to generate enhanced follow-up: ${error}`);
    }
  }

  /**
   * Fallback follow-up email
   */
  private getFallbackFollowUp(name: string, company: string, senderCompany: string): string {
    return `Hi ${name},<br><br>

Following up on my previous email about helping ${company} improve efficiency.<br><br>

I understand you're busy, but wanted to share one quick insight that could save you significant time this quarter.<br><br>

Would you be interested in a 10-minute call to discuss how we've helped similar companies?<br><br>

Best regards,<br>
The ${senderCompany} Team`;
  }

  /**
   * Validate and ensure proper email formatting
   */
  formatEmailContent(content: string): string {
    // Ensure proper line breaks
    if (!content.includes('<br>')) {
      content = content.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    }

    // Ensure proper greeting if missing
    if (!content.toLowerCase().includes('hi ') && !content.toLowerCase().includes('hello ') && !content.toLowerCase().includes('dear ')) {
      const lines = content.split('<br><br>');
      if (lines.length > 0) {
        // Add greeting if first line doesn't have one
        const firstLine = lines[0].trim();
        if (!firstLine.toLowerCase().match(/^(hi|hello|dear)\s/)) {
          content = `Hi there,<br><br>${content}`;
        }
      }
    }

    // Ensure professional closing if missing
    if (!content.toLowerCase().includes('best regards') && !content.toLowerCase().includes('sincerely') && !content.toLowerCase().includes('thank you')) {
      content += '<br><br>Best regards';
    }

    return content;
  }
}

export const enhancedEmailService = new EnhancedEmailService();