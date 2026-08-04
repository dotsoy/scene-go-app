/**
 * SceneGo 设计令牌（docs/UI_DESIGN_PROMPT.md §2）
 * 全部界面统一引用，禁止散落硬编码色值。
 */

export const COLORS = {
  bgPrimary: '#09090b',
  bgCard: '#121214',
  bgCardLight: '#18181b',
  bgOverlay: 'rgba(24,24,27,0.95)',
  bgBar: 'rgba(12,12,14,0.95)',
  textPrimary: '#f4f4f5',
  textSecondary: '#a1a1aa',
  textTertiary: '#71717a',
  textMuted: '#52525b',
  accentBlue: '#4fc3f7',
  accentCyan: '#38bdf8',
  accentYellow: '#facc15',
  accentGreen: '#81C784',
  accentRed: '#ef5350',
  greenBg: 'rgba(76,175,80,0.25)',
  redBg: 'rgba(244,67,54,0.35)',
  borderSubtle: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.12)',
  borderBlue: 'rgba(79,195,247,0.4)',
  grayBtnBg: 'rgba(255,255,255,0.06)',
  grayBtnText: '#777777',
  /** V2：用户消息气泡 */
  userBubble: 'rgba(37,99,235,0.15)',
  /** V2：模态遮罩 */
  mask: 'rgba(0,0,0,0.65)',
} as const;

/** 字体族（expo-font 注册名）；按字重显式指定 family，不依赖 fontWeight 映射 */
export const FONT = {
  regular: 'Inter-Regular',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extrabold: 'Inter-ExtraBold',
  mono: 'JetBrainsMono-Regular',
  monoBold: 'JetBrainsMono-Bold',
} as const;

/** 布局常量（spec §2.3 / §4） */
export const LAYOUT = {
  mainBarHeight: 64,
  cameraBarHeight: 64,
  screenPaddingH: 20,
  cardRadius: 12,
  /** V2：状态栏 */
  statusBarHeight: 52,
  /** V2：底部输入栏 */
  inputBarHeight: 72,
  /** V2：Tab 栏 */
  tabBarHeight: 56,
  /** V2：底部 Safe 区 */
  bottomSafeArea: 34,
} as const;
