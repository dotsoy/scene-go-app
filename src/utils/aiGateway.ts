/**
 * AI 网关：统一的 OpenAI-compatible chat completions 调用入口。
 *
 * 当前直连 OpenRouter；运营代理（Supabase Edge Function）就绪后，
 * 仅需修改 AI_GATEWAY_URL（或设置 EXPO_PUBLIC_AI_GATEWAY_URL 环境变量），
 * 客户端其余逻辑（请求体构造、日志、超时重试、错误处理）不变。
 * 鉴权头在代理模式下改为传递用户 token，详见 aiGateway 鉴权说明。
 */
import { getOpenRouterApiKey } from './SecureConfig';
import { apiLogger } from './ApiLogger';

/** 网关地址：默认 OpenRouter 直连，可用 EXPO_PUBLIC_AI_GATEWAY_URL 覆盖 */
const DEFAULT_GATEWAY_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const AI_GATEWAY_URL = process.env.EXPO_PUBLIC_AI_GATEWAY_URL || DEFAULT_GATEWAY_URL;

/** 默认模型（代理模式可由服务端覆盖，无需改动客户端） */
export const DEFAULT_MODEL = 'openrouter/free';

/** 请求超时（毫秒）：弱网下避免 fetch 无限挂起 */
const FETCH_TIMEOUT_MS = 30_000;
/** 网络异常最大尝试次数（含首次） */
const MAX_ATTEMPTS = 2;

export interface AiChatMessage {
  role: string;
  /** string（纯文本）或 OpenRouter 的 image_url 数组（多模态） */
  content: unknown;
}

export interface AiChatRequest {
  messages: AiChatMessage[];
  maxTokens?: number;
  /** ApiLogger 请求标签（脱敏描述，不落完整请求体） */
  logLabel?: string;
}

export interface AiChatResult {
  ok: boolean;
  status: number;
  text: string;
  /** choices[0].message.content，解析失败为 null */
  content: string | null;
}

/** 带超时的 POST 请求 + 网络异常自动重试（HTTP 非 2xx 不重试） */
async function postWithTimeoutRetry(
  url: string,
  headers: Record<string, string>,
  body: string,
  logId: string,
): Promise<{ ok: boolean; status: number; text: string }> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let resp: Response;
      try {
        resp = await fetch(url, {
          method: 'POST',
          headers,
          body,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      const text = await resp.text();
      apiLogger.logResponse(logId, resp.status, Date.now() - start, text);
      return { ok: resp.ok, status: resp.status, text };
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_ATTEMPTS) {
        console.warn(`[AiGateway] 网络异常(${msg})，第 ${attempt + 1} 次重试`);
      }
    }
  }
  const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
  apiLogger.logResponse(logId, 0, 0, `网络异常: ${errMsg}`);
  return { ok: false, status: 0, text: `[网络异常: ${errMsg}]` };
}

/**
 * 统一 chat completions 调用。
 * 未配置 API Key 时返回 status 401 + NO_API_KEY（调用方据此提示配置）。
 */
export async function chatCompletions(req: AiChatRequest): Promise<AiChatResult> {
  const apiKey = await getOpenRouterApiKey();
  if (!apiKey) {
    return { ok: false, status: 401, text: 'NO_API_KEY', content: null };
  }

  const url = AI_GATEWAY_URL;
  const model = DEFAULT_MODEL;
  const body = JSON.stringify({
    model,
    messages: req.messages,
    ...(req.maxTokens ? { max_tokens: req.maxTokens } : {}),
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://scenego.app',
    'X-OpenRouter-Title': 'SceneGo',
  };

  const logId = apiLogger.logRequest({
    url,
    model,
    requestBody: req.logLabel ?? body,
  });

  const { ok, status, text } = await postWithTimeoutRetry(url, headers, body, logId);

  let content: string | null = null;
  if (ok) {
    try {
      const data = JSON.parse(text);
      content = data?.choices?.[0]?.message?.content ?? null;
    } catch {
      content = null;
    }
  }
  return { ok, status, text, content };
}
