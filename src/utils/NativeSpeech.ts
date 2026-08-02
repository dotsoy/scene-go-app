import { EventEmitter, requireOptionalNativeModule } from 'expo-modules-core';

interface SpeechNativeModule {
  startListening(locale: string): Promise<boolean>;
  stopListening(): Promise<boolean>;
}

const speechModule = requireOptionalNativeModule<SpeechNativeModule>('SceneGoSpeechRecognizer');
// EventEmitter 构造要求 NativeModule 类型（带私有字段，无法结构匹配），这里 cast any
const speechEmitter = speechModule ? new EventEmitter(speechModule as any) : null;

export interface SpeechResultEvent {
  transcript: string;
  isFinal: boolean;
}

export interface SpeechErrorEvent {
  message: string;
}

export const NativeSpeech = {
  onSpeechResult(callback: (e: SpeechResultEvent) => void) {
    if (speechEmitter) {
      return speechEmitter.addListener('onSpeechResult', callback);
    }
    return { remove: () => {} };
  },

  onSpeechError(callback: (e: SpeechErrorEvent) => void) {
    if (speechEmitter) {
      return speechEmitter.addListener('onSpeechError', callback);
    }
    return { remove: () => {} };
  },

  async start(locale: string = 'zh-CN'): Promise<boolean> {
    if (speechModule?.startListening) {
      try {
        await speechModule.startListening(locale);
        return true;
      } catch (err) {
        console.warn('[NativeSpeech] Start error:', err);
      }
    }
    return false;
  },

  async stop(): Promise<boolean> {
    if (speechModule?.stopListening) {
      try {
        await speechModule.stopListening();
        return true;
      } catch (err) {
        console.warn('[NativeSpeech] Stop error:', err);
      }
    }
    return false;
  },
};
