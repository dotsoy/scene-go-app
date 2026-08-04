/**
 * 表达引擎：场景识别与表达卡生成的业务核心（与 UI 无关）。
 * 输入（图片/文本/追问）→ 解读或表达卡；所有 AI/本地匹配经由 plugins 层。
 */
import { pluginManager } from '../plugins/PluginManager';
import { parseVlmScenarioResult } from '../plugins/ocr/CloudVlmOcrPlugin';
import { ChatTurn, ScenarioResult } from '../plugins/types';
import { getLocationContext } from '../utils/locationContext';
import { compressImage } from '../utils/imageCompress';
import { scenarioToCard } from '../utils/cardBuilder';
import { sopEngine } from './sopEngine';
import { pipelineTraceStore } from './pipelineTrace';
import { CardData } from './types';

export interface ProcessImageResult {
  scenario: ScenarioResult;
  card: CardData;
  /** 云端识别错误标记（如未配置 Key / 鉴权失败 / 网络异常），命中时由 UI 提示用户，本地词库结果仍返回 */
  ocrIssue?: string;
}

export interface AskFollowUpResult {
  text: string;
  /** 追问中表达沟通需求时 VLM 返回表达卡，命中则附带卡片数据 */
  card?: CardData;
}

export const expressionEngine = {
  /**
   * 拍照管线：压缩 → OCR/匹配 → 解读 + 表达卡。
   * （照片捕获本身属设备/UI 层，调用方传入 uri；位置上下文内部获取）
   */
  async processImage(photoUri: string, location?: string): Promise<ProcessImageResult> {
    const uri = await compressImage(photoUri);
    const locationCtx = location ?? (await getLocationContext()) ?? undefined;
    const result = await pluginManager.processImageSnapshot(uri, locationCtx);
    return {
      scenario: result.scenario,
      card: scenarioToCard(result.scenario, locationCtx ?? '当前位置'),
      // CloudVlmOcrPlugin 约定：错误行以 [ 开头（如「[未配置 API Key…]」）；此时场景来自本地词库兜底
      ocrIssue: result.ocr.lines.find((l) => l.startsWith('[')),
    };
  },

  /** 文本驱动的动态表达卡：一句话需求（语音转写/手打）→ 表达卡；lang 为用户侧文案语言 */
  async generateCard(text: string, location?: string, lang?: string): Promise<CardData | null> {
    // 离线 SOP 优先：打车/药店确定性模板（无 Key 也能成卡）
    const local = sopEngine.matchLocalSop(text, {
      location: location ?? undefined,
      lang: (lang as 'zh-CN' | 'en-US') ?? undefined,
    });
    if (local) {
      console.log(
        `[Card trace] 离线SOP → card=${local.id} category=${local.categoryTag} steps=${local.steps?.length ?? 0} title=${local.title}`,
      );
      pipelineTraceStore.getState().pushTrace({
        at: Date.now(),
        input: text,
        path: 'sop',
        category: local.categoryTag,
        targetText: local.targetText,
        steps: local.steps?.length ?? 0,
      });
      return local;
    }

    const result = await pluginManager.generateCardFromText(text, location);
    if (!result) {
      pipelineTraceStore.getState().pushTrace({
        at: Date.now(),
        input: text,
        path: 'none',
        category: '未命中',
        targetText: '',
        steps: 0,
      });
      return null;
    }
    const card = scenarioToCard(result, location ?? '当前位置');
    console.log(
      `[Card trace] 云端VLM → card=${card.id} category=${card.categoryTag} title=${card.title} menu=${result.menu ? `signature=${result.menu.signature.length}/dishes=${result.menu.dishes.length}` : '无'}`,
    );
    pipelineTraceStore.getState().pushTrace({
      at: Date.now(),
      input: text,
      path: 'vlm',
      category: card.categoryTag,
      targetText: card.targetText,
      steps: 0,
      menu: result.menu ? `signature=${result.menu.signature.length}/dishes=${result.menu.dishes.length}` : undefined,
    });
    return card;
  },

  /**
   * 多轮追问：携带会话历史，回答追加到对话流；
   * 用户表达沟通需求时自动生成表达卡（解析 VLM 卡片 JSON，命中 targetText 即成卡）。
   */
  async askFollowUp(
    imageUri: string,
    question: string,
    history: ChatTurn[],
  ): Promise<AskFollowUpResult> {
    const reply = await pluginManager.getCloudVlmPlugin().askFollowUp(imageUri, question, history);
    const parsed = parseVlmScenarioResult(reply);
    if (parsed && parsed.targetText) {
      const locationCtx = await getLocationContext();
      return {
        text: `${reply}\n\n✅ 已为你生成表达卡「${parsed.title || '场景表达'}」，关闭对话即可查看。`,
        card: scenarioToCard(parsed, locationCtx ?? '当前位置'),
      };
    }
    return { text: reply };
  },
};
