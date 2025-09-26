import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || ""
});

export interface EmailGenerationRequest {
  name: string;
  role: string;
  company: string;
  tone: 'professional' | 'casual' | 'direct';
  isFollowUp?: boolean;
  previousEmailContent?: string;
  senderName: string;
  senderCompany: string;
  notes?: string;
}

export interface EmailGenerationResponse {
  subject: string;
  content: string;
}

export async function generateColdEmail(request: EmailGenerationRequest): Promise<EmailGenerationResponse> {
  const { name, role, company, tone, senderName, senderCompany, notes } = request;

  const notesSection = notes
    ? `\n\nIMPORTANT: The following notes contain key information about ${name.toUpperCase()} that MUST be used to personalize and tailor the email.\nNOTES:\n${notes}\n\nYou should prioritize these notes when crafting the email. Reference them directly if possible, and ensure the email feels highly personalized based on this context.`
    : '';

  const prompt = `You are an expert email copywriter. Your task is to write a compelling cold outreach email that gets opened and responded to.

TARGET: ${name}, ${role} at ${company}
FROM: ${senderCompany} (Product Design and Branding Studio)
TONE: ${tone}
${notesSection}

CRITICAL REQUIREMENTS - FAILURE TO FOLLOW MEANS REJECTION:

1. SUBJECT LINE MUST BE COMPELLING AND CLEAR:
   - 6-12 words that immediately communicate VALUE or BENEFIT to them
   - MUST hint at what you're offering (design services, branding help, etc.)
   - Examples: "Transform ${company}'s brand in 30 days", "Design upgrade for ${company}", "Brand makeover proposal for ${name}", "${company} deserves better branding"
   - NEVER vague subjects like "Quick question" or company name only
   - Must create curiosity while being clear about your intent

2. EMAIL FORMATTING IS MANDATORY:
   - Start with: "Hi ${name},"
   - Each paragraph separated by TWO line breaks (\\n\\n)
   - Maximum 2 sentences per paragraph
   - End with: "Best regards,\\n${senderCompany} Team"
   - PERFECT formatting required - no walls of text

3. EMAIL STRUCTURE (EXACTLY 4 PARAGRAPHS):

   Paragraph 1: Personal greeting + attention-grabbing opener about their business
   
   Paragraph 2: What you do and how it specifically helps companies like theirs
   
   Paragraph 3: Social proof or specific benefit they'd get
   
   Paragraph 4: Clear call-to-action + professional closing

4. CONTENT REQUIREMENTS:
   - Clearly state you're offering design/branding services
   - Mention specific benefits for their business
   - Include a compelling reason to respond
   - Professional but conversational tone
   - Focus on their success, not your services

EXAMPLE STRUCTURE:
{
  "subject": "Brand transformation for ${company}",
  "content": "Hi ${name},\\n\\nI noticed ${company}'s innovative approach to [industry] and thought you might be interested in a brand upgrade that matches your forward-thinking vision.\\n\\nWe help companies like yours increase customer trust and sales through strategic design and branding that tells your story powerfully.\\n\\nOur recent client saw a 40% increase in customer engagement after their brand refresh, and I believe ${company} could see similar results.\\n\\nWould you be open to a brief 15-minute call this week to discuss how we could elevate ${company}'s brand?\\n\\nBest regards,\\n${senderCompany} Team"
}

Your response MUST:
- Have a subject line that clearly hints at design/branding services
- Be perfectly formatted with proper line breaks (\\n\\n)
- Have exactly 4 well-structured paragraphs
- Start with "Hi ${name}," and end with "Best regards,\\n${senderCompany} Team"
- Be compelling and professional

Generate the email now:`;

  console.log("[Gemini Prompt]", prompt); // Debug log for prompt

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            content: { type: "string" },
          },
          required: ["subject", "content"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const data: EmailGenerationResponse = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    throw new Error(`Failed to generate email: ${error}`);
  }
}

