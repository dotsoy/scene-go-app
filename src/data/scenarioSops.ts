/**
 * 场景 SOP 离线内容与构建器（唯一内容源，实现者逐字使用）。
 * 打车/药店/机场胶囊/回卡 = 离线确定性内容（模板 + 占位槽，不依赖云）。
 * 语言模型（2026-08-04 用户定稿）：不绑定任何国家；v1 内容层限 中文/英语
 * （用户侧文案 { zh, en } 按档案语言取用），卡面大字为英文表达（对当地人通用）；
 * 泰语等当地语言表达包后期拓展（设计稿的泰语仅为例图）。
 * 全部命中逻辑大小写不敏感；映射查找用 text.includes(key)。
 */
import { CardData, CardStep, MenuDish } from '../core/types';

/** 双语文案层（zh-CN / en-US） */
export interface Bilingual {
  zh: string;
  en: string;
}

export type Lang = 'zh-CN' | 'en-US';

/** 机场场景胶囊（对话页推荐条） */
export interface AirportCapsule {
  key: string;
  emoji: string;
  label: Bilingual;
  accent?: boolean;
}

/** 目的地（打车步骤 1 槽位）；键为中文/英文别名，值固定去重（中文名规范） */
export const DEST_MAP: Record<string, { zh: string; en: string }> = {
  素万那普机场: { zh: '素万那普机场', en: 'Suvarnabhumi Airport' },
  suvarnabhumi: { zh: '素万那普机场', en: 'Suvarnabhumi Airport' },
  廊曼机场: { zh: '廊曼机场', en: 'Don Mueang Airport' },
  'don mueang': { zh: '廊曼机场', en: 'Don Mueang Airport' },
  donmueang: { zh: '廊曼机场', en: 'Don Mueang Airport' },
  大皇宫: { zh: '大皇宫', en: 'the Grand Palace' },
  'grand palace': { zh: '大皇宫', en: 'the Grand Palace' },
  火车站: { zh: '火车站', en: 'the train station' },
  'train station': { zh: '火车站', en: 'the train station' },
  机场: { zh: '机场', en: 'the airport' },
  airport: { zh: '机场', en: 'the airport' },
};

/** 症状映射（药店步骤 1）；键为中文/英文别名，值去重（中文名规范）；med = 对应药名 */
export const SYMPTOM_MAP: Record<string, { zh: string; en: string; medZh: string; medEn: string }> = {
  发烧: { zh: '发烧', en: 'a fever', medZh: '退烧药', medEn: 'fever medicine' },
  fever: { zh: '发烧', en: 'a fever', medZh: '退烧药', medEn: 'fever medicine' },
  头痛: { zh: '头痛', en: 'a headache', medZh: '止痛药', medEn: 'painkillers' },
  headache: { zh: '头痛', en: 'a headache', medZh: '止痛药', medEn: 'painkillers' },
  咳嗽: { zh: '咳嗽', en: 'a cough', medZh: '止咳药', medEn: 'cough medicine' },
  cough: { zh: '咳嗽', en: 'a cough', medZh: '止咳药', medEn: 'cough medicine' },
  肚子痛: { zh: '肚子痛', en: 'a stomachache', medZh: '肠胃药', medEn: 'stomach medicine' },
  stomachache: { zh: '肚子痛', en: 'a stomachache', medZh: '肠胃药', medEn: 'stomach medicine' },
  感冒: { zh: '感冒', en: 'a cold', medZh: '感冒药', medEn: 'cold medicine' },
  cold: { zh: '感冒', en: 'a cold', medZh: '感冒药', medEn: 'cold medicine' },
  牙痛: { zh: '牙痛', en: 'a toothache', medZh: '止痛药', medEn: 'painkillers' },
  toothache: { zh: '牙痛', en: 'a toothache', medZh: '止痛药', medEn: 'painkillers' },
  喉咙痛: { zh: '喉咙痛', en: 'a sore throat', medZh: '润喉药', medEn: 'throat lozenges' },
  'sore throat': { zh: '喉咙痛', en: 'a sore throat', medZh: '润喉药', medEn: 'throat lozenges' },
  过敏: { zh: '过敏', en: 'an allergy', medZh: '抗过敏药', medEn: 'antihistamines' },
  allergy: { zh: '过敏', en: 'an allergy', medZh: '抗过敏药', medEn: 'antihistamines' },
};

