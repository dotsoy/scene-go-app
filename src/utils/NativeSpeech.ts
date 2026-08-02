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
