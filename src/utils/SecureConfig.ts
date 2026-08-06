/**
 * OpenRouter API Key（生产模式唯一来源：.env 的 EXPO_PUBLIC_OPENROUTER_API_KEY）。
 * EXPO_PUBLIC_ 变量在 bundle 时内联，修改后需重启 dev client / 重新构建。
 * 已删除 Keychain 读写（2026-08-06 用户拍板：Key 属构建配置，非运行时设置）。
 */

export const DEFAULT_OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';

export async function getOpenRouterApiKey(): Promise<string> {
  return DEFAULT_OPENROUTER_API_KEY.trim();
}
