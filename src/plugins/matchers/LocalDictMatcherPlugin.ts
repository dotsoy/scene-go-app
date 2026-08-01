import { MatcherPlugin, ScenarioResult } from '../types';

interface DictItem {
  keywords: string[];
  title: string;
  category: string;
  translatedText: string;
  tips: string[];
  phrases: string[];
}

const LOCAL_TRAVEL_DICTIONARY: DictItem[] = [
  {
    keywords: ['tom yum', 'tomyum', '冬阴功', 'ต้มยำ'],
    title: '泰式冬阴功海鲜汤',
    category: 'MENU',
    translatedText: 'Tom Yum Goong - 传统泰式酸辣虾汤，含有香茅、柠檬叶、良姜与辣椒。',
    tips: ['辣度较高', '含有海鲜/虾类过敏原', '可要求 Mai Phet (不辣)'],
    phrases: ['Mai Phet (请做不辣)', 'Aroy (好吃)'],
  },
  {
    keywords: ['pad thai', 'padthai', '泰式炒河粉', 'ผัดไทย'],
    title: '泰式炒河粉',
    category: 'MENU',
    translatedText: 'Pad Thai - 经典泰式炒米粉，配花生碎、豆芽与鲜虾。',
    tips: ['含有花生过敏原', '桌边通常配有鱼露与辣椒粉'],
    phrases: ['Mai Sai Thua (不要加花生粉)'],
  },
  {
    keywords: ['gate', 'boarding', 'flight', 'terminal', '登机口', '候机楼'],
    title: '机场登机提示',
    category: 'AIRPORT',
    translatedText: 'Airport Boarding Info - 机场登机牌/导览牌信息。',
    tips: ['请注意 Final Call 广播', '核对 Zone 区域按顺序登机'],
    phrases: ['Where is Gate __? (请问__号登机口在哪？)'],
  },
  {
    keywords: ['tax free', 'vat refund', 'duty free', '退税'],
    title: '商家退税标志',
    category: 'TAX',
    translatedText: 'VAT Refund - 离境游客退税服务标识。',
    tips: ['单日消费需满额度（如 2000 泰铢/日）', '需随身携带护照开立 P.P.10 单据'],
    phrases: ['Can I get a VAT refund form? (可以开具退税单吗？)'],
  },
];

export class LocalDictMatcherPlugin implements MatcherPlugin {
  id = 'local-dict';
  name = '本地离线词库匹配引擎';
  description = '基于本地轻量词库与关键字检索，无需网络连接即可给出出行解读';

  async match(text: string, location?: string): Promise<ScenarioResult> {
    const lowerText = text.toLowerCase();

    for (const item of LOCAL_TRAVEL_DICTIONARY) {
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

    // 默认兜底
    return {
      title: '未知通用文本',
      category: 'GENERAL',
      originalText: text,
      translatedText: text ? `识别文本内容:\n${text}` : '未能在画面中捕捉到清晰文本。',
      tips: ['尝试对准文字重新拍摄', '保持光线充足与画面稳定'],
      recommendedPhrases: ['Could you help me with this? (能帮我看看这个吗？)'],
    };
  }
}
