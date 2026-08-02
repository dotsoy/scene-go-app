import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScenarioResult, ChatTurn } from '../plugins';

export interface SavedSession {
  id: string;
  imageUri: string | null;
  scenarioResult: ScenarioResult | null;
  turns: ChatTurn[];
  title: string;
  /** 展示用时间戳 YYYY-MM-DD HH:MM */
  timestamp: string;
}

const STORAGE_KEY = 'scenego_sessions_v1';
const MAX_SESSIONS = 20;

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

class SessionStoreService {
  async getAll(): Promise<SavedSession[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.warn('[SessionStore] read failed:', e);
      return [];
    }
  }

  /** 按 id 覆盖写入，新会话置于列表头部，超出上限淘汰最旧 */
  async save(session: SavedSession): Promise<void> {
    try {
      const list = await this.getAll();
      const idx = list.findIndex((s) => s.id === session.id);
      if (idx >= 0) {
        list[idx] = session;
      } else {
        list.unshift(session);
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_SESSIONS)));
    } catch (e) {
      console.warn('[SessionStore] save failed:', e);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const list = await this.getAll();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list.filter((s) => s.id !== id)));
    } catch (e) {
      console.warn('[SessionStore] remove failed:', e);
    }
  }

  /** 由会话数据构建存储对象 */
  build(
    id: string,
    imageUri: string | null,
    scenarioResult: ScenarioResult | null,
    turns: ChatTurn[],
  ): SavedSession {
    return {
      id,
      imageUri,
      scenarioResult,
      turns,
      title: scenarioResult?.title || '快照对话',
      timestamp: formatTimestamp(Date.now()),
    };
  }
}

export const sessionStore = new SessionStoreService();
