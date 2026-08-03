import { OcrPlugin, OcrResult, ScenarioResult, ChatTurn } from '../types';
import { getOpenRouterApiKey } from '../../utils/SecureConfig';
import { chatCompletions, AiChatMessage } from '../../utils/aiGateway';
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

/** 构造场景识别消息（图片 + 位置提示） */
function buildSceneMessages(base64: string, location?: string) {
  const userText = location
    ? `请分析这张照片中的场景，给出出行解读。\n（用户当前所在位置：${location}，可结合位置判断场景地点与当地语言）`
    : '请分析这张照片中的场景，给出出行解读。';
  return {
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
    maxTokens: 1024,
  };
}

/** 构造多轮追问消息：首轮带图，后续轮携带纯文本历史问答 */
function buildFollowUpMessages(base64: string, question: string, history: ChatTurn[] = []) {
  const messages: AiChatMessage[] = [
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

  return { messages, maxTokens: 512 };
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

    const startTime = Date.now();

    try {
      const base64 = await convertImageToBase64(imageUri);
      const req = buildSceneMessages(base64, location);

      const result = await chatCompletions({
        messages: req.messages,
        maxTokens: req.maxTokens,
        logLabel: '[Scene OCR]',
      });

      const durationMs = Date.now() - startTime;
      console.log(`[CloudVlm] 响应 (${result.status}, ${durationMs}ms)`);
      if (result.content) console.log(result.content.slice(0, 200));

      if (!result.ok) {
        console.warn('[CloudVlm API Error]:', result.status, result.text);
        if (result.status === 401) {
          return {
            rawText: result.text,
            lines: [`[API Key 鉴权失败 (${result.status})，请在设置中确认你的 Key 是否有效]`],
            confidence: 0,
          };
        }
        if (result.status === 0) {
          return {
            rawText: result.text,
            lines: [`[网络异常，请检查网络连接]`],
            confidence: 0,
          };
        }
        return {
          rawText: result.text,
          lines: [`[云端识别失败: HTTP ${result.status}]`],
          confidence: 0,
        };
      }

      return { rawText: result.content ?? '', lines: [result.content ?? ''], confidence: 1.0 };
    } catch (err: unknown) {
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

    try {
      const base64 = await convertImageToBase64(imageUri);
      const req = buildFollowUpMessages(base64, question, history);

      const result = await chatCompletions({
        messages: req.messages,
        maxTokens: req.maxTokens,
        logLabel: `[Follow-Up]: ${question}\n[History]: ${history.length} turns`,
      });

      if (!result.ok) return `响应错误 (${result.status}): ${result.text}`;
      return result.content ?? result.text;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '请检查网络连接';
      return `网络错误: ${errMsg}`;
    }
  }

  /** 文本驱动的动态表达卡：用户一句话描述需求（语音转写/手打）→ VLM 生成当地语言表达卡 */
  async generateCardFromText(text: string, location?: string): Promise<ScenarioResult | null> {
    const apiKey = await getOpenRouterApiKey();
    if (!apiKey) return null;

    try {
      const userContent = location
        ? `${text}\n\n（用户当前所在位置：${location}，生成卡片请使用当地语言）`
        : text;

      const result = await chatCompletions({
        messages: [
          { role: 'system', content: CARD_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        maxTokens: 512,
        logLabel: `[Card From Text]: ${text}`,
      });

      if (!result.ok || result.status === 0) return null;
      return parseVlmScenarioResult(result.content ?? '');
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
