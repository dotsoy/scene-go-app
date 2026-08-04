/**
 * 本地 SOP 意图匹配：一句话需求（中文/英文）→ 离线确定性表达卡。
 * 打车/药店命中即返回，未命中返回 null（交 VLM 单卡）。
 * 全部命中逻辑大小写不敏感；中文 key 用原文本 includes，英文 key 用小写文本 includes。
 */
import {
  PHARMACY_SOP,
  TAXI_SOP,
  ALLERGEN_MAP,
  SYMPTOM_MAP,
  DEST_MAP,
  buildStepsCard,
  Lang,
} from '../data/scenarioSops';
import { CardData } from './types';

const TAXI_KEYWORDS_ZH = ['打车', '出租车', '的士', '网约车', '打表'];
const TAXI_KEYWORDS_EN = ['taxi', 'cab', 'uber', 'grab'];
const PHARMACY_KEYWORDS_ZH = ['药店', '买药', '退烧', '发烧', '头痛', '咳嗽', '肚子痛', '感冒', '牙痛', '喉咙痛', '过敏', '药'];
const PHARMACY_KEYWORDS_EN = ['pharmacy', 'drugstore', 'medicine', 'fever', 'headache', 'cough', 'stomachache', 'cold', 'toothache', 'sore throat', 'allergy'];

export interface SopMatchContext {
  location?: string;
  /** 用户侧文案语言（zh-CN / en-US），默认 zh-CN */
  lang?: Lang;
  /** 用户已知过敏原（中文/英文均可），未来「个人档案」接入后使用 */
  allergens?: string[];
}

export const sopEngine = {
  matchLocalSop(text: string, ctx: SopMatchContext = {}): CardData | null {
    const location = ctx.location ?? '当前位置';
    const lang = ctx.lang ?? 'zh-CN';
    const lower = text.toLowerCase();

    // 药店：关键词命中且文本中含 ≥1 个已知症状（zh/en 别名，去重到规范中文名）
    const pharmacyHit =
      PHARMACY_KEYWORDS_ZH.some((k) => text.includes(k)) ||
      PHARMACY_KEYWORDS_EN.some((k) => lower.includes(k));
    if (pharmacyHit) {
      const symptoms: string[] = [];
      for (const key of Object.keys(SYMPTOM_MAP)) {
        const matched =
          lower.includes(key) || text.includes(key);
        if (!matched) continue;
        const canonical = SYMPTOM_MAP[key].zh;
        if (!symptoms.includes(canonical)) symptoms.push(canonical);
        if (symptoms.length >= 2) break;
      }
      if (symptoms.length >= 1) {
        const allergenZh = ctx.allergens?.[0];
        const allergen =
          allergenZh && ALLERGEN_MAP[allergenZh] ? ALLERGEN_MAP[allergenZh] : ALLERGEN_MAP['药物'];
        return buildStepsCard(PHARMACY_SOP, { symptoms, allergen }, location, lang);
      }
    }

    // 打车：关键词命中且文本含已知目的地；无目的地 → null（交 VLM）
    const taxiHit =
      TAXI_KEYWORDS_ZH.some((k) => text.includes(k)) ||
      TAXI_KEYWORDS_EN.some((k) => lower.includes(k));
    if (taxiHit) {
      const destKey = Object.keys(DEST_MAP).find((key) => lower.includes(key) || text.includes(key));
      if (destKey) {
        return buildStepsCard(TAXI_SOP, { dest: DEST_MAP[destKey] }, location, lang);
      }
    }

    return null;
  },
};
