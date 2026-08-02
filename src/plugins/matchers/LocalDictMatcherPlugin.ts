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
    keywords: ['restaurant', 'food', 'dining_room', 'cafe', 'coffee', 'bakery', 'dish', 'menu', 'tom yum', 'pad thai', 'ต้มยำ', '餐厅', '餐馆', '饭店', '美食', '菜单', '咖啡', '菜品', '点餐', '忌口', '过敏', '冬阴功', '泰餐', '日料'],
    title: '异国餐厅/餐食点餐场景',
    category: 'RESTAURANT',
    translatedText: '已识别到【餐厅/美食场景】。可随时拍照解析菜单、确认过敏原或询问招牌菜。',
    tips: ['注意确认小费文化（如 10-15%）', '如有海鲜/花生/乳制品过敏请及时告知', '可要求 Mai Phet (不辣)'],
    phrases: ['Menu, please (请给我菜单)', 'Check, please (买单结账)', 'Mai Phet (请做不辣)', 'Aroy (很好吃)'],
  },
  {
    keywords: ['airport', 'terminal', 'gate', 'flight', 'airplane', 'boarding', 'aircraft', 'concourse', '机场', '航站楼', '登机口', '登机', '航班', '出入境', '海关'],
    title: '机场/出入境与登机场景',
    category: 'AIRPORT',
    translatedText: '已识别到【机场/航站楼场景】。请注意登机口变更与离境退税窗口。',
    tips: ['随身携带护照与电子登机牌', '注意核对广播 Final Call 提示', '海关退税单需在安检前盖章'],
    phrases: ['Where is Gate __? (登机口在哪？)', 'Boarding pass (登机牌)', 'Tax Refund (退税窗口)'],
  },
  {
    keywords: ['hotel', 'bedroom', 'room', 'reception', 'lobby', 'resort', 'concierge', '酒店', '旅馆', '民宿', '前台', '入住', '退房', '客房'],
    title: '酒店入住与前台场景',
    category: 'HOTEL',
    translatedText: '已识别到【酒店/住宿场景】。支持办理入住 Check-in、查询 Wi-Fi 或延迟退房。',
    tips: ['通常需缴纳押金 Deposit', '确认是否包含早餐 Breakfast included', '退房时间 Check-out 通常为 12:00'],
    phrases: ['Check-in, please (办理入住)', 'Wi-Fi password? (Wi-Fi密码是多少？)', 'Late check-out? (申请延迟退房)'],
  },
  {
    keywords: ['street', 'road', 'traffic', 'subway', 'station', 'train', 'bus', 'vehicle', 'taxi', 'transportation', '地铁', '公交', '车站', '出租', '打车', '轻轨', '交通', '街道', '路口', '高速公路', '斑马线'],
    title: '城市交通与街景出行场景',
    category: 'TRANSPORT',
    translatedText: '已识别到【街景/公共交通场景】。方便查询轻轨换乘、出租车打表或目的地问路。',
    tips: ['建议提前准备零钱或交通卡', '出租车上车前确认打表 By meter', '随身保管好背包与手机'],
    phrases: ['By meter, please (请打表)', 'Where is the station? (车站在哪？)', 'How much to __? (去__多少钱？)'],
  },
  {
    keywords: ['store', 'shop', 'market', 'mall', 'shopping', 'supermarket', 'boutique', 'tax free', 'vat refund', '商场', '商店', '超市', '购物', '免税', '退税', '柜台', '专卖店'],
    title: '商场与购物退税场景',
    category: 'SHOPPING',
    translatedText: '已识别到【购物/商场场景】。支持查看免税标志 Tax Free、问价与开立退税单据。',
    tips: ['购物前询问是否支持 Tax Free 免税', '单店消费满额可开立 P.P.10 退税单', '保留原始购物小票与护照'],
    phrases: ['How much is this? (这个多少钱？)', 'Can I get a discount? (有折扣吗？)', 'Tax free form? (可以开退税单吗？)'],
  },
];

export class LocalDictMatcherPlugin implements MatcherPlugin {
  id = 'local-dict';
  name = '本地离线词库与场景匹配引擎';
  description = '基于本地轻量场景映射与关键特征检索，无需网络连接即可给出出行解读';

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