/** 过敏原映射（点餐卡 + 药店步骤 2）；键为中文/英文别名，值去重 */
export const ALLERGEN_MAP: Record<string, { zh: string; en: string }> = {
  花生: { zh: '花生', en: 'peanuts' },
  peanut: { zh: '花生', en: 'peanuts' },
  海鲜: { zh: '海鲜', en: 'seafood' },
  seafood: { zh: '海鲜', en: 'seafood' },
  乳制品: { zh: '乳制品', en: 'dairy' },
  dairy: { zh: '乳制品', en: 'dairy' },
  牛肉: { zh: '牛肉', en: 'beef' },
  beef: { zh: '牛肉', en: 'beef' },
  猪肉: { zh: '猪肉', en: 'pork' },
  pork: { zh: '猪肉', en: 'pork' },
  辣: { zh: '辣', en: 'spicy food' },
  spicy: { zh: '辣', en: 'spicy food' },
  阿司匹林: { zh: '阿司匹林', en: 'aspirin' },
  aspirin: { zh: '阿司匹林', en: 'aspirin' },
  药物: { zh: '药物', en: 'medicine' },
  medicine: { zh: '药物', en: 'medicine' },
};

/** SOP 模板槽位（任意结构，由各模板 buildSteps 读取） */
export type SopSlots = Record<string, unknown>;

interface SopReplyOptionTemplate {
  emoji: string;
  label: Bilingual;
  title: Bilingual;
  targetText: string;
  subText: Bilingual;
}

/** SOP 模板：类别/标题/顶行胶囊/引导语 + 步骤构建器 + 回应选项模板 */
export interface SopTemplate {
  categoryTag: string;
  title: Bilingual;
  allPillText: Bilingual;
  stepsLead: Bilingual;
  localTip: Bilingual;
  languageCode: string;
  reply?: { label: Bilingual; options: SopReplyOptionTemplate[] };
  buildSteps: (slots: SopSlots, lang: Lang) => CardStep[];
}

const newId = () => `sc-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

const pick = (b: Bilingual, lang: Lang) => (lang === 'en-US' ? b.en : b.zh);

/** 打车模板：2 步 + 回应选项（槽位 dest: { zh, en }） */
export const TAXI_SOP: SopTemplate = {
  categoryTag: '打车指引',
  title: { zh: '打车 · 一卡全览', en: 'Taxi · All in One Card' },
  allPillText: { zh: '一卡全览', en: 'All steps' },
  stepsLead: { zh: '全部步骤一张卡 · 点任意步骤可放大', en: 'All steps in one card · tap any step to zoom' },
  localTip: {
    zh: '上车前确认打表 By meter，拒载/不打表可换车；先谈好价格再上车更稳妥。',
    en: 'Agree on the price or confirm “by meter” before you get in.',
  },
  languageCode: 'en-US',
  reply: {
    label: { zh: '听完司机回答后选择', en: 'Choose after the driver replies' },
    options: [
      {
        emoji: '✅',
        label: { zh: '好的，出发', en: "OK, let's go" },
        title: { zh: '同意出发', en: "OK, let's go" },
        targetText: "OK, let's go!",
        subText: { zh: '好的，出发', en: "OK, let's go!" },
      },
      {
        emoji: '❌',
        label: { zh: '太贵了，换个方式', en: "Too expensive, let's change" },
        title: { zh: '价格太贵', en: 'Too expensive' },
        targetText: "Too expensive, let's find another way.",
        subText: { zh: '太贵了，换个方式', en: "Too expensive, let's find another way." },
      },
    ],
  },
  buildSteps: (slots, lang) => {
    const dest = slots.dest as { zh: string; en: string };
    return [
      {
        tag: '① 说需求 · 点此放大',
        tagColor: '#38bdf8',
        targetText: `Please take me to ${dest.en}.`,
        phonetic: '',
        supplement: pick(
          { zh: `请送我去${dest.zh}`, en: `Please take me to ${dest.en}.` },
          lang,
        ),
        chips: [
          { emoji: '🚕', label: pick({ zh: '打表计费', en: 'By meter' }, lang) },
          { emoji: '🛣', label: pick({ zh: '不走高速', en: 'No highway' }, lang) },
        ],
      },
      {
        tag: '② 问清楚 · 点此放大',
        tagColor: '#facc15',
        targetText: `How much is the fare to ${dest.en}?`,
        phonetic: '',
        supplement: pick({ zh: '请问车费多少', en: 'How much is the fare?' }, lang),
      },
    ];
  },
};

/** 药店模板：3 步（槽位 symptoms: SYMPTOM_MAP 规范中文 key 的 1–2 个；allergen: { zh, en }） */
export const PHARMACY_SOP: SopTemplate = {
  categoryTag: '药店购药指引',
  title: { zh: '药店购药 · 一卡全览', en: 'Pharmacy · All in One Card' },
  allPillText: { zh: '3 步一张卡', en: '3 steps, one card' },
  stepsLead: { zh: '3 步同样一张卡 · 点任意步骤可放大', en: '3 steps in one card · tap any step to zoom' },
  localTip: {
    zh: '常见药一般可凭本卡在药店购买；不确定时出示给药剂师看。',
    en: 'Common medicines are usually available over the counter. Show this card to the pharmacist if unsure.',
  },
  languageCode: 'en-US',
  buildSteps: (slots, lang) => {
    const symptomKeys = (slots.symptoms as string[]) ?? [];
    const s1 = SYMPTOM_MAP[symptomKeys[0]];
    const s2 = symptomKeys.length > 1 ? SYMPTOM_MAP[symptomKeys[1]] : null;
    const allergen = (slots.allergen as { zh: string; en: string }) ?? ALLERGEN_MAP['药物'];
    return [
      {
        tag: '① 说需求 · 点此放大',
        tagColor: '#38bdf8',
        targetText: s2
          ? `I have ${s1.en} and ${s2.en}. Do you have ${s1.medEn}?`
          : `I have ${s1.en}. Do you have ${s1.medEn}?`,
        phonetic: '',
        supplement: pick(
          s2
            ? { zh: `我${s1.zh}和${s2.zh}，有${s1.medZh}吗？`, en: `I have ${s1.en} and ${s2.en}. Do you have ${s1.medEn}?` }
            : { zh: `我${s1.zh}，有${s1.medZh}吗？`, en: `I have ${s1.en}. Do you have ${s1.medEn}?` },
          lang,
        ),
      },
      {
        tag: '② 说明忌口 · 点此放大',
        tagColor: '#facc15',
        targetText: `I'm allergic to ${allergen.en}.`,
        phonetic: '',
        supplement: pick(
          { zh: `我${allergen.zh}过敏`, en: `I'm allergic to ${allergen.en}.` },
          lang,
        ),
      },
      {
        tag: '③ 问用法 · 点此放大',
        tagColor: '#81C784',
        targetText: 'Take 1 tablet 3 times a day.',
        phonetic: '',
        supplement: pick(
          { zh: '一次一粒 一日三次', en: 'Take 1 tablet 3 times a day.' },
          lang,
        ),
      },
    ];
  },
};

