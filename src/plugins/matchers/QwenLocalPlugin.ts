import { initLlama, LlamaContext } from 'llama.rn';
import { MatcherPlugin, ScenarioResult } from '../types';
import { LocalDictMatcherPlugin } from './LocalDictMatcherPlugin';

export class QwenLocalPlugin implements MatcherPlugin {
  id = 'qwen-0.5b';
  name = 'Qwen2.5-0.5B 本地小语言模型';
  description = '基于 Qwen2.5-0.5B-Instruct-Q4_K_M (350MB GGUF)，提供本地端侧智能解毒与翻译';

  private context: LlamaContext | null = null;
  private fallbackMatcher = new LocalDictMatcherPlugin();
  private modelPath: string = '';

  constructor(modelPath?: string) {
    if (modelPath) {
      this.modelPath = modelPath;
    }
  }

  // 初始化模型上下文 (开启 iOS Metal GPU 加速)
  async initModel(path: string): Promise<boolean> {
    try {
      this.modelPath = path;
      this.context = await initLlama({
        model: path,
        n_ctx: 2048,
        n_gpu_layers: 99, // 开启 Metal GPU 硬件加速
      });
      console.log('[QwenLocalPlugin] 本地 Qwen2.5-0.5B 模型初始化成功');
      return true;
    } catch (err) {
      console.warn('[QwenLocalPlugin] 初始化本地模型失败，将自动降级至词库插件:', err);
      return false;
    }
  }

  async match(text: string, location?: string): Promise<ScenarioResult> {
    // 如果模型已就绪，进行端侧 LLM 推理
    if (this.context) {
      try {
        const prompt = `<|im_start|>system\n你是一名专业的异国出行翻译与避坑助手。请根据用户在异国场景识别到的文本进行分析解读。请直接输出JSON结果。格式: {"title": "标题", "category": "分类", "translatedText": "中文翻译/解释", "tips": ["提示1", "提示2"], "phrases": ["实用短语1"]}<|im_end|>\n<|im_start|>user\n请解读以下识别到的文本:\n${text}<|im_end|>\n<|im_start|>assistant\n`;

        const res = await this.context.completion({
          prompt,
          n_predict: 300,
          stop: ['<|im_end|>'],
        });

        const outputText = res.text.trim();
        // 尝试解析 JSON 输出
        const jsonMatch = outputText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            title: parsed.title || '本地 AI 解读',
            category: parsed.category || 'SCENE',
            originalText: text,
            translatedText: parsed.translatedText || outputText,
            tips: parsed.tips || ['本地 Qwen2.5 模型深度解读结果'],
            recommendedPhrases: parsed.phrases || [],
          };
        }

        return {
          title: 'Qwen 智能解读',
          category: 'AI_REASONING',
          originalText: text,
          translatedText: outputText,
          tips: ['来自 Qwen2.5-0.5B 本地离线推理'],
          recommendedPhrases: [],
        };
      } catch (err) {
        console.warn('[QwenLocalPlugin] 推理出错，切至降级词库:', err);
      }
    }

    // 默认兜底使用离线词库插件
    return this.fallbackMatcher.match(text, location);
  }
}
