import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const JSON_RESPONSE_CONFIG = { responseMimeType: "application/json" };
const TONE_GUIDANCE: Record<string, string> = {
  professional:
    "- Formal and polished (treat this as a formal business tone).\n" +
    "- No slang or emojis; prefer precise, respectful phrasing.\n" +
    "- Calm confidence, measured claims, and clear benefit language.",
  casual:
    "- Friendly and conversational, but still professional.\n" +
    "- Contractions are fine; keep it warm and human.\n" +
    "- Avoid overly salesy language or hype.",
  direct:
    "- Clear, concise, and assertive.\n" +
    "- Short sentences, minimal fluff, straight to the point.\n" +
    "- Focus on the ask and the concrete value.",
};

function getToneGuidance(tone: string): string {
  return TONE_GUIDANCE[tone] ||
    "- Clear, professional, and respectful.\n" +
    "- Match the requested formality and keep the writing concise.";
}

function formatTargetLine(name: string, role: string, company?: string | null): string {
  const rolePart = role ? `, ${role}` : "";
  const companyValue = company?.trim();
  const companyPart = companyValue ? ` at ${companyValue}` : "";
  return `${name}${rolePart}${companyPart}`.trim();
}

function getModeGuidance(isJobApplication: boolean): string {
  if (isJobApplication) {
    return "MODE: Job application. Write as a candidate applying for a role.\n" +
      "- Focus on fit, relevant experience, and measurable outcomes.\n" +
      "- Do not pitch services or freelance availability.\n" +
      "- If company is not provided, do not mention a company or use \"at\".\n";
  }

  return "MODE: Freelance and contract design outreach.\n" +
    "- Position yourself as an independent Product Designer, not a studio or agency.\n" +
    "- Emphasize business outcomes from design improvements.\n";
}

async function getResponseText(response: any): Promise<string> {
  if (!response) {
    return "";
  }

  if (typeof response.text === "function") {
    const text = await response.text();
    if (text) {
      return text;
    }
  }

  if (typeof response.text === "string") {
    return response.text;
  }

  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts
      .map((part: any) => (typeof part === "string" ? part : part?.text || ""))
      .join("");
  }

  return "";
}

function normalizeEmailResponse(data: any): EmailGenerationResponse {
  const normalized = typeof data === "object" && data ? data : {};

  if (!normalized.content) {
    if (normalized.emailBody && Array.isArray(normalized.emailBody)) {
      normalized.content = normalized.emailBody
        .map((p: any) => p.paragraph || p)
        .join("\n\n");
    } else if (normalized.emailBody && typeof normalized.emailBody === "string") {
      normalized.content = normalized.emailBody;
    } else if (normalized.body) {
      normalized.content = normalized.body;
    } else if (normalized.email) {
      normalized.content = normalized.email;
    } else if (normalized.message) {
      normalized.content = normalized.message;
    } else {
      normalized.content = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    }
  }

  if (!normalized.subject && normalized.title) {
    normalized.subject = normalized.title;
  }

  if (!normalized.subject) {
    normalized.subject = "";
  }

  return normalized as EmailGenerationResponse;
}

export interface EmailGenerationRequest {
  name: string;
  role: string;
  company?: string | null;
  tone: 'professional' | 'casual' | 'direct';
  isFollowUp?: boolean;
  previousEmailContent?: string;
  isJobApplication?: boolean;
  senderName: string;
  senderCompany: string;
  notes?: string;
}

export interface EmailGenerationResponse {
  subject: string;
  content: string;
}

