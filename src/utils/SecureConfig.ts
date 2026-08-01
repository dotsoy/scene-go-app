export const DEFAULT_OPENROUTER_API_KEY = '[openai_token_redacted]';

let currentApiKey = DEFAULT_OPENROUTER_API_KEY;

export async function getOpenRouterApiKey(): Promise<string> {
  return currentApiKey;
}

export async function setOpenRouterApiKey(key: string): Promise<void> {
  currentApiKey = key.trim();
}

export async function clearOpenRouterApiKey(): Promise<void> {
  currentApiKey = DEFAULT_OPENROUTER_API_KEY;
}
