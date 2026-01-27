import { GoogleGenAI, ThinkingLevel } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export const MODELS = {
  PRO: 'gemini-3-pro-preview',
  FLASH: 'gemini-3-flash-preview',
} as const;

export type ModelType = typeof MODELS[keyof typeof MODELS];

export interface GenerateOptions {
  model?: ModelType;
  thinkingLevel?: ThinkingLevel;
  temperature?: number;
  maxOutputTokens?: number;
}

export { ThinkingLevel };

export async function generateContent(
  prompt: string,
  systemPrompt: string,
  options: GenerateOptions = {}
): Promise<{ text: string; tokensUsed: number }> {
  const client = getGeminiClient();
  const {
    model = MODELS.PRO,
    thinkingLevel = ThinkingLevel.HIGH,
    temperature = 0.7,
    maxOutputTokens = 8192,
  } = options;

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: systemPrompt,
      thinkingConfig: {
        thinkingLevel,
      },
      temperature,
      maxOutputTokens,
    },
  });

  return {
    text: response.text || '',
    tokensUsed: response.usageMetadata?.totalTokenCount || 0,
  };
}

export async function generateWithHistory(
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  systemPrompt: string,
  options: GenerateOptions = {}
): Promise<{ text: string; tokensUsed: number }> {
  const client = getGeminiClient();
  const {
    model = MODELS.PRO,
    thinkingLevel = ThinkingLevel.HIGH,
    temperature = 0.7,
    maxOutputTokens = 8192,
  } = options;

  const contents = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const response = await client.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: systemPrompt,
      thinkingConfig: {
        thinkingLevel,
      },
      temperature,
      maxOutputTokens,
    },
  });

  return {
    text: response.text || '',
    tokensUsed: response.usageMetadata?.totalTokenCount || 0,
  };
}
