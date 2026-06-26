const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

function buildSystemPrompt(language?: string, demoType?: string): string {
  var lang = language || 'English (US)';
  var type = (demoType || 'product-demo').replace(/-/g, ' ');
  return `You are a HackDemo narration writer. Given a list of demo steps from a "${type}" walkthrough, generate concise and engaging narration text for each step.

Guidelines:
- Write in ${lang}
- Write exactly ONE sentence per step
- Use present tense, second person ("You")
- Sound energetic and hackathon-appropriate
- Focus on what the user accomplishes, not just what they clicked
- Keep each sentence under 20 words
- Do NOT repeat button labels verbatim — describe the outcome
- Return ONLY a JSON array of strings, one per step. No extra text.`;
}

interface StepInput {
  index: number;
  description: string;
  pageContext: {
    title: string;
    url: string;
  };
}

/**
 * Generate narration text for each demo step using DeepSeek.
 */
export async function generateNarration(steps: StepInput[], language?: string, demoType?: string): Promise<string[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const userPrompt = `Here are the demo steps:\n${JSON.stringify(
    steps.map((s) => ({
      index: s.index,
      description: s.description,
      page: s.pageContext.title,
    })),
    null,
    2
  )}\n\nGenerate ONE sentence of narration per step. Return a JSON array of strings.`;

  const response = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt(language, demoType) },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`DeepSeek API error ${response.status}: ${text}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('DeepSeek returned empty response');
  }

  // Parse JSON array from response (handle markdown code blocks)
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`Could not parse JSON from DeepSeek response: ${content}`);
  }

  const narrations: string[] = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(narrations) || narrations.length !== steps.length) {
    throw new Error(
      `Narration count mismatch: got ${narrations.length}, expected ${steps.length}`
    );
  }

  return narrations;
}
