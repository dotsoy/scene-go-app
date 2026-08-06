/**
 * recommendedPhrases「当地语言短语 (中文翻译)」→ 上下结构横滑卡（纯函数，可单测）。
 * 无中文翻译的短语无法构成上下结构，不展示（避免误导）。
 */
export interface PhraseCard {
  id: string;
  foreignText: string;
  nativeText: string;
  hasAudio: boolean;
}

export function toPhraseCards(phrases: string[] | undefined): PhraseCard[] | undefined {
  if (!phrases || phrases.length === 0) return undefined;
  const cards: PhraseCard[] = [];
  for (const phrase of phrases.slice(0, 3)) {
    const m = phrase.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (!m) continue;
    cards.push({
      id: `phrase-${cards.length + 1}`,
      foreignText: m[1].trim(),
      nativeText: m[2].trim(),
      hasAudio: true,
    });
  }
  return cards.length > 0 ? cards : undefined;
}