/** 机场场景胶囊：内容通用（不绑定国家），始终返回 3 个 */
export function getAirportCapsules(): AirportCapsule[] {
  return [
    { key: 'taxi', emoji: '🚕', label: { zh: '机场打车', en: 'Taxi to airport' }, accent: true },
    { key: 'last-train', emoji: '🚆', label: { zh: '机场快线末班', en: 'Last airport train' } },
    { key: 'esim', emoji: '📶', label: { zh: '激活 eSIM', en: 'Activate eSIM' } },
  ];
}

/** 位置字符串 → 目的地（打车步骤 1 槽位）；未命中 → 通用机场 */
export function detectAirportDest(placeName: string): { zh: string; en: string } {
  const lower = placeName.toLowerCase();
  if (
    lower.includes('suvarnabhumi') ||
    placeName.includes('สุวรรณภูมิ') ||
    placeName.includes('素万那普')
  ) {
    return DEST_MAP['素万那普机场'];
  }
  if (
    /don\s?mue?ang/.test(lower) ||
    placeName.includes('ดอนเมือง') ||
    placeName.includes('廊曼')
  ) {
    return DEST_MAP['廊曼机场'];
  }
  if (lower.includes('airport') || placeName.includes('机场') || placeName.includes('สนามบิน')) {
    return DEST_MAP['机场'];
  }
  return DEST_MAP['机场'];
}

function buildReplyCard(
  o: SopReplyOptionTemplate,
  categoryTag: string,
  location: string,
  languageCode: string,
  lang: Lang,
): CardData {
  return {
    id: newId(),
    categoryTag,
    locationName: location,
    title: pick(o.title, lang),
    targetText: o.targetText,
    phonetic: '',
    subText: pick(o.subText, lang),
    localTip: '',
    languageCode,
  };
}

/** 模板 → 一卡全览 CardData；步骤 0 字段镜像到顶层（ExprCard/FlashCardView 兼容） */
export function buildStepsCard(
  sop: SopTemplate,
  slots: SopSlots,
  location: string,
  lang: Lang = 'zh-CN',
): CardData {
  const steps = sop.buildSteps(slots, lang);
  const s0 = steps[0];
  return {
    id: newId(),
    categoryTag: sop.categoryTag,
    locationName: location,
    title: pick(sop.title, lang),
    targetText: s0.targetText,
    phonetic: s0.phonetic ?? '',
    subText: s0.supplement ?? '',
    localTip: pick(sop.localTip, lang),
    languageCode: sop.languageCode,
    steps,
    stepsLead: pick(sop.stepsLead, lang),
    allPillText: pick(sop.allPillText, lang),
    reply: sop.reply
      ? {
          label: pick(sop.reply.label, lang),
          options: sop.reply.options.map((o) => ({
            emoji: o.emoji,
            label: pick(o.label, lang),
            replyCard: buildReplyCard(o, sop.categoryTag, location, sop.languageCode, lang),
          })),
        }
      : undefined,
  };
}

