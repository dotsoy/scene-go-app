/**
 * 语音流程编排：听写启动/停止（仅 iOS 原生 SFSpeechRecognizer 模块）。
 * 实时转录显示（liveTranscript）属视图层，由 UI 订阅原生事件自行展示。
 */
import { NativeSpeech } from '../utils/NativeSpeech';

export interface SpeechStartResult {
  ok: boolean;
  error?: string;
}

export const speechController = {
  /** 开始听写；locale 为 BCP-47 识别语言（自己说话用 zh-CN，聆听对方用目标语言） */
  async start(locale: string = 'zh-CN'): Promise<SpeechStartResult> {
    return NativeSpeech.start(locale);
  },

  /** 停止转录（await 期间到达的 final 事件不会丢失） */
  async stop(): Promise<void> {
    await NativeSpeech.stop();
  },
};
