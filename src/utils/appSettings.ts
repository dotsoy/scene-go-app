/**
 * 应用设置（对齐 Open Design 原型设置面板）：目标语言 + 模型 + 持久化。
 * API Key 不走这里（由 SecureConfig/Keychain 管理）。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'scenego.settings';

export interface AppSettings {
  /** 目的地国家码（ISO 3166-1 alpha-2） */
  countryCode: string;
  /** 目的地国家中文名（胶囊/成卡位置上下文用） */
  countryZh: string;
  /** 目标语言显示名（泰语/日语/韩语/英语/法语） */
  targetLang: string;
  /** 目标语言 BCP-47 代码（th-TH / ja-JP / ko-KR / en-US / fr-FR） */
  targetLangCode: string;
  /** OpenRouter 模型 id */
  model: string;
}

export const TARGET_LANGS = [
  { name: '泰语', code: 'th-TH' },
  { name: '日语', code: 'ja-JP' },
  { name: '韩语', code: 'ko-KR' },
  { name: '英语', code: 'en-US' },
  { name: '法语', code: 'fr-FR' },
];

export const MODEL_OPTIONS = [
  { id: 'openai/gpt-4o', label: 'openai/gpt-4o（推荐 · 支持识图）' },
  { id: 'openai/gpt-4o-mini', label: 'openai/gpt-4o-mini（轻量）' },
  { id: 'anthropic/claude-3.5-sonnet', label: 'anthropic/claude-3.5-sonnet' },
  { id: 'google/gemini-1.5-flash', label: 'google/gemini-1.5-flash' },
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  countryCode: 'TH',
  countryZh: '泰国',
  targetLang: '泰语',
  targetLangCode: 'th-TH',
  model: 'openai/gpt-4o',
};

let cached: AppSettings | null = null;

export async function loadAppSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      cached = {
        countryCode: parsed.countryCode || DEFAULT_APP_SETTINGS.countryCode,
        countryZh: parsed.countryZh || DEFAULT_APP_SETTINGS.countryZh,
        targetLang: parsed.targetLang || DEFAULT_APP_SETTINGS.targetLang,
        targetLangCode: parsed.targetLangCode || DEFAULT_APP_SETTINGS.targetLangCode,
        model: parsed.model || DEFAULT_APP_SETTINGS.model,
      };
      return cached;
    }
  } catch {
    // 读取失败按默认值
  }
  cached = { ...DEFAULT_APP_SETTINGS };
  return cached;
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  cached = { ...settings };
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(cached));
  } catch (err) {
    console.warn('[AppSettings] save failed:', err);
  }
}

/** 同步读取内存设置（引擎侧调用；未加载时用默认值） */
export function getCachedSettings(): AppSettings {
  return cached ?? { ...DEFAULT_APP_SETTINGS };
}
