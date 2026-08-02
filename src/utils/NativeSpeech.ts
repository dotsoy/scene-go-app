import { NativeModules, NativeEventEmitter } from 'react-native';

const { SceneGoSpeechRecognizer } = NativeModules;

const speechEmitter = SceneGoSpeechRecognizer
  ? new NativeEventEmitter(SceneGoSpeechRecognizer)
  : null;

export interface SpeechResultEvent {
  transcript: string;
  isFinal: boolean;
}

export interface SpeechErrorEvent {
  message: string;
}

export const NativeSpeech = {
  isAvailable(): boolean {
    return !!SceneGoSpeechRecognizer;
  },

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
    if (SceneGoSpeechRecognizer?.startListening) {
      try {
        await SceneGoSpeechRecognizer.startListening(locale);
        return true;
      } catch (err) {
        console.warn('[NativeSpeech] Start error:', err);
      }
    }
    return false;
  },

  async stop(): Promise<boolean> {
    if (SceneGoSpeechRecognizer?.stopListening) {
      try {
        await SceneGoSpeechRecognizer.stopListening();
        return true;
      } catch (err) {
        console.warn('[NativeSpeech] Stop error:', err);
      }
    }
    return false;
  },
};
