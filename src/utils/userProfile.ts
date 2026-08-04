/**
 * 用户档案：国别（国籍）+ 语言。SceneGo 面向各国人士，档案决定：
 * - 使领馆信息展示（本国驻当地领事保护；非中国籍暂以提示代替）
 * - 未来 UI 国际化的语言偏好
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@scenego/user-profile';

export interface UserProfile {
  /** 国籍（ISO 3166-1 alpha-2） */
  nationality: string;
  /** 语言（BCP-47） */
  language: string;
  /** 过敏原（中文，如 ['花生']）；目前无写入 UI，仅供药店分步卡读取与未来「个人档案」使用 */
  allergens?: string[];
}

/** 国籍可选列表（用户来源国，不限于目的地数据集） */
export const NATIONALITY_OPTIONS: { code: string; name: string }[] = [
  { code: 'CN', name: '中国' },
  { code: 'TH', name: '泰国' },
  { code: 'JP', name: '日本' },
  { code: 'KR', name: '韩国' },
  { code: 'SG', name: '新加坡' },
  { code: 'MY', name: '马来西亚' },
  { code: 'ID', name: '印度尼西亚' },
  { code: 'VN', name: '越南' },
  { code: 'PH', name: '菲律宾' },
  { code: 'US', name: '美国' },
  { code: 'GB', name: '英国' },
  { code: 'AU', name: '澳大利亚' },
];

/** 语言选项（UI 语言与表达偏好） */
export const LANGUAGE_OPTIONS: { code: string; name: string }[] = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'en-US', name: 'English' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'th-TH', name: 'ไทย' },
  { code: 'ms-MY', name: 'Bahasa Melayu' },
  { code: 'id-ID', name: 'Bahasa Indonesia' },
  { code: 'vi-VN', name: 'Tiếng Việt' },
  { code: 'fil-PH', name: 'Filipino' },
];

export async function loadUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.nationality === 'string' && typeof parsed.language === 'string') {
      return parsed as UserProfile;
    }
  } catch {
    // 解析失败按未设置处理
  }
  return null;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('[UserProfile] save failed:', err);
  }
}