export async function generateColdEmail(request: EmailGenerationRequest): Promise<EmailGenerationResponse> {
  const { name, role, company, tone, senderName, senderCompany, notes, isJobApplication } = request;
  const isJobApplicationMode = isJobApplication === true;

  const notesSection = notes
    ? `NOTES (use these for specificity and personalization):\n${notes}`
    : "";
  const toneGuidance = getToneGuidance(tone);
  const modeGuidance = getModeGuidance(isJobApplicationMode);
  const targetLine = formatTargetLine(name, role, company);
  const fromLine = isJobApplicationMode
    ? `${senderName}, Product Designer with 5 years of experience crafting intuitive and scalable digital products (B2C, SaaS, Design Systems)`
    : `${senderName}, independent Product Designer with 5 years of experience crafting intuitive and scalable digital products (B2C, SaaS, Design Systems)`;

  const voiceAndQuality = isJobApplicationMode
    ? "- Write like a competent person sending a real email, not like an AI generating a cover letter\n" +
      "- No openers: \"Hope you're well\", \"I wanted to reach out\", \"I came across\", \"Touching base\", \"Quick question\"\n" +
      "- No filler phrases that pad without adding meaning\n" +
      "- Every sentence must earn its place; if it does not add a specific fact, proof, or reason, cut it\n" +
      "- Vary sentence length and rhythm to match the tone\n" +
      "- Be specific: name things, cite outcomes, reference actual work, never speak in vague generalities\n" +
      "- Do not hype or exaggerate; credibility comes from specificity, not enthusiasm"
    : "- Write like a sharp professional reaching out to a peer, not a vendor pitching a client\n" +
      "- No openers: \"Hope you're well\", \"I wanted to reach out\", \"I came across\", \"Touching base\", \"Quick question\"\n" +
      "- No filler; every sentence must carry a specific fact, observation, or reason\n" +
      "- Vary sentence length and rhythm to match the tone\n" +
      "- Be specific: reference the lead's role, industry, or context so it does not feel mass-sent\n" +
      "- Do not oversell or use hype; credibility comes from specificity and restraint\n" +
      "- The email should feel written for this person specifically, not adapted from a template";

  const subjectLineRules = isJobApplicationMode
    ? "- 6-12 words, references the role or application context\n" +
      "- Must include \"Application\" or \"Applying\"\n" +
      "- If a role name is available, include it\n" +
      "- Professional and specific; no ALL CAPS, no exclamation points, no urgency bait"
    : "- 6-10 words, direct and specific\n" +
      "- Should reference design, the lead's context, or a specific outcome\n" +
      "- No ALL CAPS, no exclamation points, no urgency bait, no \"Quick question\"\n" +
      "- Do NOT include \"Application\" or \"Applying\"\n" +
      "- If NOTES include a specific observation about their product or problem, use it";

  const structureRules = isJobApplicationMode
    ? "Paragraph 1: State who you are and why you're applying. One specific hook - a shared context, a thing you noticed, or a direct statement of intent. Not a generic opener.\n\n" +
      "Paragraph 2: Your most relevant experience with a measurable or specific outcome. Make it feel earned, not listed.\n\n" +
      "Paragraph 3: Why this role or team specifically. If NOTES are provided, use them here. If not, use target info to say something specific and true.\n\n" +
      "Paragraph 4: Clear, low-friction CTA. One ask. Then close."
    : "Paragraph 1: Open with a specific, true observation about their product, team, or space - or a direct statement of who you are and why you're reaching out to them specifically. No generic praise. If NOTES include a specific observation, use it here.\n\n" +
      "Paragraph 2: What you do and what it has produced - one or two specific outcomes or projects relevant to their context. Make it feel earned, not listed.\n\n" +
      "Paragraph 3: The connection - why you're reaching out to them, what you could help with, and why it's relevant now. Keep it honest and low-pressure. If NOTES have context on their current situation or needs, use it here.\n\n" +
      "Paragraph 4: Simple, low-friction CTA. One ask - usually a short call or a look at the portfolio. No pressure, no false urgency.";

  const rules = isJobApplicationMode
    ? `- Start with: "Hi ${name},"\n` +
      "- This is a job application, not a freelance pitch or service offer\n" +
      "- If company is missing, do not invent one or refer to \"your company\"\n" +
      "- Do not repeat sentence starters or structures across paragraphs"
    : `- Start with: "Hi ${name},"\n` +
      "- This is a freelance pitch, not a job application and not a studio pitch\n" +
      `- Position ${senderName} as an individual designer, not an agency or team\n` +
      "- If company is missing, do not invent one or refer to \"your company\"\n" +
      "- Do not repeat sentence starters or structures across paragraphs\n" +
      "- Do not mention rates, timelines, or deliverables";

  const signatureBlock = isJobApplicationMode
    ? `Best regards,\n${senderName}\nPortfolio: https://uxdimeji.com\nP.S. I've attached my resume for your reference.`
    : `Best regards,\n${senderName}\nPortfolio: https://uxdimeji.com`;

  const notesBlock = notesSection ? `\n${notesSection}` : "";
  const intentLine = isJobApplicationMode ? "apply for jobs" : "pitch freelance design services";

  const prompt = `You are a professional email writer helping a product designer ${intentLine}. Write an email that reads like a real person wrote it - specific, confident, and direct. ${isJobApplicationMode ? "Not a template, not a pitch deck." : "Not a template, not a brochure. The goal is to start a conversation, not close a deal in one email."}

TARGET: ${targetLine}
FROM: ${fromLine}
TONE: ${tone}
TONE GUIDANCE:
${toneGuidance}
${modeGuidance}${notesBlock}

VOICE AND QUALITY (this is the most important section):
${voiceAndQuality}

SUBJECT LINE:
${subjectLineRules}

EMAIL STRUCTURE - exactly 4 paragraphs, max 2 sentences each, double line break between paragraphs:

${structureRules}

RULES:
${rules}
- End exactly with:
"${signatureBlock}"

OUTPUT: Valid JSON with exactly two keys - "subject" (string) and "content" (string). No markdown, no extra keys, no explanation.`;

  console.log("[Gemini Prompt]", prompt); // Debug log for prompt

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: JSON_RESPONSE_CONFIG,
    });

    const rawJson = await getResponseText(response);
    if (rawJson) {
      // Clean up markdown formatting if Gemini wraps the JSON
      const cleanJson = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
      let data: any = JSON.parse(cleanJson);

      return normalizeEmailResponse(data);
    }

    throw new Error("Empty response from Gemini");
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
  previousEmailSubject,
  followUpSequence = 1,
  isJobApplication,
  senderName,
  senderCompany,
  notes,
}: {
  name: string;
  role: string;
  company?: string | null;
  tone: "professional" | "casual" | "direct";
  isFollowUp?: boolean;
  previousEmailContent?: string;
  previousEmailSubject?: string;
  followUpSequence?: number;
  isJobApplication?: boolean;
  senderName: string;
  senderCompany: string;
  notes?: string;
}): Promise<EmailGenerationResponse> {
  const isJobApplicationMode = isJobApplication === true;
  const notesSection = notes
    ? `NOTES (use these for new value and personalization):\n${notes}`
    : "";
  const toneGuidance = getToneGuidance(tone);
  const modeGuidance = getModeGuidance(isJobApplicationMode);
  const targetLine = formatTargetLine(name, role, company);
  const fromLine = isJobApplicationMode
    ? `${senderName}, Product Designer with 5 years of experience crafting intuitive and scalable digital products (B2C, SaaS, Design Systems)`
    : `${senderName}, independent Product Designer with 5 years of experience crafting intuitive and scalable digital products (B2C, SaaS, Design Systems)`;

  const notesBlock = notesSection ? `\n${notesSection}` : "";
  const previousSubjectLine = previousEmailSubject?.trim();
  const previousSubjectLabel = previousSubjectLine || "(not provided)";

  const subjectLineRules = isJobApplicationMode
    ? `- Follow-up subjects are not new marketing headlines; they are continuations\n` +
      `- Use \"Re: ${previousSubjectLine || "[previous subject line]"}\" OR a quiet, direct variation\n` +
      "- Do NOT write urgency bait: no \"Last Chance\", \"Still Waiting\", \"Don't Miss This\"\n" +
      "- Do NOT try to make the subject compelling; keep it calm and specific\n" +
      "- If the previous subject is not available, include \"Application\" or \"Applying\" and the role if available\n" +
      "- Good examples: \"Re: Product Designer Application\", \"Following Up - Product Designer Application\", \"Re: Applying for the UX Designer Role\"\n" +
      "- Bad examples: \"Last Chance to Review My Application\", \"One More Thing Before You Decide\", \"Still Interested in Joining Your Team\""
    : `- Use \"Re: ${previousSubjectLine || "[previous subject line]"}\" OR a calm, specific variation\n` +
      "- No urgency bait: no \"Still Interested\", \"Last Chance\", \"One More Thing\"\n" +
      "- Do not turn the subject into a marketing headline\n" +
      "- Good examples: \"Re: Design Partnership Idea\", \"Following Up - Product Design\"\n" +
      "- Bad examples: \"Don't Miss This\", \"Final Follow-Up Before I Move On\"";

  const voiceAndQuality = isJobApplicationMode
    ? "- Do not reuse any phrasing, structure, or sentences from the previous email\n" +
      "- No openers: \"Just following up\", \"I know you're busy\", \"Hope this finds you well\", \"Circling back\"\n" +
      "- Every paragraph must add something the previous email did not say\n" +
      "- Be direct; state the reason for writing in the first sentence without apology or filler\n" +
      "- Specific always beats general; cite a thing, a project, an outcome, or a detail"
    : "- Do not reuse any phrasing, structure, or sentences from the previous email\n" +
      "- No openers: \"Just following up\", \"Circling back\", \"I know you're busy\", \"Hope this finds you\"\n" +
      "- Every paragraph must add something new - a different angle, a specific piece of work, a relevant observation\n" +
      "- Be direct; state the reason for writing in the first sentence without apology or filler\n" +
      "- Direct and specific always beats warm and vague";

  const sequenceValueGuidance = isJobApplicationMode
    ? followUpSequence === 1
      ? "- Follow-up #1: A specific piece of work, outcome, or context not mentioned in the first email"
      : followUpSequence === 2
        ? "- Follow-up #2: A sharper angle on your fit - something you've thought about since sending, a relevant observation about their product or team"
        : "- Follow-up #3: Keep it short and honest - you're still interested, one final reason why, and you'll leave it there"
    : followUpSequence === 1
      ? "- Follow-up #1: A specific project, outcome, or work sample relevant to their context. Something the first email did not mention"
      : followUpSequence === 2
        ? "- Follow-up #2: A sharper, more specific angle - a real observation about their product, a design problem their industry typically faces, something that shows you looked at their work"
        : "- Follow-up #3: Short and honest - you're still available, one final specific reason why a conversation could help, and you'll leave it there";

  const rules = isJobApplicationMode
    ? `- Start with: "Hi ${name},"\n` +
      "- Job application follow-up, not a freelance pitch\n" +
      "- If company name is missing, do not invent one\n"
    : `- Start with: "Hi ${name},"\n` +
      "- Freelance pitch follow-up, not a job application\n" +
      "- If company name is missing, do not invent one\n";

  const signatureBlock = isJobApplicationMode
    ? `Best regards,\n${senderName}\nPortfolio: https://uxdimeji.com\nP.S. I've attached my resume for your reference.`
    : `Best regards,\n${senderName}\nPortfolio: https://uxdimeji.com`;

  const prompt = `You are a professional email writer. Write a follow-up to a ${isJobApplicationMode ? "job application email" : "freelance design pitch email"}. This should read like a real person following up - calm, specific, and direct. Not a drip campaign. Not urgency marketing.

TARGET: ${targetLine}
FROM: ${fromLine}
TONE: ${tone}
TONE GUIDANCE:
${toneGuidance}
${modeGuidance}FOLLOW-UP #: ${followUpSequence}
PREVIOUS SUBJECT: ${previousSubjectLabel}
PREVIOUS EMAIL CONTENT: ${previousEmailContent || ""}
${notesBlock}

SUBJECT LINE - CRITICAL:
${subjectLineRules}

VOICE AND QUALITY:
${voiceAndQuality}

STRUCTURE - 3 paragraphs, max 2 sentences each, double line break between:

Paragraph 1: Reference that you sent the application or pitch - one sentence, direct. Then pivot immediately to something new. Do not be apologetic or acknowledge their workload.

Paragraph 2: NEW value only. Never repeat the previous email.
${sequenceValueGuidance}
If NOTES are provided, use them here as the new value.

Paragraph 3: CTA and close. One clear ask, no pressure. For follow-up #3, acknowledge this is your last touch.

RULES:
${rules}- End exactly with:
"${signatureBlock}"

OUTPUT: Valid JSON with exactly two keys - "subject" (string) and "content" (string). No markdown, no extra keys, no explanation.`;

  console.log("[Gemini Prompt]", prompt); // Debug log for prompt

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: JSON_RESPONSE_CONFIG,
    });

    const rawJson = await getResponseText(response);
    if (rawJson) {
      // Clean up markdown formatting if Gemini wraps the JSON
      const cleanJson = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
      let data: any = JSON.parse(cleanJson);

      return normalizeEmailResponse(data);
    }

    throw new Error("Empty response from Gemini");
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
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = await getResponseText(response);
    return text || "Unable to generate insights at this time.";
  } catch (error) {
    throw new Error(`Failed to generate insights: ${error}`);
  }
}