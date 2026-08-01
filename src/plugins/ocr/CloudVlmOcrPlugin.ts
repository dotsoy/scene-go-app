import { OcrPlugin, OcrResult, ScenarioResult } from '../types';
import { getOpenRouterApiKey } from '../../utils/SecureConfig';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_ID = 'openrouter/free';

const SCENE_SYSTEM_PROMPT = `你是 SceneGo 出行智能助手。用户正在异国旅行，会通过手机摄像头拍摄眼前的场景（菜单、路牌、车站、商店、景点、告示牌等）。
你的任务是分析这张照片，给出对旅行者最有价值的即时解读。

你必须严格以如下 JSON 格式回复（不要输出任何其他内容）：
{
  "title": "场景的简短中文标题（如：泰式海鲜餐厅菜单）",
  "category": "场景分类（RESTAURANT / AIRPORT / HOTEL / TRANSPORT / SHOPPING / ATTRACTION / SIGN / OTHER）",
  "translatedText": "对照片内容的详细中文解读与翻译（包含价格、关键细节等）",
  "tips": ["出行避坑提示1", "避坑提示2", "避坑提示3"],
  "recommendedPhrases": ["当地语言实用短语1 (中文翻译)", "短语2 (中文翻译)"]
}`;

/** 安全转换图片为 Base64 字符串（具备 FileSystem 原生模块 + Fetch Blob 双层降级） */
async function convertImageToBase64(imageUri: string): Promise<string> {
  try {
    const FileSystem = require('expo-file-system');
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

export class CloudVlmOcrPlugin implements OcrPlugin {
  id = 'cloud-vlm';
  name = '云端视觉大模型 (OpenRouter Free)';
  description = '通过 OpenRouter 免费视觉模型深度解析摄像头场景';

  async recognizeText(imageUri: string): Promise<OcrResult> {
    const apiKey = await getOpenRouterApiKey();
    if (!apiKey) {
      return {
        rawText: '',
        lines: ['[未配置 OpenRouter API Key，请在设置中填入]'],
        confidence: 0,
      };
    }

    try {
      const base64 = await convertImageToBase64(imageUri);

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://scenego.app',
          'X-Title': 'SceneGo',
        },
        body: JSON.stringify({
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
                  text: '请分析这张照片中的场景，给出出行解读。',
                },
              ],
            },
          ],
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn('[CloudVlm] API Error:', response.status, errText);
        return {
          rawText: '',
          lines: [`[云端识别失败: HTTP ${response.status}]`],
          confidence: 0,
        };
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      return { rawText: content, lines: [content], confidence: 1.0 };
    } catch (err) {
      console.warn('[CloudVlm] Network error:', err instanceof Error ? err.message : String(err));
      return {
        rawText: '',
        lines: ['[网络异常，已自动降级到本地识别]'],
        confidence: 0,
      };
    }
  }

  /** 多轮追问：用户基于当前照片提出具体问题 */
  async askFollowUp(imageUri: string, question: string): Promise<string> {
    const apiKey = await getOpenRouterApiKey();
    if (!apiKey) return '请先配置 OpenRouter API Key';

    try {
      const base64 = await convertImageToBase64(imageUri);

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://scenego.app',
          'X-Title': 'SceneGo',
        },
        body: JSON.stringify({
          model: MODEL_ID,
          messages: [
            {
              role: 'system',
              content:
                '你是 SceneGo 出行助手。用户正在异国旅行中，基于拍摄的照片向你追问具体细节。请用中文简洁回答。',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${base64}` },
                },
                { type: 'text', text: question },
              ],
            },
          ],
          max_tokens: 512,
        }),
      });

      if (!response.ok) return `云端响应错误 (${response.status})`;

      const data = await response.json();
      return data?.choices?.[0]?.message?.content || '未获取到回答';
    } catch (err) {
      return `网络错误: ${err instanceof Error ? err.message : '请检查网络连接'}`;
    }
  }
}

/** 尝试从云端 VLM 原始返回文本中解析出 ScenarioResult JSON */
export function parseVlmScenarioResult(rawText: string): ScenarioResult | null {
  try {
    let jsonStr = rawText;
    const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1];

    const obj = JSON.parse(jsonStr.trim());
    if (obj.title && obj.category) {
      return {
        title: obj.title,
        category: obj.category,
        originalText: rawText,
        translatedText: obj.translatedText || '',
        tips: Array.isArray(obj.tips) ? obj.tips : [],
        recommendedPhrases: Array.isArray(obj.recommendedPhrases)
          ? obj.recommendedPhrases
          : [],
      };
    }
  } catch {
    // JSON 解析失败，返回 null 走降级
  }
  return null;
}