export async function generateFollowUpEmail({
  name,
  role,
  company,
  tone,
  isFollowUp = false,
  previousEmailContent,
  followUpSequence = 1,
  senderName,
  senderCompany,
  notes,
}: {
  name: string;
  role: string;
  company: string;
  tone: string;
  isFollowUp?: boolean;
  previousEmailContent?: string;
  followUpSequence?: number;
  senderName: string;
  senderCompany: string;
  notes?: string;
}): Promise<EmailGenerationResponse> {
  const sequenceContext = {
    1: "This is the first follow-up. Gently remind them of your previous email and add additional value or a different angle.",
    2: "This is the second follow-up. Be more direct but still professional. Mention that you've reached out before and provide a clear reason to respond.",
    3: "This is the final follow-up. Be respectful but direct. Mention this is your last attempt and provide a compelling reason to connect."
  };

  const sequenceGuidance = sequenceContext[followUpSequence as keyof typeof sequenceContext] || sequenceContext[1];

  const notesSection = notes
    ? `\n\nIMPORTANT: The following notes contain key information about ${name.toUpperCase()} that MUST be used to personalize and tailor the follow-up email.\nNOTES:\n${notes}\n\nYou should prioritize these notes when crafting the follow-up. Reference them directly if possible, and ensure the email feels highly personalized based on this context.`
    : '';

  const prompt = `You are an expert email copywriter. Your task is to write a compelling follow-up email that gets responses.

TARGET: ${name}, ${role} at ${company} 
FROM: ${senderCompany} (Product Design and Branding Studio)
TONE: ${tone}
FOLLOW-UP #: ${followUpSequence}
PREVIOUS EMAIL: ${previousEmailContent}
${notesSection}

CRITICAL REQUIREMENTS - FOLLOW EXACTLY OR EMAIL WILL BE REJECTED:

1. SUBJECT LINE REQUIREMENTS:
   - Must be different from previous email subject
   - 6-12 words that create urgency or curiosity
   - Examples for follow-up #${followUpSequence}:
   ${followUpSequence === 1 ? 
     `• "Following up on ${company}'s brand design"
      • "${name}, did you see my design proposal?"
      • "Brand upgrade timeline for ${company}"
      • "Quick follow-up about ${company}"`
     : followUpSequence === 2 ?
     `• "Final proposal for ${company}'s branding"  
      • "${name}, last chance for brand upgrade"
      • "Closing our branding discussion"
      • "One more try - ${company}'s design"`
     : `• "Last email about ${company}'s branding"
      • "Final note on your brand upgrade"
      • "Closing the loop on ${company}'s design"
      • "My final design proposal"`}

2. MANDATORY EMAIL FORMATTING:
   - Start with: "Hi ${name},"
   - Each paragraph separated by TWO line breaks (\\n\\n)
   - Maximum 2 sentences per paragraph
   - End with: "Best regards,\\n${senderCompany} Team"
   - NO walls of text - perfect formatting required

3. FOLLOW-UP STRUCTURE (EXACTLY 3-4 PARAGRAPHS):

   Paragraph 1: Reference previous email + acknowledge they're busy
   
   Paragraph 2: NEW value or angle (never repeat previous content)
   
   Paragraph 3: ${followUpSequence === 1 ? 'Social proof or specific benefit' : followUpSequence === 2 ? 'Urgency or final opportunity' : 'Graceful final attempt with door left open'}
   
   Paragraph 4: Clear call-to-action + professional closing

4. FOLLOW-UP #${followUpSequence} STRATEGY:
   ${followUpSequence === 1 ? 
     `- Show understanding they're busy
      - Add fresh perspective on branding benefits
      - Reference previous email briefly
      - Create new reason to respond`
     : followUpSequence === 2 ?
     `- Acknowledge second attempt professionally
      - Provide compelling case study or result
      - Create appropriate urgency without pressure
      - Make it easy to say yes or no`
     : `- Final attempt with complete professionalism
      - Offer best value upfront
      - Make clear this is last email
      - Leave door open respectfully`}

EXAMPLE STRUCTURE:
{
  "subject": "${followUpSequence === 1 ? `Following up on ${company}'s branding` : followUpSequence === 2 ? `Final branding proposal for ${company}` : `Last note about ${company}'s design`}",
  "content": "Hi ${name},\\n\\n${followUpSequence === 1 ? `I sent an email last week about elevating ${company}'s brand design and wanted to follow up in case it got buried in your inbox.` : followUpSequence === 2 ? `I've reached out twice now about ${company}'s branding opportunity and wanted to try one more time.` : `This is my final email about the branding opportunity for ${company}.`}\\n\\n${followUpSequence === 1 ? `Since then, I've been thinking about how a strategic rebrand could help ${company} stand out even more in your competitive market.` : followUpSequence === 2 ? `We just helped a similar company increase their customer trust by 45% through strategic branding, and I believe ${company} could see similar results.` : `I genuinely believe ${company} has incredible potential for a brand transformation that could significantly impact your growth.`}\\n\\n${followUpSequence === 1 ? `Would you be interested in a quick 15-minute call this week to explore how we could enhance ${company}'s brand presence?` : followUpSequence === 2 ? `If you're interested, I'd love to share some specific ideas for ${company}. If not, I completely understand and won't reach out again.` : `If there's any interest in discussing this, I'm here. If not, I respect your decision and wish ${company} continued success.`}\\n\\nBest regards,\\n${senderCompany} Team"
}

Your response MUST:
- Have a compelling subject that's different from previous email
- Be perfectly formatted with proper line breaks (\\n\\n)
- Reference previous email appropriately for sequence #${followUpSequence}
- Start with "Hi ${name}," and end with "Best regards,\\n${senderCompany} Team"
- Add NEW value, never repeat previous content

Generate the follow-up email now:`;

  console.log("[Gemini Prompt]", prompt); // Debug log for prompt

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            content: { type: "string" },
          },
          required: ["subject", "content"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const data: EmailGenerationResponse = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    throw new Error(`Failed to generate follow-up email: ${error}`);
  }
}

export interface InsightRequest {
  totalLeads: number;
  emailsSent: number;
  responseRate: number;
  followupsScheduled: number;
  timeframe: string;
}

export async function generateInsights(data: InsightRequest): Promise<string> {
  const prompt = `Based on this outreach data: ${JSON.stringify(data)}, summarize trends in 3 sentences or less. 
Mention reply rate, follow-up effectiveness, and any improvement suggestions.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    throw new Error(`Failed to generate insights: ${error}`);
  }
}