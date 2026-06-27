// LLM client — uses @google/genai SDK which natively supports new AQ. key format
// Model cascade: gemini-2.0-flash → gemini-1.5-flash → gemini-1.5-flash-8b
// Final fallback: OpenAI GPT-4o (if configured)

import { GoogleGenAI } from '@google/genai';
import { ChatOpenAI } from '@langchain/openai';
import { getMockResponse, MOCK_MODE } from './mock';

const GOOGLE_KEY =
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_CONFIGURED =
  !!OPENAI_KEY && OPENAI_KEY.length > 10 && !OPENAI_KEY.includes('your_');

let genai: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genai) {
    if (!GOOGLE_KEY) throw new Error('No Google API key found. Set GOOGLE_API_KEY in .env.local');
    genai = new GoogleGenAI({ apiKey: GOOGLE_KEY });
  }
  return genai;
}

const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

function isRateLimitError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes('429') || msg.includes('quota') ||
    msg.includes('Too Many Requests') || msg.includes('RESOURCE_EXHAUSTED');
}

function isModelNotFoundError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes('404') || msg.includes('not found') || msg.includes('not supported');
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Calls Google GenAI API with model cascade and retry on rate limits
async function callGemini(prompt: string, modelName: string): Promise<string> {
  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });
  return response.text ?? '';
}

let openaiClient: ChatOpenAI | null = null;
function getOpenAIClient(): ChatOpenAI {
  if (!openaiClient) {
    openaiClient = new ChatOpenAI({
      model: 'gpt-4o',
      apiKey: OPENAI_KEY!,
      temperature: 0.3,
      maxTokens: 4096,
    });
  }
  return openaiClient;
}

// Main entry point — cascades through all Gemini models then OpenAI
export async function callLLM(prompt: string, _useJson = false): Promise<string> {
  // Demo mode — return mock data without hitting the API
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 800)); // Simulate API latency
    return getMockResponse(prompt);
  }

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await callGemini(prompt, model);
        console.log(`[LLM] ✓ ${model} responded`);
        return result;
      } catch (err) {
        if (isRateLimitError(err)) {
          const wait = (attempt + 1) * 3000;
          console.warn(`[LLM] ${model} rate limited, waiting ${wait}ms...`);
          await sleep(wait);
          break; // Move to next model after backoff
        }
        if (isModelNotFoundError(err)) {
          console.warn(`[LLM] ${model} not available, skipping...`);
          break;
        }
        console.error(`[LLM] ${model} error (attempt ${attempt + 1}):`, err);
        await sleep(1000);
      }
    }
  }

  // All Gemini models exhausted — try OpenAI
  if (OPENAI_CONFIGURED) {
    console.warn('[LLM] All Gemini models failed, using OpenAI GPT-4o fallback');
    try {
      const fallback = getOpenAIClient();
      const response = await fallback.invoke([{ role: 'user', content: prompt }]);
      return response.content as string;
    } catch (err) {
      throw new Error(`All LLM providers failed. OpenAI error: ${err}`);
    }
  }

  throw new Error(
    'All Gemini models are rate-limited and no OpenAI key is configured.\n' +
    'Add OPENAI_API_KEY to .env.local as a fallback.'
  );
}

// Keep these exported for any code that imports them directly
export function getGeminiClient() {
  return { invoke: async (msgs: any[]) => ({ content: await callLLM(msgs[0]?.content ?? '') }) };
}
export function getOpenAIClientExport() { return getOpenAIClient(); }

export function extractJSON<T>(text: string): T {
  const jsonMatch =
    text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
    text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }
  return JSON.parse(text);
}
