/**
 * 快照会话：与 UI 无关的多轮对话状态与持久化（zustand vanilla）。
 * 会话 = 一张快照图 + 场景解读 + 追问历史；每次变更持久化到 SessionStore。
 */
import { createStore } from 'zustand/vanilla';
import { ChatTurn, ScenarioResult } from '../plugins/types';
import { sessionStore, SavedSession } from '../utils/SessionStore';

export interface ChatSessionState {
  sessionId: string | null;
  imageUri: string | null;
  scenario: ScenarioResult | null;
  turns: ChatTurn[];
  /** 新会话：重建 id、写入首条解读并持久化，返回新 id */
  start: (imageUri: string | null, scenario: ScenarioResult | null) => string;
  /** 追加一轮追问（user + assistant）并持久化 */
  append: (user: string, assistant: string) => void;
  /** 从历史会话恢复（重进追问） */
  restore: (session: SavedSession) => void;
  reset: () => void;
}

export const chatSessionStore = createStore<ChatSessionState>()((set, get) => ({
  sessionId: null,
  imageUri: null,
  scenario: null,
  turns: [],
  start: (imageUri, scenario) => {
    const id = Date.now().toString();
    const turns: ChatTurn[] = scenario
      ? [{ role: 'assistant', content: scenario.translatedText }]
      : [];
    set({ sessionId: id, imageUri, scenario, turns });
    sessionStore.save(sessionStore.build(id, imageUri, scenario, turns));
    return id;
  },
  append: (user, assistant) => {
    const s = get();
    if (!s.sessionId) return;
    const turns: ChatTurn[] = [
      ...s.turns,
      { role: 'user', content: user },
      { role: 'assistant', content: assistant },
    ];
    set({ turns });
    sessionStore.save(sessionStore.build(s.sessionId, s.imageUri, s.scenario, turns));
  },
  restore: (session) => {
    set({
      sessionId: session.id,
      imageUri: session.imageUri,
      scenario: session.scenarioResult,
      turns: session.turns,
    });
  },
  reset: () => set({ sessionId: null, imageUri: null, scenario: null, turns: [] }),
}));
