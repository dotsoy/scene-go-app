import TextRecognition from 'react-native-text-recognition';
import { OcrPlugin, OcrResult } from '../types';

export class AppleVisionOcrPlugin implements OcrPlugin {
  id = 'apple-vision';
  name = 'iOS Apple Vision OCR (Local)';
  description = '使用 iOS 原生 Apple Vision 框架进行零开销离线文字识别';

  async recognizeText(imageUri: string): Promise<OcrResult> {
    try {
      const result: string[] = await TextRecognition.recognize(imageUri);
      return {
        rawText: result.join('\n'),
        lines: result,
        confidence: 1.0,
      };
    } catch (err) {
      console.warn('[AppleVisionOcrPlugin] 识别失败:', err);
      return {
        rawText: '',
        lines: [],
        confidence: 0,
      };
    }
  }
}
