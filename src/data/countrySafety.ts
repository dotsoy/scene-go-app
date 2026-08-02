/**
 * 国家/地区预设安全信息数据集（离线、确定性，紧急时刻不依赖网络与模型）。
 * v1 覆盖 Top 出海目的地 8 国。
 *
 * 注意：电话/惯例数据为人工整理，上线前请逐条核验（领事馆电话以中国领事服务网为准）。
 */

export interface CountrySafety {
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

export const COUNTRY_SAFETY: CountrySafety[] = [
  {
    code: 'CN',
    nameZh: '中国',
    nameEn: 'China',
    langCode: 'zh-CN',
    emergency: { police: '110', ambulance: '120', fire: '119' },
    embassy: '',
    tipping: '无小费文化',
    voltage: '220V · A/C/I 型插座',
    currency: '人民币 CNY',
    water: '自来水不建议直饮，喝烧开的水或瓶装水',
    scams: ['景区门口"低价团"/黄牛票', '火车站/机场"好心人"代购车票骗局'],
    sos: { local: '请帮我报警', phonetic: 'Qing bang wo bao jing' },
  },
  {
    code: 'TH',
    nameZh: '泰国',
    nameEn: 'Thailand',
    langCode: 'th-TH',
    emergency: { police: '191', ambulance: '1669', fire: '199', touristPolice: '1155' },
    embassy: '+66 2 245 7010',
    tipping: '小费非强制，服务好可留零钱或约 10%',
    voltage: '220V · A/C 型插座',
    currency: '泰铢 THB',
    water: '自来水不建议直饮，买瓶装水',
    scams: ['突突车绕路/虚高报价，上车前谈好价', '大皇宫"今天关门"骗局——带你去的不是大皇宫'],
    sos: { local: 'ขอความช่วยเหลือด้วยครับ โปรดเรียกตำรวจ', phonetic: 'Kho khwam chuai luea duay khrap' },
  },
  {
    code: 'JP',
    nameZh: '日本',
    nameEn: 'Japan',
    langCode: 'ja-JP',
    emergency: { police: '110', ambulance: '119', fire: '119' },
    embassy: '+81 3 3403 3064',
    tipping: '无小费文化，切勿留小费',
    voltage: '100V · A/B 型插座',
    currency: '日元 JPY',
    water: '自来水可直接饮用',
    scams: ['居酒屋/黑酒吧结账陷阱（先问清收费）', '歌舞伎町拉客进店高价消费'],
    sos: { local: '助けてください。警察を呼んでください', phonetic: 'Tasukete kudasai. Keisatsu o yonde kudasai' },
  },
  {
    code: 'KR',
    nameZh: '韩国',
    nameEn: 'South Korea',
    langCode: 'ko-KR',
    emergency: { police: '112', ambulance: '119', fire: '119' },
    embassy: '+82 2 755 0572',
    tipping: '无小费文化',
    voltage: '220V · C/F 型插座',
    currency: '韩元 KRW',
    water: '自来水可直饮（部分地区水质偏硬）',
    scams: ['明洞/梨泰院换汇缺斤少两，数清钞票', '出租车绕路，用 Kakao T 叫车'],
    sos: { local: '도와주세요. 경찰을 불러주세요', phonetic: 'Dowajuseyo. Gyeongchareul bulleojuseyo' },
  },
  {
    code: 'SG',
    nameZh: '新加坡',
    nameEn: 'Singapore',
    langCode: 'en-SG',
    emergency: { police: '999', ambulance: '995', fire: '995' },
    embassy: '+65 6471 2117',
    tipping: '多数账单已含 10% 服务费，无需另付',
    voltage: '230V · G 型插座',
    currency: '新加坡元 SGD',
    water: '水龙头水可直接饮用',
    scams: ['罚款极严：地铁饮食/吸烟/乱丢垃圾重罚', '路边"便宜手表/皮具"多为假货'],
    sos: { local: 'Please help me. Call the police', phonetic: 'Please help me. Call the police' },
  },
  {
    code: 'MY',
    nameZh: '马来西亚',
    nameEn: 'Malaysia',
    langCode: 'ms-MY',
    emergency: { police: '999', ambulance: '999', fire: '999' },
    embassy: '+60 3 2164 5301',
    tipping: '无强制，酒店行李员可给少量小费',
    voltage: '240V · G 型插座',
    currency: '林吉特 MYR',
    water: '部分地区自来水不建议直饮',
    scams: ['出租车不打表漫天要价，用 Grab', '街头"换汇优惠"骗局'],
    sos: { local: 'Tolong bantu saya. Panggil polis', phonetic: 'Tolong bantu saya. Panggil polis' },
  },
  {
    code: 'ID',
    nameZh: '印度尼西亚',
    nameEn: 'Indonesia',
    langCode: 'id-ID',
    emergency: { police: '110', ambulance: '118', fire: '113' },
    embassy: '+62 21 576 1037',
    tipping: '部分账单含 5-10% 服务费，可再留零钱',
    voltage: '230V · C/F 型插座',
    currency: '印尼盾 IDR',
    water: '自来水不建议直饮，买瓶装水',
    scams: ['换汇店汇率陷阱（先比价）', '包车司机强制带去购物点'],
    sos: { local: 'Tolong bantu saya. Panggil polisi', phonetic: 'Tolong bantu saya. Panggil polisi' },
  },
  {
    code: 'VN',
    nameZh: '越南',
    nameEn: 'Vietnam',
    langCode: 'vi-VN',
    emergency: { police: '113', ambulance: '115', fire: '114' },
    embassy: '+84 24 3823 5569',
    tipping: '非强制，餐厅可留 5-10%',
    voltage: '220V · A/C 型插座',
    currency: '越南盾 VND',
    water: '自来水不建议直饮，买瓶装水',
    scams: ['出租车绕路/调表，用 Grab', '"帮你拿行李"后索要高额小费'],
    sos: { local: 'Xin hãy giúp tôi. Gọi cảnh sát', phonetic: 'Sin hay zup toi. Goi kanh sat' },
  },
  {
    code: 'PH',
    nameZh: '菲律宾',
    nameEn: 'Philippines',
    langCode: 'fil-PH',
    emergency: { police: '911', ambulance: '911', fire: '911' },
    embassy: '+63 2 8231 1033',
    tipping: '常见 5-10%，酒店行李 20-50 比索',
    voltage: '220V · A/B 型插座',
    currency: '菲律宾比索 PHP',
    water: '自来水不建议直饮，买瓶装水',
    scams: ['机场换汇骗局，只去正规柜台', '街头乞丐/孩童纠缠乞讨'],
    sos: { local: 'Tulong po. Tumawag po kayo ng pulis', phonetic: 'Tulong po. Tumawag po kayo ng pulis' },
  },
];

export const SUPPORTED_COUNTRY_CODES = COUNTRY_SAFETY.map((c) => c.code);

export function getCountrySafety(code: string): CountrySafety | undefined {
  return COUNTRY_SAFETY.find((c) => c.code === code);
}
