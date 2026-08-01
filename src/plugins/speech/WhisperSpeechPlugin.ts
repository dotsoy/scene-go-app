import { initWhisper, WhisperContext } from 'whisper.rn';
import { SpeechPlugin } from '../types';

export class WhisperSpeechPlugin implements SpeechPlugin {
  id = 'whisper-tiny';
  name = 'Whisper-Tiny 本地离线语音识别';
  description = '基于 Whisper-Tiny (75MB GGML) 的零延迟本地离线 ASR 插件';

  private context: WhisperContext | null = null;

  async initModel(modelPath: string): Promise<boolean> {
    try {
      this.context = await initWhisper({
        filePath: modelPath,
      });
      console.log('[WhisperSpeechPlugin] 本地 Whisper-Tiny 语音模型初始化成功');
      return true;
    } catch (err) {
      console.warn('[WhisperSpeechPlugin] 语音模型初始化失败:', err);
      return false;
    }
  }

  async transcribe(audioFilePath: string): Promise<string> {
    if (this.context) {
      try {
        const { promise } = this.context.transcribe(audioFilePath, {
          language: 'auto',
          maxLen: 1,
        });
        const result = await promise;
        return result.result;
      } catch (err) {
        console.warn('[WhisperSpeechPlugin] 语音转写失败:', err);
      }
    }

    return '未开启本地语音识别模型';
  }
}
