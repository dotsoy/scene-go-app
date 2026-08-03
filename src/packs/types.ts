/**
 * 场景包（Scene Pack）类型定义。
 * 场景包 = 版本化的离线内容包：场景词库 + 国家安全数据。
 * 客户端内嵌 DEFAULT_PACK，运营后台就绪后通过 packManager 远程下发覆盖。
 */

/** 离线场景词库条目（本地匹配引擎用） */
export interface SceneDictItem {
  keywords: string[];
  title: string;
  category: string;
  translatedText: string;
  tips: string[];
  phrases: string[];
}

/** 国家安全/惯例数据（安全卡 + 大字 SOS 用） */
export interface CountrySafetyData {
  /** ISO 3166-1 alpha-2 */
  code: string;
  nameZh: string;
  nameEn: string;
  /** TTS 语言代码（expo-speech） */
  langCode: string;
  emergency: {
    police: string;
    ambulance: string;
    fire: string;
    /** 旅游警察（部分国家提供） */
    touristPolice?: string;
  };
  /** 中国驻当地使领馆领事保护电话（显示用，含国家码） */
  embassy: string;
  tipping: string;
  voltage: string;
  currency: string;
  water: string;
  scams: string[];
  /** 当地语言求助句（大字卡 targetText） */
  sos: { local: string; phonetic: string };
}

/** 版本化场景包 */
export interface ScenePack {
  /** 包结构 schema 版本（结构变更时递增，客户端据此做迁移） */
  schemaVersion: number;
  /** 内容版本号（运营发布号，如 2026.08.03-1） */
  version: string;
  /** 发布时间（ISO 8601） */
  updatedAt: string;
  scenes: SceneDictItem[];
  countries: CountrySafetyData[];
}