/** 单步普通表达卡 */
export function buildSingleCard(
  cfg: {
    categoryTag: string;
    title: Bilingual;
    targetText: string;
    subText: Bilingual;
    localTip: Bilingual;
    languageCode: string;
  },
  lang: Lang = 'zh-CN',
): CardData {
  return {
    id: newId(),
    categoryTag: cfg.categoryTag,
    locationName: '',
    title: pick(cfg.title, lang),
    targetText: cfg.targetText,
    phonetic: '',
    subText: pick(cfg.subText, lang),
    localTip: pick(cfg.localTip, lang),
    languageCode: cfg.languageCode,
  };
}

/** 胶囊 → 成卡（taxi 用 TAXI_SOP 槽位 {dest}，其余单卡）；locationName 由调用方回填 */
export function buildCapsuleCard(
  capsule: AirportCapsule,
  slots: { dest: { zh: string; en: string } },
  location: string,
  lang: Lang = 'zh-CN',
): CardData {
  if (capsule.key === 'taxi') {
    return buildStepsCard(TAXI_SOP, { dest: slots.dest }, location, lang);
  }
  if (capsule.key === 'last-train') {
    return {
      ...buildSingleCard(
        {
          categoryTag: '机场指引',
          title: { zh: '机场快线末班车', en: 'Last airport train' },
          targetText: 'What time is the last airport train?',
          subText: {
            zh: '请问机场快线最后一班是几点',
            en: 'What time is the last airport train?',
          },
          localTip: {
            zh: '机场快线末班通常约 24:00，建议提前 30 分钟到站台。',
            en: 'The last airport train usually leaves around midnight. Arrive at the platform 30 minutes early.',
          },
          languageCode: 'en-US',
        },
        lang,
      ),
      locationName: location,
    };
  }
  return {
    ...buildSingleCard(
      {
        categoryTag: '机场指引',
        title: { zh: '激活 eSIM', en: 'Activate eSIM' },
        targetText: 'Could you help me activate my eSIM?',
        subText: { zh: '请帮我激活 eSIM 流量卡', en: 'Please help me activate my eSIM data plan.' },
        localTip: {
          zh: '激活后重启手机并打开蜂窝数据；部分地区需出示护照实名认证。',
          en: 'Restart your phone and enable Cellular Data after activation. Passport ID may be required.',
        },
        languageCode: 'en-US',
      },
      lang,
    ),
    locationName: location,
  };
}

/**
 * 菜单解读 → 点餐大字卡。
 * 表达为英文句（对服务员通用）：菜名优先 VLM 英文名，缺省用当地语言菜名；
 * 过敏原经 ALLERGEN_MAP 归一（dish.allergens[0] 为中文或英文均可）；
 * dish.spice 含 🌶️ 时追加「少辣」。
 */
export function buildOrderCard(
  dish: MenuDish,
  opts: { location: string; languageCode: string },
): CardData {
  const allergenZh = dish.allergens?.[0];
  const allergen = allergenZh ? ALLERGEN_MAP[allergenZh] : undefined;
  const dishName = dish.en || dish.th;

  if (allergen) {
    const targetText = `${dishName} without ${allergen.en}, please`;
    return {
      id: newId(),
      categoryTag: 'RESTAURANT',
      locationName: opts.location,
      title: dish.zh,
      targetText,
      phonetic: '',
      subText: `「${dish.zh}」· 不要${allergen.zh}${dish.spice.includes('🌶️') ? ' · 少辣' : ''}（${targetText}）`,
      localTip: `点餐时向服务员出示本卡，说明不要${allergen.zh}；上菜前可再次确认是否含${allergen.zh}。`,
      languageCode: opts.languageCode,
    };
  }

  const targetText = `${dishName}, please`;
  return {
    id: newId(),
    categoryTag: 'RESTAURANT',
    locationName: opts.location,
    title: dish.zh,
    targetText,
    phonetic: '',
    subText: `「${dish.zh}」· ${dish.price}`,
    localTip: '点餐时向服务员出示本卡即可。',
    languageCode: opts.languageCode,
  };
}
