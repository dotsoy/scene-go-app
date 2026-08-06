/**
 * 当前国家/地区选择持久化（AsyncStorage）
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@scenego/current-country';

export interface SavedCountry {
  code: string;
  nameZh: string;
  savedAt: number;
  /** 是否用户在弹窗中手动选择的目的地（true 时 GPS 检测不自动覆盖/提示，destination 为权威） */
  manual?: boolean;
}

export async function loadCountry(): Promise<SavedCountry | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.code === 'string') {
      return parsed as SavedCountry;
    }
  } catch {
    // 解析失败按未选择处理
  }
  return null;
}

export async function saveCountry(country: SavedCountry): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(country));
  } catch (err) {
    console.warn('[CountryStore] save failed:', err);
  }
}
