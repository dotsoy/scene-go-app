import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NoteItem {
  id: string;
  content: string;
  category: string;
  timestamp: string;
}

const STORAGE_KEY = 'scenego_notes_v1';
const MAX_NOTES = 100;

class NoteStoreService {
  /** 写队列：读-改-写原子化，杜绝并发 save 相互覆盖 */
  private writeQueue: Promise<void> = Promise.resolve();

  private enqueueWrite<T>(op: () => Promise<T>): Promise<T> {
    const run = this.writeQueue.then(op);
    this.writeQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async getAll(): Promise<NoteItem[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.warn('[NoteStore] read failed:', e);
      return [];
    }
  }

  /** 新笔记置于头部，超出上限淘汰最旧 */
  save(note: NoteItem): Promise<void> {
    return this.enqueueWrite(async () => {
      try {
        const list = await this.getAll();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([note, ...list].slice(0, MAX_NOTES)));
      } catch (e) {
        console.warn('[NoteStore] save failed:', e);
      }
    });
  }

  remove(id: string): Promise<void> {
    return this.enqueueWrite(async () => {
      try {
        const list = await this.getAll();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list.filter((n) => n.id !== id)));
      } catch (e) {
        console.warn('[NoteStore] remove failed:', e);
      }
    });
  }
}

export const noteStore = new NoteStoreService();
