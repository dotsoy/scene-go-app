/**
 * 国家/安全卡编排：国家选择、切换、启动检测 → 安全卡入栈（与 UI 无关）。
 * UI 只负责展示与回调；本模块处理持久化与卡栈联动。
 */
import { loadCountry, saveCountry, SavedCountry } from '../utils/countryStore';
import { loadUserProfile, saveUserProfile, UserProfile } from '../utils/userProfile';
import { getCountrySafety } from '../data/countrySafety';
import { getPlaceContext, PlaceContext } from '../utils/locationContext';
import { cardStackStore } from './cardStackStore';
import { CardData } from './types';

export interface CountryInitResult {
  cached: SavedCountry | null;
  profile: UserProfile | null;
  place: PlaceContext | null;
  /** GPS 检测国家与缓存不一致时提示切换 */
  switchPrompt: { detectedName: string } | null;
}

export const countryController = {
  /** 当前位置预设安全卡（卡栈第一张） */
  buildSafetyCard(country: SavedCountry, city?: string): CardData {
    const s = getCountrySafety(country.code)!;
    const dials = [
      { num: s.emergency.police, label: '警察' },
      { num: s.emergency.ambulance, label: '救护车' },
      { num: s.emergency.fire, label: '火警' },
      ...(s.emergency.touristPolice ? [{ num: s.emergency.touristPolice, label: '旅游警察' }] : []),
    ];
    return {
      id: `safety-${country.code}`,
      categoryTag: '本地安全指南',
      locationName: `${country.nameZh}${city ? ' · ' + city : ''}`,
      title: `${country.nameZh}安全与实用信息`,
      targetText: s.sos.local,
      phonetic: s.sos.phonetic,
      subText: `紧急电话：警察 ${s.emergency.police} · 急救 ${s.emergency.ambulance} · 火警 ${s.emergency.fire}${s.emergency.touristPolice ? ` · 旅游警察 ${s.emergency.touristPolice}` : ''}`,
      localTip: `使领馆领保 ${s.embassy} · ${s.tipping}`,
      languageCode: s.langCode,
      dials,
    };
  },

  ensureSafetyCard(country: SavedCountry, city?: string): void {
    if (!getCountrySafety(country.code)) return;
    cardStackStore.getState().add(this.buildSafetyCard(country, city));
  },

  /** 启动流程：加载缓存国家/档案 + GPS 检测；不一致且非手动目的地时生成切换提示 */
  async init(): Promise<CountryInitResult> {
    const cached = await loadCountry();
    const profile = await loadUserProfile();
    const place = await getPlaceContext();
    let switchPrompt: { detectedName: string } | null = null;
    if (cached) {
      if (place?.countryCode && place.countryCode !== cached.code) {
        // 手动设定的目的地是权威：位置不同仅重放安全卡，不打扰用户
        if (cached.manual) {
          this.ensureSafetyCard(cached, place?.city);
        } else {
          const detected = getCountrySafety(place.countryCode);
          if (detected) {
            switchPrompt = { detectedName: detected.nameZh };
          } else {
            this.ensureSafetyCard(cached, place?.city);
          }
        }
      } else {
        this.ensureSafetyCard(cached, place?.city);
      }
    }
    return { cached, profile, place, switchPrompt };
  },

  /**
   * 确认国家（首次启动/手动切换/检测切换）：保存档案 + 缓存国家 + 生成安全卡。
   * manual=true 表示弹窗内手动选择的目的地（后续 GPS 差异不自动提示）；false 为 GPS 跟随确认。
   * 返回是否有效（国家不在支持清单时返回 false，由 UI 处理）。
   */
  async confirm(code: string, profile: UserProfile, city?: string, manual = false): Promise<boolean> {
    const s = getCountrySafety(code);
    await saveUserProfile(profile);
    if (!s) return false;
    const saved: SavedCountry = { code, nameZh: s.nameZh, savedAt: Date.now(), manual };
    await saveCountry(saved);
    this.ensureSafetyCard(saved, city);
    return true;
  },

  /** 切换国家（GPS 检测到不同国家，用户确认切换）——跟随定位，保留自动检测能力 */
  async switchTo(detectedCode: string, profile: UserProfile, city?: string): Promise<boolean> {
    return this.confirm(detectedCode, profile, city, false);
  },

  /** 保持当前国家（重放安全卡） */
  keep(country: SavedCountry, city?: string): void {
    this.ensureSafetyCard(country, city);
  },
};
