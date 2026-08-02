export interface ApiLogEntry {
  id: string;
  timestamp: string;
  type: 'REQUEST' | 'RESPONSE' | 'ERROR';
  url: string;
  model: string;
  status?: number;
  durationMs?: number;
  requestBody?: string;
  responseBody?: string;
}

/** 日志存储截断上限：防止完整 Base64 图片/超长响应撑爆内存 */
const MAX_BODY_LENGTH = 4000;

function truncateForStorage(text: string, maxLength: number = MAX_BODY_LENGTH): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + `\n... [日志已截断，共 ${text.length} 字符]`;
}

class ApiLoggerService {
  /** Map 索引：logRequest 返回 id 后 O(1) 定位更新，不受并发/条目淘汰影响 */
  private logs = new Map<string, ApiLogEntry>();
  private listeners: Set<() => void> = new Set();

  logRequest(entry: { url: string; model: string; requestBody: string }): string {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newLog: ApiLogEntry = {
      id,
      timestamp,
      type: 'REQUEST',
      url: entry.url,
      model: entry.model,
      requestBody: truncateForStorage(entry.requestBody),
    };

    this.logs.set(id, newLog);
    // 淘汰最旧条目，保持最多 50 条
    if (this.logs.size > 50) {
      const oldestKey = this.logs.keys().next().value;
      if (oldestKey) this.logs.delete(oldestKey);
    }
    this.notify();
    return id;
  }

  logResponse(id: string, status: number, durationMs: number, responseBody: string) {
    const log = this.logs.get(id);
    if (log) {
      log.type = status >= 200 && status < 300 ? 'RESPONSE' : 'ERROR';
      log.status = status;
      log.durationMs = durationMs;
      log.responseBody = truncateForStorage(responseBody, 6000);
      this.notify();
    }
  }

  logError(id: string, errorMsg: string) {
    const log = this.logs.get(id);
    if (log) {
      log.type = 'ERROR';
      log.status = 0;
      log.responseBody = truncateForStorage(errorMsg);
      this.notify();
    }
  }

  /** 返回最新在前的时间倒序列表（UI 契约不变） */
  getLogs(): ApiLogEntry[] {
    return Array.from(this.logs.values()).reverse();
  }

  clear() {
    this.logs.clear();
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const apiLogger = new ApiLoggerService();
