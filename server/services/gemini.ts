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

  const prompt = `You are the world's #1 email copywriter with 15+ years creating IRRESISTIBLE emails with 40%+ open rates.
Your expertise: emails so compelling they feel like personal messages from a trusted colleague.

TARGET RECIPIENT: ${name}, ${role} at ${company}
SENDER: ${senderCompany} (Product Design and Branding Studio)  
TONE: ${tone}
${notesSection}

🎯 CRITICAL REQUIREMENTS - NO EXCEPTIONS:

1. SUBJECT LINE MASTERY (ABSOLUTELY COMPELLING):
   - MUST create instant curiosity that demands opening
   - 6-10 words MAXIMUM (mobile optimization)
   - Include ${name} when natural
   - Pattern interrupt that stands out in crowded inbox
   - Feel personal, NOT mass-sent
   - Pass the "coworker test" - could be from a colleague

2. EMAIL STRUCTURE & FORMATTING (PERFECT EVERY TIME):
   - Start: "Hi ${name}," (warm, personal greeting)
   - Use <br><br> for paragraph breaks (proper HTML formatting)
   - Short paragraphs: 1-2 sentences max
   - Clear visual hierarchy with proper spacing
   - End with professional signature block

3. OPENING HOOK (FIRST SENTENCE):
   - Must grab attention immediately
   - Create curiosity gap or pattern interrupt
   - Reference their company/role specifically
   - Feel researched and personalized
   - Make them want to keep reading

4. PSYCHOLOGY PRINCIPLES (ADVANCED):
   - Pattern interrupt: Start unexpectedly
   - Reciprocity: Give value before asking
   - Social proof: Mention similar company success
   - Curiosity gap: Intrigue that requires response
   - Authority: Show expertise subtly
   - Urgency: Natural timing reasons

5. CONVERSION ELEMENTS (HIGH-CONVERTING):
   - Focus on THEIR benefits, not your services
   - Include specific numbers/results when possible
   - Ask compelling question about their challenges
   - Provide easy, low-commitment next step
   - Create momentum toward response

6. FORMATTING REQUIREMENTS (MOBILE-OPTIMIZED):
   - Start with: Hi ${name},<br><br>
   - Use <br><br> between all paragraphs
   - End with: Best regards,<br>[Sender Name]<br>${senderCompany}
   - Maximum 150 words total
   - Scannable on mobile devices

7. QUALITY STANDARDS (MASTER-LEVEL):
   - Subject line is absolutely irresistible
   - Email feels like personal message, not marketing
   - Every word serves a purpose
   - Natural, conversational flow
   - Compels action through curiosity, not pressure

EXAMPLE PERFECT FORMAT:
{
  "subject": "[Compelling 4-6 word subject with curiosity]",
  "content": "Hi ${name},<br><br>[Attention-grabbing opening sentence about their company]<br><br>[Value proposition paragraph with specific benefit]<br><br>[Social proof or compelling question]<br><br>[Clear, simple call-to-action]<br><br>Best regards,<br>${senderName || 'The Team'}<br>${senderCompany}"
}

Create an email so compelling that ${name} will HAVE to open and respond.
Format as JSON with 'subject' and 'content' fields.`;

  console.log("[Enhanced Gemini Prompt]", prompt); // Debug log for prompt

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

  const prompt = `You are the world's #1 follow-up email copywriter with 40%+ response rates on follow-up sequences.
Your expertise: creating follow-ups that re-engage without being pushy or annoying.

TARGET: ${name}, ${role} at ${company} 
SENDER: ${senderCompany} (Product Design and Branding Studio)
TONE: ${tone}
FOLLOW-UP SEQUENCE: #${followUpSequence}
PREVIOUS EMAIL: ${previousEmailContent}
${notesSection}

🎯 CRITICAL FOLLOW-UP REQUIREMENTS - NO EXCEPTIONS:

1. SUBJECT LINE (ABSOLUTELY COMPELLING):
   - MUST be different from first email subject
   - Create fresh curiosity using new angle
   - 6-10 words maximum for mobile
   - Pattern interrupt that re-engages
   - Feel like natural conversation continuation

2. PERFECT FORMATTING (MOBILE-OPTIMIZED):
   - Start: "Hi ${name}," (warm acknowledgment)
   - Use <br><br> between all paragraphs 
   - Short paragraphs: 1-2 sentences max
   - End with professional signature
   - Maximum 120 words total

3. FOLLOW-UP #${followUpSequence} STRATEGY:
   ${followUpSequence === 1 ? `
   ✅ FIRST FOLLOW-UP PSYCHOLOGY:
   - Assume they're busy, not uninterested
   - Add NEW value/angle, don't repeat
   - Reference original email subtly
   - Create fresh reason to respond today
   - Show understanding of their time constraints
   ` : followUpSequence === 2 ? `
   ✅ SECOND FOLLOW-UP PSYCHOLOGY:
   - Acknowledge this is attempt #2 professionally
   - Shift value proposition completely
   - Include social proof or case study
   - Create gentle urgency without pressure  
   - Give easy "not interested" option
   ` : `
   ✅ FINAL FOLLOW-UP PSYCHOLOGY:
   - Last attempt with grace and class
   - Provide absolute best value upfront
   - Make it clear this is final email
   - End sequence professionally
   - Leave door open for future
   `}

4. RE-ENGAGEMENT ELEMENTS:
   - Fresh opening (different from email #1)
   - NEW information or angle
   - Social proof relevant to their situation
   - Different call-to-action approach
   - Respect their position and time

5. CONVERSION PSYCHOLOGY:
   - Pattern interrupt with new approach
   - Show you understand they got first email
   - Provide reason why timing matters now
   - Make response feel professional/smart
   - Lower barrier to engagement

6. FORMATTING STRUCTURE:
   Hi ${name},<br><br>
   [Acknowledge previous email subtly]<br><br>
   [New value proposition or angle]<br><br>
   [Social proof or compelling reason]<br><br>
   [Clear, appropriate CTA for sequence position]<br><br>
   Best regards,<br>
   [Name]<br>
   ${senderCompany}

QUALITY STANDARDS FOR FOLLOW-UP #${followUpSequence}:
- Subject line creates fresh curiosity
- Email feels like natural progression
- Adds genuine new value
- Respects their time and position
- Builds relationship even if no response
- Professional persistence without pest-istence

Create a follow-up so compelling they'll want to respond even if they ignored email #1.
Format as JSON with 'subject' and 'content' fields.`;

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