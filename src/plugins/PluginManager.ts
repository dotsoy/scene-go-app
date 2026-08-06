import { OcrPlugin, MatcherPlugin, OcrResult, ScenarioResult } from './types';
import { CloudVlmOcrPlugin, parseVlmScenarioResult } from './ocr/CloudVlmOcrPlugin';
import { LocalDictMatcherPlugin } from './matchers/LocalDictMatcherPlugin';

class PluginManager {
  private ocrPlugins: Map<string, OcrPlugin> = new Map();
  private matcherPlugins: Map<string, MatcherPlugin> = new Map();

  private activeOcrId: string = 'cloud-vlm';
  private activeMatcherId: string = 'local-dict';

  private cloudVlmPlugin = new CloudVlmOcrPlugin();

  constructor() {
    this.registerOcr(this.cloudVlmPlugin);
    this.registerMatcher(new LocalDictMatcherPlugin());
  }

  registerOcr(plugin: OcrPlugin) {
    this.ocrPlugins.set(plugin.id, plugin);
  }

  registerMatcher(plugin: MatcherPlugin) {
    this.matcherPlugins.set(plugin.id, plugin);
  }

  setActiveOcr(id: string) {
    if (this.ocrPlugins.has(id)) {
      this.activeOcrId = id;
    } else {
      console.warn(`[PluginManager] OCR Plugin ${id} not found.`);
    }
  }

  setActiveMatcher(id: string) {
    if (this.matcherPlugins.has(id)) {
      this.activeMatcherId = id;
    } else {
      console.warn(`[PluginManager] Matcher Plugin ${id} not found.`);
    }
  }

  getActiveOcrId(): string {
    return this.activeOcrId;
  }

  getActiveMatcherId(): string {
    return this.activeMatcherId;
  }

  getOcrPlugins(): OcrPlugin[] {
    return Array.from(this.ocrPlugins.values());
  }

  getMatcherPlugins(): MatcherPlugin[] {
    return Array.from(this.matcherPlugins.values());
  }

  /** 获取云端 VLM 插件实例（用于多轮追问） */
  getCloudVlmPlugin(): CloudVlmOcrPlugin {
    return this.cloudVlmPlugin;
  }

  /** 文本驱动的动态表达卡：语音意图/手打需求 → 当地语言表达卡（无图路径） */
  async generateCardFromText(text: string, location?: string): Promise<ScenarioResult | null> {
    return this.cloudVlmPlugin.generateCardFromText(text, location);
  }

  /** 聆听对方（mic ambient）：对方当地语言发言 → 合并回复卡（外语回复 + 母语译文） */
  async generateReplyCard(text: string, location?: string): Promise<ScenarioResult | null> {
    return this.cloudVlmPlugin.generateReplyCard(text, location);
  }

  /**
   * 核心管线：拍摄 → 识别 → 语义匹配
   *
   * 当使用云端 VLM 时，VLM 直接输出结构化 ScenarioResult（无需 Matcher 二次处理）
   * 当使用本地引擎时，走 OCR → Matcher 两阶段管线
   */
  async processImageSnapshot(
    imageUri: string,
    location?: string,
  ): Promise<{ ocr: OcrResult; scenario: ScenarioResult }> {
    const ocrPlugin =
      this.ocrPlugins.get(this.activeOcrId) ||
      this.cloudVlmPlugin;

    const ocrResult = await ocrPlugin.recognizeText(imageUri, location);

    // 云端 VLM 模式：直接从返回文本解析 ScenarioResult
    if (this.activeOcrId === 'cloud-vlm' && ocrResult.rawText) {
      const parsed = parseVlmScenarioResult(ocrResult.rawText);
      if (parsed) {
        return { ocr: ocrResult, scenario: parsed };
      }
      // 解析失败，降级到本地 Matcher
    }

    // 本地模式：OCR 文本 → 本地词库匹配
    const matcherPlugin =
      this.matcherPlugins.get(this.activeMatcherId) ||
      this.matcherPlugins.get('local-dict')!;
    const scenarioResult = await matcherPlugin.match(ocrResult.rawText, location);

    return { ocr: ocrResult, scenario: scenarioResult };
  }
}

export const pluginManager = new PluginManager();
