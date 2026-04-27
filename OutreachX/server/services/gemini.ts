import Groq from "groq-sdk";

const ai = new Groq({ 
  apiKey: process.env.GROQ_API_KEY || ""
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
FROM: ${senderName}, an expert Product Designer with 5 years of experience crafting intuitive and scalable digital products (B2C, SaaS, Design Systems)
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
   - Each paragraph separated by TWO line breaks (\n\n)
   - Maximum 2 sentences per paragraph
   - NO walls of text - perfect formatting required

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
   - Clearly position yourself as an experienced independent Product Designer (B2C, SaaS, Design Systems)
   - Focus on how your thoughtful, intent-driven interfaces can solve their specific problems
   - Reference specific benefits for their business type
   - Professional but conversational tone
   - Focus on their success through better design

Your response MUST:
- Have a subject line that clearly hints at design services (not just branding)
- Be perfectly formatted with proper line breaks (\n\n)
- Prioritize and reference NOTES if provided for personalization
- Focus on your individual expertise as a Product Designer
- End the email exactly like this (including the portfolio link and resume mention):
"Best regards,
${senderName}
Portfolio: https://uxdimeji.com
P.S. I've attached my resume for your reference."
- Be compelling and professional

Generate the email now in JSON format. The response MUST be a valid JSON object with exactly these two keys: "subject" (string) and "content" (string). Do not use nested objects:`;

  console.log("[Gemini Prompt]", prompt); // Debug log for prompt

  try {
    const response = await ai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const rawJson = response.choices[0]?.message?.content;
    if (rawJson) {
      // Clean up markdown formatting if Groq wraps the JSON
      const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      const data: EmailGenerationResponse = JSON.parse(cleanJson);
      return data;
    } else {
      throw new Error("Empty response from Groq");
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
FROM: ${senderName}, an expert Product Designer with 5 years of experience crafting intuitive and scalable digital products (B2C, SaaS, Design Systems)
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
   - Each paragraph separated by TWO line breaks (\n\n)
   - Maximum 2 sentences per paragraph
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
- Be perfectly formatted with proper line breaks (\n\n)
- Prioritize and reference NOTES if provided for personalization
- Position yourself as an independent expert Product Designer
- Reference previous email appropriately for sequence #${followUpSequence}
- End the email exactly like this (including the portfolio link and resume mention):
"Best regards,
${senderName}
Portfolio: https://uxdimeji.com
P.S. I've attached my resume for your reference."
- Add NEW value, never repeat previous content

Generate the follow-up email now in JSON format. The response MUST be a valid JSON object with exactly these two keys: "subject" (string) and "content" (string). Do not use nested objects:`;

  console.log("[Gemini Prompt]", prompt); // Debug log for prompt

  try {
    const response = await ai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const rawJson = response.choices[0]?.message?.content;
    if (rawJson) {
      // Clean up markdown formatting if Groq wraps the JSON
      const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      const data: EmailGenerationResponse = JSON.parse(cleanJson);
      return data;
    } else {
      throw new Error("Empty response from Groq");
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
    const response = await ai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        }
      ],
      model: "llama-3.3-70b-versatile",
    });

    return response.choices[0]?.message?.content || "Unable to generate insights at this time.";
  } catch (error) {
    throw new Error(`Failed to generate insights: ${error}`);
  }
}