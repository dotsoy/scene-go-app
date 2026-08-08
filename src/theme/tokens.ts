/**
 * 设计 Token —— 与 docs/reference/DESIGN-v2.1.pen 的 variables + 圆角体系一一对应。
 * 唯一权威来源：改视觉先改这里，组件不再硬编码十六进制/圆角/字体。
 * 命名对齐设计稿：colors.xxx / radii.xxx / fonts.xxx。
 */
export const colors = {
  /** 主背景 */
  bgPrimary: '#09090b',
  /** 卡片深底 */
  bgCard: '#121214',
  /** 卡片/气泡浅底 */
  bgCardLight: '#18181b',
  /** 遮罩层（Modal 背景） */
  bgOverlay: 'rgba(24,24,27,0.95)',
  /** 底部栏/状态条 */
  bgBar: 'rgba(10,10,30,0.85)',

  textPrimary: '#f4f4f5',
  textSecondary: '#a1a1aa',
  textTertiary: '#71717a',
  textMuted: '#52525b',

  accentBlue: '#4fc3f7',
  accentCyan: '#38bdf8',
  accentYellow: '#facc15',
  accentGreen: '#81C784',
  accentRed: '#ef5350',
  accentGreenBg: 'rgba(76,175,80,0.25)',
  accentRedBg: 'rgba(244,67,54,0.35)',

  borderSubtle: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.12)',
  borderBlue: 'rgba(79,195,247,0.4)',
  userBubble: 'rgba(37,99,235,0.15)',
  mask: 'rgba(0,0,0,0.65)',
} as const;

/** 圆角体系刻度（design-changelog SCN-14a 定稿） */
export const radii = {
  /** 微标签 */
  r6: 6,
  /** 建议回复选项块 */
  r10: 10,
  /** 通用按钮/图标容器 */
  r12: 12,
  /** 卡片与气泡 */
  r16: 16,
  /** 顶部返回按钮（44px 方钮） */
  r22: 22,
  /** 安全悬浮球（56px） */
  r28: 28,
} as const;

/** 字体族（Expo 内置/系统回退） */
export const fonts = {
  body: 'Inter',
  mono: 'JetBrains Mono',
} as const;
