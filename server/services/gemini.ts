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

  const prompt = `You are a senior copywriter with 10+ years of experience writing high-converting cold outreach emails. 
Your expertise lies in creating emails that feel genuinely human, build immediate trust, and compel action.

TARGET RECIPIENT: ${name}, ${role} at ${company}
SENDER: ${senderCompany} (Product Design and Branding Studio)
TONE: ${tone}
${notesSection}

COPYWRITER'S FRAMEWORK - FOLLOW THIS EXACTLY:

1. PSYCHOLOGY PRINCIPLES TO APPLY:
   - Pattern interrupt: Start with something unexpected or intriguing
   - Reciprocity: Offer genuine value upfront without asking for anything
   - Social proof: Subtly reference success with similar companies/roles
   - Curiosity gap: Create intrigue that can only be resolved by responding
   - Authority: Demonstrate expertise without being pushy

2. MASTER COPYWRITER'S EMAIL STRUCTURE:
   - Subject: Creates curiosity without being clickbait (6-8 words max)
   - Hook: First sentence must grab attention and feel personal
   - Credibility: Establish relevance and authority quickly
   - Value: Offer something specific and valuable
   - Soft close: Natural, conversational call-to-action
   - Human touch: End with something that shows you're a real person

3. ADVANCED WRITING TECHNIQUES:
   - Use conversational language like you're talking to a colleague
   - Include specific numbers, timeframes, or results when possible
   - Ask a thought-provoking question that relates to their role/company
   - Use "you" more than "I" or "we" (focus on them, not you)
   - Include a subtle "reason why" for reaching out now
   - End with the easiest possible next step

4. PERSONALIZATION REQUIREMENTS:
   - If notes are provided, weave them naturally into the email
   - Research-based insights about their company/industry
   - Reference their specific role responsibilities
   - Mention relevant challenges they likely face

5. CONVERSION PSYCHOLOGY:
   - Create a sense of momentum (not urgency)
   - Make responding feel like the smart thing to do
   - Reduce friction in the call-to-action
   - Build a micro-relationship in the first email

6. HUMAN ELEMENTS (CRITICAL):
   - Write like a real person, not a marketing robot
   - Include a conversational element or mild humor if appropriate
   - Show genuine interest in their success, not just your sale
   - Use natural transitions between thoughts
   - End with warmth, not corporate coldness

QUALITY STANDARDS:
- Email must pass the "friend test" - would a friend send this?
- Zero marketing jargon or corporate speak
- Every sentence must advance the conversation toward your goal
- Subject + first sentence must work together seamlessly
- Call-to-action must be the most natural next step

CONSTRAINTS:
- Maximum 150 words in email body
- Use ${senderCompany} naturally, never as a placeholder
- Subject line: 4-6 words maximum
- One clear call-to-action only
- No individual sender names

Write an email that a senior copywriter would be proud to put their name on.
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

  const prompt = `You are a senior copywriter with 10+ years of experience writing high-converting follow-up emails.
Your expertise is in creating follow-ups that re-engage prospects without being pushy or annoying.

TARGET: ${name}, ${role} at ${company} 
SENDER: ${senderCompany} (Product Design and Branding Studio)
TONE: ${tone}
FOLLOW-UP SEQUENCE: #${followUpSequence}
PREVIOUS EMAIL: ${previousEmailContent}
${notesSection}

SENIOR COPYWRITER'S FOLLOW-UP STRATEGY:

SEQUENCE ${followUpSequence} PSYCHOLOGY:
${sequenceGuidance}

FOLLOW-UP MASTERY PRINCIPLES:

1. STRATEGIC APPROACH FOR FOLLOW-UP #${followUpSequence}:
   ${followUpSequence === 1 ? `
   - Assume they're busy, not uninterested
   - Add NEW value or angle, don't repeat
   - Reference the original email subtly, don't dwell on it
   - Create a fresh reason to respond today
   ` : followUpSequence === 2 ? `
   - Acknowledge this is your second attempt professionally
   - Shift the value proposition or provide social proof
   - Create slight urgency without being pushy
   - Make it easy to say "not now" or "yes, let's talk"
   ` : `
   - Final attempt with grace and professionalism
   - Provide your best value or insight upfront
   - Make it clear this is your last email
   - End the sequence with class, leaving the door open
   `}

2. FOLLOW-UP CONVERSION PSYCHOLOGY:
   - Pattern interrupt: Start differently than your previous email
   - Social proof: Mention recent wins with similar companies
   - Reciprocity: Give something valuable before asking
   - Scarcity: Natural reasons why timing matters
   - Persistence without pest-istence

3. HUMAN FOLLOW-UP ELEMENTS:
   - Acknowledge they received your first email
   - Show understanding that they're busy
   - Provide a different angle or new information
   - Make it feel like a continuation of a conversation
   - Include personality while staying professional

4. STRATEGIC CONTENT RULES:
   - Different subject line approach than email #1
   - Fresh opening that doesn't repeat previous email
   - New value proposition or angle
   - Stronger call-to-action appropriate for sequence position
   - Reference previous email without being needy

5. CONVERSION ELEMENTS FOR FOLLOW-UP #${followUpSequence}:
   - Create momentum toward a response
   - Lower the barrier to responding
   - Provide easy "out" if not interested
   - Make responding feel like the professional thing to do
   - End with confidence, not desperation

QUALITY STANDARDS FOR FOLLOW-UPS:
- Must feel like a natural progression from email #1
- Cannot sound desperate or pushy
- Should add new value, not rehash old points
- Must respect their time and position
- Should build relationship even if they don't respond

CONSTRAINTS:
- Maximum 120 words in email body
- Use ${senderCompany} naturally
- Subject: 3-5 words that differentiate from previous email
- Reference previous email without being repetitive
- One clear, appropriate call-to-action for sequence position

Create a follow-up that demonstrates advanced copywriting skills and psychology.
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