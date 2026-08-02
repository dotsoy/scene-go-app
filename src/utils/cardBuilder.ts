/**
 * ScenarioResult → 表达卡 CardData 转换（纯函数，可单测）
 *
 * 动态卡优先使用 VLM 输出的当地语言字段；缺失时逐级降级，保证卡面不为空。
 */
import { ScenarioResult } from '../plugins/types';
import { CardData } from '../components/FlashCardView';

export function scenarioToCard(s: ScenarioResult, location: string): CardData {
  const fallbackText =
    s.recommendedPhrases?.[0]?.split('(')[0]?.trim() || s.translatedText || '请帮我';

  return {
    id: `sc-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    categoryTag: s.category || 'SCENE',
    locationName: location,
    title: s.title || '场景表达',
    targetText: s.targetText || fallbackText,
    phonetic: s.phonetic || '',
    subText: s.subText || '',
    localTip: s.localTip || s.tips?.[0] || '',
    languageCode: s.languageCode || 'zh-CN',
  };
}
