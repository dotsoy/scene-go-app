import { OcrPlugin, OcrResult, ScenarioResult, ChatTurn } from '../types';
import { getOpenRouterApiKey } from '../../utils/SecureConfig';
import { apiLogger } from '../../utils/ApiLogger';
import * as FileSystem from 'expo-file-system';

const SCENE_SYSTEM_PROMPT = `你是 SceneGo 出行智能助手。用户正在异国旅行，会通过手机摄像头拍摄眼前的场景（菜单、路牌、车站、商店、景点、告示牌等）。
你的任务是分析这张照片，给出对旅行者最有价值的即时解读。

你必须严格以如下 JSON 格式回复（不要输出任何其他内容）：
{
  "title": "场景的简短中文标题（如：泰式海鲜餐厅菜单）",
  "category": "场景分类（RESTAURANT / AIRPORT / HOTEL / TRANSPORT / SHOPPING / ATTRACTION / SIGN / OTHER）",
  "translatedText": "对照片内容的详细中文解读与翻译（包含价格、关键细节等）",
  "tips": ["出行避坑提示1", "避坑提示2", "避坑提示3"],
  "recommendedPhrases": ["当地语言实用短语1 (中文翻译)", "短语2 (中文翻译)"],
  "targetText": "如果这个场景需要向当地人表达诉求（点餐、问路、砍价等），给出当地语言的核心表达句；纯展示类场景（路牌/菜单阅读）则省略",
  "phonetic": "targetText 的当地语言发音拉丁转写",
  "subText": "补充说明（当地语言或英文，如忌口细节）",
  "localTip": "中文当地惯例提示（小费/计费/注意事项）",
  "languageCode": "当地语言 BCP-47 代码（如 th-TH / ja-JP / en-US）"
}`;

const CARD_SYSTEM_PROMPT = `你是 SceneGo 出行助手。用户正在异国旅行，会用一句话描述当下的表达需求（可能来自语音转写）。
根据需求生成一张"递给当地人看"的高对比度表达卡，语言必须用当地语言（按需求语境推断语种，如泰语/日语/英语）。

你必须严格以如下 JSON 格式回复（不要输出任何其他内容）：
{
  "title": "卡片的中文标题（如：出租车按表计费）",
  "category": "场景分类（RESTAURANT / AIRPORT / HOTEL / TRANSPORT / SHOPPING / ATTRACTION / SIGN / OTHER）",
  "targetText": "当地语言大字表达（递给当地人看的核心句）",
  "phonetic": "当地语言发音的拉丁转写",
  "subText": "补充说明（当地语言或英文）",
  "localTip": "中文当地惯例提示（小费/计费/注意事项）",
  "languageCode": "当地语言 BCP-47 代码（如 th-TH / ja-JP / en-US）",
  "phrases": ["备用表达1（当地语言，括号内中文翻译）", "备用表达2（当地语言，括号内中文翻译）", "备用表达3（当地语言，括号内中文翻译）"]
}`;

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_ID = 'openrouter/free';

/** 请求超时（毫秒）：弱网下避免 fetch 无限挂起 */
const FETCH_TIMEOUT_MS = 30_000;
/** 网络异常最大尝试次数（含首次） */
const MAX_ATTEMPTS = 2;

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
        console.warn(`[CloudVlm] 网络异常(${msg})，第 ${attempt + 1} 次重试`);
      }
    }
  }
  const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
  apiLogger.logResponse(logId, 0, 0, `网络异常: ${errMsg}`);
  return { ok: false, status: 0, text: `[网络异常: ${errMsg}]` };
}

/** 安全转换图片为 Base64 字符串（具备 FileSystem 原生模块 + Fetch Blob 双层降级） */
async function convertImageToBase64(imageUri: string): Promise<string> {
  try {
    if (FileSystem?.readAsStringAsync) {
      return await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType?.Base64 || 'base64',
      });
    }
  } catch {
    // 忽略原生模块加载错误，自动走下方的 Fetch Blob 降级方案
  }

  // 纯 JS 降级方案：100% 兼容 Web / Expo Go / 未编译原生 Bundle
  const res = await fetch(imageUri);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** 构造场景识别请求体（日志与真实请求共用同一对象，避免两处重复维护） */
