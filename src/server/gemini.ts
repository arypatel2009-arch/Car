import { GoogleGenAI } from '@google/genai';
import { serverConfig } from './config.ts';

let genAIInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!serverConfig.geminiApiKey) {
    return null;
  }

  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({
      apiKey: serverConfig.geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return genAIInstance;
}
