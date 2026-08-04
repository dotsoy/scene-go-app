/**
 * 快照会话：与 UI 无关的对话流状态与持久化（zustand vanilla）。
 * V2 消息模型 ChatMessage[]（user/assistant/card/system）；追问 API 需要 ChatTurn[]，转换函数兼容。
 * 会话 = 一张快照图 + 场景解读 + 对话流；每次变更持久化到 SessionStore。
 */
import { createStore } from 'zustand/vanilla';
import { ScenarioResult, ChatTurn } from '../plugins/types';
import { sessionStore, SavedSession } from '../utils/SessionStore';
import { CardData, ChatMessage } from './types';

/** ChatMessage[] → ChatTurn[]（云端追问 API 用；跳过 card/system 消息） */
export function messagesToTurns(messages: ChatMessage[]): ChatTurn[] {
  return messages
    .filter((m): m is ChatMessage & { kind: 'user' | 'assistant' } =>
      m.kind === 'user' || m.kind === 'assistant',
    )
    .map((m) => ({ role: m.kind, content: m.content ?? '' }));
}

/** SavedSession.turns（ChatTurn[]）→ ChatMessage[]（恢复历史；首条 assistant 解读带快照图） */
export function turnsToMessages(turns: ChatTurn[], imageUri: string | null): ChatMessage[] {
  return turns.map((t, i) => ({
    id: `m-${i}-${Date.now()}`,
    kind: t.role,
    content: t.content,
    imageUri: i === 0 && t.role === 'assistant' ? (imageUri ?? undefined) : undefined,
    createdAt: Date.now(),
  }));
}

export interface ChatSessionState {
  sessionId: string | null;
  imageUri: string | null;
  scenario: ScenarioResult | null;
  messages: ChatMessage[];
  /** 新会话：重建 id、写入首条解读（含快照图）并持久化，返回新 id */
  start: (imageUri: string | null, scenario: ScenarioResult | null) => string;
  /**
   * 追加一轮追问：user 消息 + 结果。
   * card 存在时以「表达卡消息 + 系统提示」呈现（assistant 文本忽略）；否则 assistant 文本回复。
   */
  appendFollowUp: (user: string, assistant: string, card?: CardData) => void;
  /** 追加表达卡消息（拍照/语音成卡，与卡栈同源） */
  appendCard: (card: CardData) => void;
  /** 追加系统提示消息 */
  appendSystem: (text: string) => void;
  /** 从历史会话恢复（重进追问） */
  restore: (session: SavedSession) => void;
  reset: () => void;
}

export const chatSessionStore = createStore<ChatSessionState>()((set, get) => ({
  sessionId: null,
  imageUri: null,
  scenario: null,
  messages: [],
  start: (imageUri, scenario) => {
    const id = Date.now().toString();
    const messages: ChatMessage[] = scenario
      ? [
          {
            id: `m0-${id}`,
            kind: 'assistant',
            content: scenario.translatedText,
            imageUri: imageUri ?? undefined,
            ...(scenario.menu ? { menu: scenario.menu } : {}),
            createdAt: Date.now(),
          },
        ]
      : [];
    set({ sessionId: id, imageUri, scenario, messages });
    sessionStore.save(sessionStore.build(id, imageUri, scenario, messagesToTurns(messages)));
    return id;
  },
  appendFollowUp: (user, assistant, card) => {
    const s = get();
    if (!s.sessionId) return;
    const now = Date.now();
    const messages: ChatMessage[] = [
      ...s.messages,
      { id: `u-${now}`, kind: 'user', content: user, createdAt: now },
      ...(card
        ? [
            { id: `c-${now}`, kind: 'card' as const, card, createdAt: now },
            {
              id: `s-${now}`,
              kind: 'system' as const,
              content: `✅ 已生成表达卡「${card.title}」，点卡可全屏展示`,
              createdAt: now,
            },
          ]
        : [{ id: `a-${now}`, kind: 'assistant' as const, content: assistant, createdAt: now }]),
    ];
    set({ messages });
    sessionStore.save(
      sessionStore.build(s.sessionId, s.imageUri, s.scenario, messagesToTurns(messages)),
    );
  },
  appendCard: (card) => {
    const s = get();
    const messages: ChatMessage[] = [
      ...s.messages,
      { id: `c-${Date.now()}`, kind: 'card', card, createdAt: Date.now() },
    ];
    set({ messages });
    if (s.sessionId) {
      sessionStore.save(
        sessionStore.build(s.sessionId, s.imageUri, s.scenario, messagesToTurns(messages)),
      );
    }
  },
  appendSystem: (text) => {
    const s = get();
    const messages: ChatMessage[] = [
      ...s.messages,
      { id: `s-${Date.now()}`, kind: 'system', content: text, createdAt: Date.now() },
    ];
    set({ messages });
    if (s.sessionId) {
      sessionStore.save(
        sessionStore.build(s.sessionId, s.imageUri, s.scenario, messagesToTurns(messages)),
      );
    }
  },
  restore: (session) => {
    set({
      sessionId: session.id,
      imageUri: session.imageUri,
      scenario: session.scenarioResult,
      messages: turnsToMessages(session.turns, session.imageUri),
    });
  },
  reset: () => set({ sessionId: null, imageUri: null, scenario: null, messages: [] }),
}));
