/**
 * 语音意图弱自动：转录文本 → 是否值得触发动态卡生成（纯函数，可单测）
 *
 * 规则是"闸门"而非"分类器"：命中任一高频出行表达主题关键词即触发，
 * 具体卡片内容由 VLM 按完整转录文本灵活生成，不做固定场景枚举。
 */
const INTENT_KEYWORDS = [
  // 交通
  '打车', '出租', '计程', 'taxi', '机场', '航班', 'airport', '车站', '地铁',
  '公交', '怎么去', '怎么走', '多少钱', '票', '车费',
  // 餐饮
  '餐厅', '菜单', '点餐', '忌口', '过敏', '辣', '不辣', '不要', '菜单',
  '打包', '买单', '结账', 'water', '冰',
  // 购物/退税
  '退税', '发票', '收据', 'refund', '折扣', '砍价', '便宜',
  // 住宿
  '酒店', '入住', '退房', 'hotel', '房间', 'wifi', 'wifi密码',
  // 药店/医疗
  '药店', '药', 'medicine', '医院', '医生', '头疼', '发烧', '拉肚子',
  // 紧急
  '救命', '警察', '报警', 'sos', 'help', '钱包', '护照丢了', '迷路',
  // 其他高频
  '厕所', '洗手间', '卫生间', 'toilet', '充电', '行李', '寄存',
];

export function detectCardIntent(text: string): boolean {
  const t = (text || '').toLowerCase();
  if (t.trim().length === 0) return false;
  return INTENT_KEYWORDS.some((kw) => t.includes(kw.toLowerCase()));
}
