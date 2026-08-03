import { MatcherPlugin, ScenarioResult } from '../types';

interface DictItem {
  keywords: string[];
  title: string;
  category: string;
  translatedText: string;
  tips: string[];
  phrases: string[];
}

/**
 * 本地离线场景词典：按数组顺序匹配，更具体的场景（TAXI/METRO/TAX_REFUND）放在泛类（TRANSPORT/SHOPPING）之前。
 * 关键词面向全球目的地：中/英/泰/日/韩/法/德/西/意/俄/阿 语高频词，离线兜底用；云端 VLM 缺失或弱网时生效。
 */
const LOCAL_TRAVEL_DICTIONARY: DictItem[] = [
  {
    keywords: ['taxi', 'cab', 'ride', 'grab', 'by meter', 'meter', 'uber', '打车', '出租车', '的士', '打表', '网约车', '接机', 'แท็กซี่', 'タクシー', '택시', 'такси', 'تاكسي'],
    title: '出租车/网约车出行场景',
    category: 'TAXI',
    translatedText: '已识别到【出租车/网约车场景】。可生成"请打表"大字卡或直接向司机展示目的地。',
    tips: ['上车前确认打表 By meter，拒载/不打表可换车', '拉美/东南亚优先用网约车（Uber/Grab/99），价格透明', '提前准备好目的地当地语言地址'],
    phrases: ['By meter, please (请打表)', 'Please take me to __ (请带我去__)', 'Is it by meter? (是按表计费吗？)'],
  },
  {
    keywords: ['subway', 'metro', 'train', 'railway', 'underground', 'ticket machine', 'turnstile', 'platform', 'bts', 'mrt', '地铁', '轻轨', '轨道交通', '火车', '闸机', '购票', '换乘', '站台', 'รถไฟฟ้า', '地下鉄', '電車', '지하철', 'метро', 'métro', 'u-bahn', 'tren', 'métro', 'مترو'],
    title: '地铁/轻轨/铁路乘车场景',
    category: 'METRO',
    translatedText: '已识别到【地铁/轨道交通场景】。可查询购票机操作、换乘路线或闸机使用提示。',
    tips: ['购票机多支持英文界面，选 English', '注意单程票/储值卡区分（如 Rabbit Card、Oyster）', '部分城市地铁禁止饮食，罚款重（如新加坡/香港）'],
    phrases: ['Where is the ticket machine? (售票机在哪？)', 'One ticket to __, please (一张去__的票)', 'Which platform? (哪个站台？)'],
  },
  {
    keywords: ['restaurant', 'food', 'dining_room', 'cafe', 'coffee', 'bakery', 'dish', 'menu', 'tom yum', 'pad thai', 'ต้มยำ', '餐厅', '餐馆', '饭店', '美食', '菜单', '咖啡', '菜品', '点餐', '忌口', '过敏', '冬阴功', '泰餐', '日料', 'レストラン', '식당', 'ресторан', 'restaurant', 'nourriture', 'speisekarte', 'restaurante', 'comida', 'ristorante', 'مطعم'],
    title: '异国餐厅/餐食点餐场景',
    category: 'RESTAURANT',
    translatedText: '已识别到【餐厅/美食场景】。可随时拍照解析菜单、确认过敏原或询问招牌菜。',
    tips: ['注意确认小费文化（北美 15-20% / 欧洲含服务费 / 东亚无）', '如有海鲜/花生/乳制品过敏请及时告知', '菜单看不懂时可直接拍照交给 SceneGo 解读'],
    phrases: ['Menu, please (请给我菜单)', 'Check, please (买单结账)', 'I am allergic to __ (我对__过敏)', 'No spicy, please (请不要辣)'],
  },
  {
    keywords: ['airport', 'terminal', 'gate', 'flight', 'airplane', 'boarding', 'aircraft', 'concourse', '机场', '航站楼', '登机口', '登机', '航班', '出入境', '海关', '空港', 'aéroport', 'flughafen', 'aeropuerto', 'aeroporto', 'аэропорт', 'مطار'],
    title: '机场/出入境与登机场景',
    category: 'AIRPORT',
    translatedText: '已识别到【机场/航站楼场景】。请注意登机口变更与离境退税窗口。',
    tips: ['随身携带护照与电子登机牌', '注意核对广播 Final Call 提示', '退税单需在离境海关盖章（部分国家安检前）'],
    phrases: ['Where is Gate __? (登机口在哪？)', 'Boarding pass (登机牌)', 'Where is customs? (海关在哪？)'],
  },
  {
    keywords: ['hotel', 'bedroom', 'room', 'reception', 'lobby', 'resort', 'concierge', '酒店', '旅馆', '民宿', '前台', '入住', '退房', '客房', 'ホテル', '호텔', 'отель', 'hôtel', 'hotel', 'hotel', 'albergo', 'فندق'],
    title: '酒店入住与前台场景',
    category: 'HOTEL',
    translatedText: '已识别到【酒店/住宿场景】。支持办理入住 Check-in、查询 Wi-Fi 或延迟退房。',
    tips: ['通常需缴纳押金 Deposit，退房时退还', '确认是否包含早餐 Breakfast included', '部分城市征收城市税 City Tax（如欧洲/日本）'],
    phrases: ['Check-in, please (办理入住)', 'Wi-Fi password? (Wi-Fi密码是多少？)', 'Late check-out? (申请延迟退房)'],
  },
  {
    keywords: ['street', 'road', 'traffic', 'vehicle', 'bus', 'station', 'transportation', '交通', '街道', '路口', '高速公路', '斑马线', '公交', '车站', 'バス', 'автобус', 'bus', 'autobus', 'حافلة'],
    title: '城市交通与街景出行场景',
    category: 'TRANSPORT',
    translatedText: '已识别到【街景/公共交通场景】。方便查询公交线路、问路或目的地表达。',
    tips: ['提前准备零钱或交通卡', '欧洲公交多为前门上车/后门下车，注意打卡', '问路时展示当地语言地址最有效'],
    phrases: ['Where is the bus stop? (公交站在哪？)', 'Does this bus go to __? (这趟车去__吗？)', 'Excuse me, how do I get to __? (请问去__怎么走？)'],
  },
  {
    keywords: ['tax refund', 'vat refund', 'tax free', 'refund', '退税', '免税', '离境税', 'คืนภาษี', '免税', '세금 환급', 'remboursement', 'steuererstattung', 'devolución', 'возврат налога', 'استرداد الضريبة'],
    title: '购物退税办理场景',
    category: 'TAX_REFUND',
    translatedText: '已识别到【退税办理场景】。可生成退税申请表达卡，确认单据与退税率。',
    tips: ['欧盟各国退税门槛不同（如法国 100€），同店同天累计', '退税单需在离境机场海关盖章/机器扫描', '保留购物小票与商品，海关可能查验'],
    phrases: ['Tax refund form, please (请开退税单)', 'Where is the customs? (海关在哪？)', 'I would like a VAT refund (我要办理退税)'],
  },
  {
    keywords: ['store', 'shop', 'market', 'mall', 'shopping', 'supermarket', 'boutique', '商场', '商店', '超市', '购物', '柜台', '专卖店', 'ショッピング', 'magasin', 'geschäft', 'tienda', 'negozio', 'магазин', 'متجر'],
    title: '商场与购物场景',
    category: 'SHOPPING',
    translatedText: '已识别到【购物/商场场景】。支持查看免税标志 Tax Free、问价与砍价。',
    tips: ['购物前询问是否支持 Tax Free 免税', '保留原始购物小票', '比价时注意汇率与手续费'],
    phrases: ['How much is this? (这个多少钱？)', 'Can I get a discount? (有折扣吗？)', 'Tax free form? (可以开退税单吗？)'],
  },
  {
    keywords: ['pharmacy', 'drugstore', 'doctor', 'hospital', 'medicine', 'clinic', 'first aid', '药店', '医院', '医生', '药房', '诊所', '药品', '急诊', '病院', '薬局', '약국', 'аптека', 'pharmacie', 'apotheke', 'farmacia', 'farmacia', 'больница', 'صيدلية'],
    title: '医疗/药店/医院场景',
    category: 'MEDICAL',
    translatedText: '已识别到【医疗/药店场景】。可表达购药需求、症状描述或寻找医院。',
    tips: ['常见药（肠胃/发烧/过敏）可在药店直接购买，注意国家处方差异', '紧急情况拨打当地急救电话（见安全卡）', '出境前确认旅游保险含境外医疗'],
    phrases: ['I need medicine for __ (我需要__的药)', 'Where is the nearest pharmacy? (最近的药店在哪？)', 'I need a doctor (我需要看医生)'],
  },
  {
    keywords: ['currency exchange', 'money changer', 'atm', 'bank', 'withdraw', '兑换', '换汇', '取款', '汇率', '银行', '両替', '환전', 'обмен валюты', 'change', 'wechselstube', 'cambio', 'cambio', 'صرافة'],
    title: '换汇/ATM/银行场景',
    category: 'EXCHANGE',
    translatedText: '已识别到【换汇/取款场景】。可查询正规换汇点、ATM 手续费或汇率表达。',
    tips: ['优先正规换汇柜台/银行，街边"优惠汇率"多为骗局', 'ATM 取款注意手续费与单笔限额', '换钱当场数清，避免"缺斤少两"'],
    phrases: ['Where can I exchange money? (哪里可以换钱？)', 'What is the exchange rate? (汇率是多少？)', 'I want to withdraw cash (我要取现金)'],
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