function buildSceneRequestBody(base64: string, location?: string) {
  const userText = location
    ? `请分析这张照片中的场景，给出出行解读。\n（用户当前所在位置：${location}，可结合位置判断场景地点与当地语言）`
    : '请分析这张照片中的场景，给出出行解读。';
  return {
    model: MODEL_ID,
    messages: [
      { role: 'system', content: SCENE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64}` },
          },
          {
            type: 'text',
            text: userText,
          },
        ],
      },
    ],
    max_tokens: 1024,
  };
}

/** 构造多轮追问请求体：首轮带图，后续轮携带纯文本历史问答 */
function buildFollowUpRequestBody(base64: string, question: string, history: ChatTurn[] = []) {
  const messages: Array<Record<string, unknown>> = [
    {
      role: 'system',
      content:
        '你是 SceneGo 出行助手。用户正在异国旅行中，基于拍摄的照片与你多轮对话，追问具体细节。请用中文简洁回答，并尽量承接上文语境。',
    },
  ];

  if (history.length === 0) {
    // 单轮：图 + 当前问题
    messages.push({
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        { type: 'text', text: question },
      ],
    });
  } else {
    // 多轮：图片挂到历史首问，后续轮次纯文本，保持同一会话语境
    messages.push({
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        { type: 'text', text: history[0].content },
      ],
    });
    for (const turn of history.slice(1)) {
      messages.push({ role: turn.role, content: turn.content });
    }
    messages.push({ role: 'user', content: question });
  }

  return {
    model: MODEL_ID,
    messages,
    max_tokens: 512,
  };
}

export class CloudVlmOcrPlugin implements OcrPlugin {
  id = 'cloud-vlm';
  name = '云端视觉识别';
  description = '通过 OpenRouter 识别摄像头画面场景';

  async recognizeText(imageUri: string, location?: string): Promise<OcrResult> {
    const apiKey = await getOpenRouterApiKey();
    if (!apiKey) {
      return {
        rawText: '',
        lines: ['[未配置 API Key，请在设置中填入]'],
        confidence: 0,
      };
    }

    const url = OPENROUTER_API_URL;
    const model = MODEL_ID;
    const startTime = Date.now();

    try {
      const base64 = await convertImageToBase64(imageUri);

      const reqHeaders: Record<string, string> = {
        Authorization: `Bearer ${apiKey.slice(0, 12)}•••••••• (OpenRouter Key)`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://scenego.app',
        'X-OpenRouter-Title': 'SceneGo',
      };

      const reqBodyObject = buildSceneRequestBody(base64, location);

      const fullRequestLog = JSON.stringify(
        {
          url,
          method: 'POST',
          headers: reqHeaders,
          body: reqBodyObject,
        },
        null,
        2,
      );

      console.log('=============== [CloudVlm 全量请求参数] ===============');
      console.log(fullRequestLog);
      console.log('=====================================================');

      const logId = apiLogger.logRequest({
        url,
        model,
        requestBody: fullRequestLog,
      });

      const actualHeaders: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://scenego.app',
        'X-OpenRouter-Title': 'SceneGo',
      };

      const { ok, status, text: respText } = await postWithTimeoutRetry(
        url,
        actualHeaders,
        JSON.stringify(reqBodyObject),
        logId,
      );

      const durationMs = Date.now() - startTime;

      console.log(`=============== [CloudVlm 响应 (${status})] ===============`);
      console.log(respText);
      console.log('=====================================================');

      if (!ok) {
        console.warn('[CloudVlm API Error]:', status, respText);
        if (status === 401) {
          return {
            rawText: respText,
            lines: [`[API Key 鉴权失败 (${status})，请在设置中确认你的 Key 是否有效]`],
            confidence: 0,
          };
        }
        return {
          rawText: respText,
          lines: [`[云端识别失败: HTTP ${status}]`],
          confidence: 0,
        };
      }

      const data = JSON.parse(respText);
      const content = data?.choices?.[0]?.message?.content || respText;
      return { rawText: content, lines: [content], confidence: 1.0 };
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('[CloudVlm Fetch Network Error]:', errMsg);
      return {
        rawText: '',
        lines: [`[网络异常: ${errMsg}]`],
        confidence: 0,
      };
    }
  }

  /** 多轮追问：用户基于当前照片提出具体问题（history 携带此前问答，首轮自动带图） */
  async askFollowUp(imageUri: string, question: string, history: ChatTurn[] = []): Promise<string> {
    const apiKey = await getOpenRouterApiKey();
    if (!apiKey) return '请先配置 API Key';

    const url = OPENROUTER_API_URL;
    const model = MODEL_ID;

    try {
      const base64 = await convertImageToBase64(imageUri);

      const actualHeaders: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://scenego.app',
        'X-OpenRouter-Title': 'SceneGo',
      };

      const logId = apiLogger.logRequest({
        url,
        model,
        requestBody: `[Follow-Up Question]: ${question}\n[History]: ${history.length} turns`,
      });

      const { ok, status, text: respText } = await postWithTimeoutRetry(
        url,
        actualHeaders,
        JSON.stringify(buildFollowUpRequestBody(base64, question, history)),
        logId,
      );

      if (!ok) return `响应错误 (${status}): ${respText}`;

      const data = JSON.parse(respText);
      return data?.choices?.[0]?.message?.content || respText;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '请检查网络连接';
      return `网络错误: ${errMsg}`;
    }
  }

  /** 文本驱动的动态表达卡：用户一句话描述需求（语音转写/手打）→ VLM 生成当地语言表达卡 */
  async generateCardFromText(text: string, location?: string): Promise<ScenarioResult | null> {
    const apiKey = await getOpenRouterApiKey();
    if (!apiKey) return null;

    const url = OPENROUTER_API_URL;
    const model = MODEL_ID;

    try {
      const actualHeaders: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://scenego.app',
        'X-OpenRouter-Title': 'SceneGo',
      };

      const userContent = location
        ? `${text}\n\n（用户当前所在位置：${location}，生成卡片请使用当地语言）`
        : text;

      const body = {
        model,
        messages: [
          { role: 'system', content: CARD_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        max_tokens: 512,
      };

      const logId = apiLogger.logRequest({
        url,
        model,
        requestBody: `[Card From Text]: ${text}`,
      });

      const { ok, status, text: respText } = await postWithTimeoutRetry(
        url,
        actualHeaders,
        JSON.stringify(body),
        logId,
      );

      if (!ok || status === 0) return null;
      const data = JSON.parse(respText);
      const content = data?.choices?.[0]?.message?.content || '';
      return parseVlmScenarioResult(content);
    } catch (err: unknown) {
      console.warn('[Card Generate Error]:', err);
      return null;
    }
  }
}

/** 尝试从云端 VLM 原始返回文本中解析出 ScenarioResult JSON */
export function parseVlmScenarioResult(rawText: string): ScenarioResult | null {
  if (!rawText || rawText.trim().length === 0) return null;

  try {
    let jsonStr = rawText;
    const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1];

    const obj = JSON.parse(jsonStr.trim());
    if (obj.title || obj.translatedText) {
      return {
        title: obj.title || '场景解读',
        category: obj.category || 'SCENE',
        originalText: rawText,
        translatedText: obj.translatedText || rawText,
        tips: Array.isArray(obj.tips) ? obj.tips : ['来自场景图像分析'],
        recommendedPhrases: Array.isArray(obj.recommendedPhrases)
          ? obj.recommendedPhrases
          : [],
        // 表达卡字段（动态卡路径）：模型可能省略，此处可选透传
        targetText: obj.targetText,
        phonetic: obj.phonetic,
        subText: obj.subText,
        localTip: obj.localTip,
        languageCode: obj.languageCode,
      };
    }
  } catch {
    // 非严格 JSON 文本，包裹为完整解读返回
  }

  return {
    title: '场景解读',
    category: 'SCENE',
    originalText: rawText,
    translatedText: rawText,
    tips: ['来自场景图像分析'],
    recommendedPhrases: ['Excuse me, could you explain this? (请问能解释一下这个吗？)'],
  };
}
