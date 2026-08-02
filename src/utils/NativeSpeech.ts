import { NativeModules, NativeEventEmitter } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

interface SpeechNativeModule {
  startListening(locale: string): Promise<boolean>;
  stopListening(): Promise<boolean>;
}

const speechModule = requireOptionalNativeModule<SpeechNativeModule>('SceneGoSpeechRecognizer');

// 旧架构 (Paper) 下事件经 RCT 事件桥 (EXReactNativeEventEmitter) 送达 JS；
// Swift 侧 sendEvent 走 JSI 路径在旧架构不可用，事件名保持与原生一致
const rnEventEmitter = NativeModules.EXReactNativeEventEmitter
  ? new NativeEventEmitter(NativeModules.EXReactNativeEventEmitter)
  : null;

export interface SpeechResultEvent {
  transcript: string;
  isFinal: boolean;
}

export interface SpeechErrorEvent {
  message: string;
}

export interface SpeechStartResult {
  ok: boolean;
  error?: string;
}

export const NativeSpeech = {
  onSpeechResult(callback: (e: SpeechResultEvent) => void) {
    if (rnEventEmitter) {
      return rnEventEmitter.addListener('onSpeechResult', callback);
    }
    return { remove: () => {} };
  },

  onSpeechError(callback: (e: SpeechErrorEvent) => void) {
    if (rnEventEmitter) {
      return rnEventEmitter.addListener('onSpeechError', callback);
    }
    return { remove: () => {} };
  },

  async start(locale: string = 'zh-CN'): Promise<SpeechStartResult> {
    if (speechModule?.startListening) {
      try {
        await speechModule.startListening(locale);
        return { ok: true };
      } catch (err) {
        // 透传原生 reject 的具体原因（auth_denied / audio_session_error / engine_error 等）
        const msg =
          typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: string }).message)
            : String(err);
        console.warn('[NativeSpeech] Start error:', msg);
        return { ok: false, error: msg };
      }
    }
    return { ok: false, error: '语音模块不可用' };
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
