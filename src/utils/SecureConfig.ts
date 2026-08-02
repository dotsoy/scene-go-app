import * as SecureStore from 'expo-secure-store';

const OPENROUTER_KEYCHAIN_KEY = 'scenego_openrouter_api_key';

export const DEFAULT_OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';

let cachedApiKey: string | null = null;

export async function getOpenRouterApiKey(): Promise<string> {
  // 内存缓存优先（避免频繁 Keychain 读）
  if (cachedApiKey !== null) return cachedApiKey;

  try {
    const stored = await SecureStore.getItemAsync(OPENROUTER_KEYCHAIN_KEY);
    cachedApiKey = (stored?.trim() || DEFAULT_OPENROUTER_API_KEY) || '';
    return cachedApiKey;
  } catch (err) {
    console.warn('[SecureConfig] Keychain read failed, falling back to env:', err);
    cachedApiKey = DEFAULT_OPENROUTER_API_KEY || '';
    return cachedApiKey;
  }
}

export async function setOpenRouterApiKey(key: string): Promise<void> {
  const trimmed = key.trim();
  cachedApiKey = trimmed;
  try {
    await SecureStore.setItemAsync(OPENROUTER_KEYCHAIN_KEY, trimmed);
  } catch (err) {
    console.warn('[SecureConfig] Keychain write failed:', err);
  }
}

export async function clearOpenRouterApiKey(): Promise<void> {
  cachedApiKey = null;
  try {
    await SecureStore.deleteItemAsync(OPENROUTER_KEYCHAIN_KEY);
  } catch (err) {
    console.warn('[SecureConfig] Keychain delete failed:', err);
  }
}
