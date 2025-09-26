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

  const prompt = `You are a senior email copywriter with 10+ years of experience writing high-converting cold outreach emails. 
Your expertise lies in creating emails that feel genuinely human, build immediate trust, and compel action.

TARGET RECIPIENT: ${name}, ${role} at ${company}
SENDER: ${senderCompany} (Product Design and Branding Studio)
TONE: ${tone}
${notesSection}

COPYWRITER'S FRAMEWORK - FOLLOW THIS EXACTLY:

1. IRRESISTIBLE SUBJECT LINE PSYCHOLOGY:
   - MUST create immediate curiosity that compels opening
   - Use pattern interrupt, intrigue, or benefit-driven language
   - Test these proven formulas: "Question about [company]", "[Name], quick question", "Impressed by [specific achievement]", "[Industry] insight for you"
   - NEVER use generic subjects like "Introduction" or "Partnership opportunity"
   - Maximum 4-6 words that create genuine curiosity
   - Should work seamlessly with opening line to create cohesive message

2. MANDATORY EMAIL STRUCTURE AND FORMATTING:
   - ALWAYS start with proper greeting: "Hi [Name]," or "Hello [Name],"
   - Use proper line breaks between paragraphs (\n\n)
   - Structure: Greeting → Hook → Value → Call-to-Action → Professional closing
   - End with professional signature: "Best regards," or "Best," followed by sender info
   - Every paragraph should be 1-2 sentences maximum for readability
   - Use conversational, human language throughout

3. COMPELLING OPENING REQUIREMENTS:
   - First sentence MUST grab attention and feel genuinely personal
   - Reference something specific about them/their company
   - Create immediate relevance to their role/challenges
   - Avoid generic openings like "I hope this email finds you well"
   - Use pattern interrupt or curiosity-driven hook

4. VALUE-FIRST CONTENT STRATEGY:
   - Offer genuine insight, resource, or benefit upfront
   - Reference specific results or case studies when relevant
   - Ask thought-provoking questions related to their business
   - Focus on "you" and their success, not your services
   - Include social proof naturally in conversation

5. PROFESSIONAL FORMATTING STANDARDS:
   - Proper greeting at start
   - Clear paragraph breaks with double line spacing (\n\n)
   - Professional closing with sender information
   - Maximum 150 words total
   - Easy to scan with short paragraphs
   - Human, conversational tone throughout

6. CONVERSION PSYCHOLOGY:
   - Create momentum toward response without pressure
   - Make responding feel professionally smart
   - Lower barrier to engagement
   - End with easiest possible next step
   - Build micro-relationship in first interaction

SUBJECT LINE EXAMPLES (ADAPT TO CONTEXT):
- "Quick question, ${name}"
- "${company}'s growth caught my attention"
- "Insight for ${company}"
- "${name}, 30-second favor?"

EMAIL TEMPLATE STRUCTURE:
Hi ${name},

[Attention-grabbing, personalized opening line]

[Value proposition with specific benefit/insight]

[Social proof or relevant example]

[Clear, low-friction call-to-action]

Best regards,
${senderCompany} Team

QUALITY STANDARDS:
- Subject must compel immediate opening
- Email must have proper greeting and professional closing
- Perfect formatting with proper line breaks
- Zero marketing jargon
- Passes "would I open this?" test
- Feels like colleague reaching out, not salesperson

Write an email with an irresistible subject line and perfectly formatted content.
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

1. IRRESISTIBLE FOLLOW-UP SUBJECT LINES:
   - MUST differentiate from previous email subject
   - Create fresh curiosity that compels opening
   - Use different psychological trigger than email #1
   - Examples for sequence #${followUpSequence}:
     ${followUpSequence === 1 ? 
       `• "Following up, ${name}"
        • "One more thought for ${company}"
        • "Did you see my email about ${company}?"
        • "${name}, quick follow-up"`
       : followUpSequence === 2 ?
       `• "Last attempt, ${name}"
        • "${company} - final thought"  
        • "Closing the loop, ${name}"
        • "One final idea for you"`
       : `• "Final note, ${name}"
        • "Last email from me"
        • "Signing off, ${name}"
        • "Final thought for ${company}"`}

2. MANDATORY FOLLOW-UP FORMATTING:
   - ALWAYS start with proper greeting: "Hi ${name}," or "Hello ${name},"
   - Use proper line breaks between paragraphs (\n\n)
   - Structure: Greeting → Context → Fresh Value → Call-to-Action → Professional closing
   - End with professional signature: "Best regards," or "Best," followed by sender info
   - Maximum 1-2 sentences per paragraph for readability
   - Professional, conversational tone throughout

3. STRATEGIC APPROACH FOR FOLLOW-UP #${followUpSequence}:
   ${followUpSequence === 1 ? `
   - Acknowledge they're busy, show understanding
   - Add NEW value or angle, never repeat previous content
   - Reference the original email subtly but don't dwell
   - Create fresh reason to respond today
   - Maintain professional persistence without pressure
   ` : followUpSequence === 2 ? `
   - Acknowledge this is your second attempt professionally
   - Shift the value proposition or provide social proof
   - Create slight momentum without being pushy
   - Make it easy to say "not interested" or "yes, let's talk"
   - Show respect for their decision-making process
   ` : `
   - Final attempt with grace and professionalism
   - Provide your best value or insight upfront
   - Make it clear this is your last email
   - End the sequence with class, leaving door open
   - Respect their silence while offering final opportunity
   `}

4. PROFESSIONAL FOLLOW-UP STRUCTURE:
   - Proper greeting and professional closing mandatory
   - Perfect formatting with clear paragraph breaks
   - Reference previous email without being repetitive
   - Add fresh perspective or value
   - Natural, pressure-free call-to-action
   - Human, respectful tone throughout

5. FOLLOW-UP CONVERSION PSYCHOLOGY:
   - Pattern interrupt: Start differently than previous email
   - Fresh value: New insight, case study, or perspective
   - Social proof: Recent wins or relevant examples
   - Respectful persistence: Show professionalism
   - Easy response: Lower barrier to engagement

FOLLOW-UP TEMPLATE STRUCTURE:
Hi ${name},

[Acknowledge context/reference previous email naturally]

[Fresh value proposition or new angle]

[Social proof or compelling reason to respond]

[Clear, low-pressure call-to-action]

Best regards,
${senderCompany} Team

QUALITY STANDARDS FOR FOLLOW-UPS:
- Subject must create fresh curiosity, different from email #1  
- Perfect professional formatting with proper greetings/closings
- Must feel like natural progression, not repetition
- Cannot sound desperate or pushy
- Should add new value, not rehash old points
- Respects their time and decision-making process

CONSTRAINTS:
- Maximum 120 words in email body
- Subject: 3-5 compelling words that differentiate from previous
- Perfect formatting with proper line breaks (\n\n)
- Professional greeting and closing required
- Reference previous email without being needy

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