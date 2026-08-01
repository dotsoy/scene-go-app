import { OcrPlugin, MatcherPlugin, OcrResult, ScenarioResult } from './types';
import { AppleVisionOcrPlugin } from './ocr/AppleVisionOcrPlugin';
import { LocalDictMatcherPlugin } from './matchers/LocalDictMatcherPlugin';

class PluginManager {
  private ocrPlugins: Map<string, OcrPlugin> = new Map();
  private matcherPlugins: Map<string, MatcherPlugin> = new Map();

  private activeOcrId: string = 'apple-vision';
  private activeMatcherId: string = 'local-dict';

  constructor() {
    // 默认注册离线原生插件
    this.registerOcr(new AppleVisionOcrPlugin());
    this.registerMatcher(new LocalDictMatcherPlugin());
  }

  // 注册 OCR 插件
  registerOcr(plugin: OcrPlugin) {
    this.ocrPlugins.set(plugin.id, plugin);
  }

  // 注册 Matcher 插件
  registerMatcher(plugin: MatcherPlugin) {
    this.matcherPlugins.set(plugin.id, plugin);
  }

  // 切换活动 OCR 插件
  setActiveOcr(id: string) {
    if (this.ocrPlugins.has(id)) {
      this.activeOcrId = id;
    } else {
      console.warn(`[PluginManager] OCR Plugin ${id} not found.`);
    }
  }

  // 切换活动 Matcher 插件
  setActiveMatcher(id: string) {
    if (this.matcherPlugins.has(id)) {
      this.activeMatcherId = id;
    } else {
      console.warn(`[PluginManager] Matcher Plugin ${id} not found.`);
    }
  }

  // 获取插件列表
  getOcrPlugins(): OcrPlugin[] {
    return Array.from(this.ocrPlugins.values());
  }

  getMatcherPlugins(): MatcherPlugin[] {
    return Array.from(this.matcherPlugins.values());
  }

  // 执行管线处理：拍摄 ➔ OCR ➔ 语义/卡片匹配
  async processImageSnapshot(imageUri: string, location?: string): Promise<{ ocr: OcrResult; scenario: ScenarioResult }> {
    const ocrPlugin = this.ocrPlugins.get(this.activeOcrId) || this.ocrPlugins.get('apple-vision')!;
    const matcherPlugin = this.matcherPlugins.get(this.activeMatcherId) || this.matcherPlugins.get('local-dict')!;

    const ocrResult = await ocrPlugin.recognizeText(imageUri);
    const scenarioResult = await matcherPlugin.match(ocrResult.rawText, location);

    return {
      ocr: ocrResult,
      scenario: scenarioResult,
    };
  }
}

export const pluginManager = new PluginManager();
