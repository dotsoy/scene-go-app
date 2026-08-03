import { MatcherPlugin, ScenarioResult } from '../types';
import { getPack } from '../../packs/packManager';

/**
 * 本地离线词库与场景匹配引擎。
 * 词库数据来自场景包（packManager.getPack().scenes），远程运营可覆盖。
 */
export class LocalDictMatcherPlugin implements MatcherPlugin {
  id = 'local-dict';
  name = '本地离线词库与场景匹配引擎';
  description = '基于本地轻量场景映射与关键特征检索，无需网络连接即可给出出行解读';

  async match(text: string, location?: string): Promise<ScenarioResult> {
    const lowerText = text.toLowerCase();

    for (const item of getPack().scenes) {
      const matchFound = item.keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
      if (matchFound) {
        return {
          title: item.title,
          category: item.category,
          originalText: text,
          translatedText: item.translatedText,
          tips: item.tips,
          recommendedPhrases: item.phrases,
        };
      }
    }

    // 默认通用匹配
    return {
      title: '识别到出行通用场景',
      category: 'GENERAL_SCENE',
      originalText: text,
      translatedText: text ? `相机画面分类特征:\n${text}` : '已识别当前相机物理场景。',
      tips: ['尝试对准特定标志或物品拍摄', '保持画面稳定与光线充足'],
      recommendedPhrases: ['Excuse me, could you help me? (打扰一下，能帮帮我吗？)'],
    };
  }
}
