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
   - MUST hint at design services (product design, UI/UX, branding, etc.)
   - NEVER vague subjects like "Quick question" or company name only
   - Must create curiosity while being clear about your design expertise

2. EMAIL FORMATTING IS MANDATORY:
   - Start with: "Hi ${name},"
   - Each paragraph separated by TWO line breaks (\\n\\n)
   - Maximum 2 sentences per paragraph
   - End with: "Best regards,\\n${senderCompany} Team"
   - PERFECT formatting required - no walls of text

3. CONTENT PRIORITIZATION:
   - IF NOTES ARE PROVIDED: Use them as primary personalization - reference specific details from notes naturally
   - Primary service: Product Design (UI/UX, app design, web design)
   - Secondary services: Branding, visual identity, design systems
   - Focus on their business needs and how design can solve their problems
   - Tailor service mentions based on their role and company type

4. EMAIL STRUCTURE (EXACTLY 4 PARAGRAPHS):

   Paragraph 1: Personal greeting + attention-grabbing opener (use notes if available)
   
   Paragraph 2: What you do (product design focus) and how it helps companies like theirs
   
   Paragraph 3: Social proof or specific benefit they'd get from design improvements
   
   Paragraph 4: Clear call-to-action + professional closing

5. CONTENT REQUIREMENTS:
   - Clearly state you're a product design studio (mention UI/UX, app design, web design)
   - Reference branding only if relevant to their business or mentioned in notes
   - Include specific benefits for their business type
   - Professional but conversational tone
   - Focus on their success through better design

Your response MUST:
- Have a subject line that clearly hints at design services (not just branding)
- Be perfectly formatted with proper line breaks (\\n\\n)
- Prioritize and reference NOTES if provided for personalization
- Focus on product design as primary service
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
   - Should reference follow-up context and design services
   - Create compelling reason to open this follow-up

2. MANDATORY EMAIL FORMATTING:
   - Start with: "Hi ${name},"
   - Each paragraph separated by TWO line breaks (\\n\\n)
   - Maximum 2 sentences per paragraph
   - End with: "Best regards,\\n${senderCompany} Team"
   - NO walls of text - perfect formatting required

3. CONTENT PRIORITIZATION:
   - IF NOTES ARE PROVIDED: Use them as primary personalization source
   - Focus on product design services (UI/UX, app design, web design)
   - Mention branding only if relevant or in notes
   - Reference specific details from notes naturally if available

4. FOLLOW-UP STRUCTURE (EXACTLY 3-4 PARAGRAPHS):

   Paragraph 1: Reference previous email + acknowledge they're busy
   
   Paragraph 2: NEW value or angle (never repeat previous content) - use notes if available
   
   Paragraph 3: ${followUpSequence === 1 ? 'Social proof or specific benefit' : followUpSequence === 2 ? 'Urgency or final opportunity' : 'Graceful final attempt with door left open'}
   
   Paragraph 4: Clear call-to-action + professional closing

5. FOLLOW-UP #${followUpSequence} STRATEGY:
   ${followUpSequence === 1 ? 
     `- Show understanding they're busy
      - Add fresh perspective on design benefits
      - Reference previous email briefly
      - Create new reason to respond`
     : followUpSequence === 2 ?
     `- Acknowledge second attempt professionally
      - Provide compelling design case study or result
      - Create appropriate urgency without pressure
      - Make it easy to say yes or no`
     : `- Final attempt with complete professionalism
      - Offer best design value upfront
      - Make clear this is last email
      - Leave door open respectfully`}

Your response MUST:
- Have a compelling subject that's different from previous email
- Be perfectly formatted with proper line breaks (\\n\\n)
- Prioritize and reference NOTES if provided for personalization
- Focus on product design as primary service
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