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

class ApiLoggerService {
  private logs: ApiLogEntry[] = [];
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
      requestBody: entry.requestBody,
    };

    this.logs = [newLog, ...this.logs.slice(0, 49)];
    this.notify();
    return id;
  }

  logResponse(id: string, status: number, durationMs: number, responseBody: string) {
    const log = this.logs.find((l) => l.id === id);
    if (log) {
      log.type = status >= 200 && status < 300 ? 'RESPONSE' : 'ERROR';
      log.status = status;
      log.durationMs = durationMs;
      log.responseBody = responseBody;
      this.notify();
    }
  }

  logError(id: string, errorMsg: string) {
    const log = this.logs.find((l) => l.id === id);
    if (log) {
      log.type = 'ERROR';
      log.status = 0;
      log.responseBody = errorMsg;
      this.notify();
    }
  }

  getLogs(): ApiLogEntry[] {
    return this.logs;
  }

  clear() {
    this.logs = [];
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
