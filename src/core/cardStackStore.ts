/**
 * 表达卡栈：与 UI 无关的状态管理（zustand vanilla）。
 * 动态生成卡在前，Tap&Talk 兜底卡恒在末尾；index 指向当前展示卡。
 */
import { createStore } from 'zustand/vanilla';
import { CardData } from './types';

/** Tap&Talk 兜底卡：始终存在于卡栈末尾，动态卡缺失时的默认表达入口 */
export const TAP_TALK_CARD: CardData = {
  id: 'tap-talk',
  categoryTag: '通用 / 双向语音',
  locationName: '当前位置',
  title: 'Tap & Talk 通用表达',
  targetText: '按住麦克风说话，说出需求即可生成当地语言表达卡',
  phonetic: '',
  subText: '或拍摄眼前场景，一键生成表达卡递给当地人',
  localTip: '说清诉求（如：我要打车 / 我对花生过敏），卡片会按当地语言生成。',
  languageCode: 'zh-CN',
};

export interface CardStackState {
  cards: CardData[];
  index: number;
  /** 卡面是否可见（底部 CARD 按钮显隐） */
  visible: boolean;
  add: (card: CardData) => void;
  remove: (id: string) => void;
  next: () => void;
  prev: () => void;
  setVisible: (visible: boolean) => void;
}

export const cardStackStore = createStore<CardStackState>()((set) => ({
  cards: [TAP_TALK_CARD],
  index: 0,
  visible: true,
  /** 新表达卡入栈：去重后置顶展示，并确保卡面可见 */
  add: (card) =>
    set((s) => ({
      cards: [card, ...s.cards.filter((c) => c.id !== card.id)],
      index: 0,
      visible: true,
    })),
  remove: (id) =>
    set((s) => {
      const cards = s.cards.filter((c) => c.id !== id);
      return { cards, index: Math.min(s.index, Math.max(0, cards.length - 1)) };
    }),
  next: () => set((s) => ({ index: (s.index + 1) % Math.max(1, s.cards.length) })),
  prev: () => set((s) => ({ index: (s.index - 1 + s.cards.length) % s.cards.length })),
  setVisible: (visible) => set({ visible }),
}));
