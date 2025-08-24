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

  const prompt = `Write a cold outreach email to ${name}, who is a ${role} at ${company}.
Tone: ${tone}.

SENDER INFORMATION:
- Your company is: ${senderCompany}
- You are from a Product Design and Branding Studio
${notesSection}

PROMPT PRIORITY:
- If notes are present above, you MUST use them to personalize the email. Reference specific details from the notes and make the email feel tailored and relevant to the recipient.
- The goal is to make the recipient feel understood and that the outreach is not generic.

FORMATTING REQUIREMENTS:
- Use proper line breaks and spacing
- Start with a personalized greeting
- Keep paragraphs short (2-3 sentences max)
- Add blank lines between paragraphs
- End with a clear call-to-action
- Include a professional signature
- Ensure the email flows naturally and is easy to read

EMAIL STRUCTURE:
1. Personalized greeting
2. Brief introduction and reason for reaching out
3. Value proposition or benefit
4. Clear call-to-action
5. Professional closing

Make the email short, personalized, and with a clear call-to-action to book a call.
Use only the company name (${senderCompany}) in the email content naturally. Do not mention any individual sender name.
Do not use placeholders - use the actual company name provided.

Format the response as JSON with 'subject' and 'content' fields.`;

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

  const prompt = `Generate a ${tone} follow-up email for ${name}, a ${role} at ${company}.
This is follow-up #${followUpSequence} to the previous email content:
${previousEmailContent}

SENDER INFORMATION:
- Your company is: ${senderCompany}
- You are from a Product Design and Branding Studio
${notesSection}

PROMPT PRIORITY:
- If notes are present above, you MUST use them to personalize the follow-up email. Reference specific details from the notes and make the email feel tailored and relevant to the recipient.
- The goal is to make the recipient feel understood and that the outreach is not generic.

${sequenceGuidance}

FORMATTING REQUIREMENTS:
- Use proper line breaks and spacing
- Start with a personalized greeting
- Keep paragraphs short (2-3 sentences max)
- Add blank lines between paragraphs
- Reference the previous email naturally
- End with a clear call-to-action
- Include a professional signature
- Ensure the email flows naturally and is easy to read

The follow-up should:
- Reference the previous communication naturally
- Add value or a new angle appropriate for follow-up #${followUpSequence}
- Be persistent but not pushy
- Keep the same ${tone} tone
- Be concise and compelling
- Include a clear call-to-action
- Use only the company name (${senderCompany}) in the email content naturally. Do not mention any individual sender name.
- Do not use placeholders - use the actual company name provided

Return as JSON with "subject" and "content" fields.`;

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