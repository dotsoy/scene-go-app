/**
 * 核心层共享类型（与 UI 无关）。
 * 表达卡、会话、状态数据在此定义，UI 组件从本层引用（不再反向依赖组件）。
 */

/** 表达卡（递卡展示的核心数据） */
export interface CardData {
  id: string;
  categoryTag: string;
  locationName: string;
  title: string;
  targetText: string;
  phonetic: string;
  /** 补充说明/服务语句 */
  subText: string;
  localTip: string;
  languageCode: string;
  badgeColor?: string;
  /** 备用表达短语（当地语言 (中文翻译)），点击可朗读 */
  phrases?: string[];
  /** 出行提示列表（LOCAL PROTOCOL 展开） */
  tips?: string[];
  /** 来源快照会话 id：卡面提供「AI 解读」入口 */
  sessionId?: string;
  /** 安全卡专属：一键拨打号码（警察/救护/火警/旅游警察） */
  dials?: { num: string; label: string }[];
}

/**
 * V2 对话流消息（UI 渲染模型）。
 * 表达卡消息携带 CardData，与卡栈（cardStackStore）同源。
 */
export interface ChatMessage {
  id: string;
  kind: 'user' | 'assistant' | 'card' | 'system';
  /** 文本内容（user/assistant/system 消息） */
  content?: string;
  /** kind=assistant 解读消息的照片缩略 */
  imageUri?: string;
  /** kind=card：直接渲染表达卡（与卡栈共享数据源） */
  card?: CardData;
  createdAt: number;
}
