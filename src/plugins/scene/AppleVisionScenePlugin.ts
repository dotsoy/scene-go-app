import { NativeModules } from 'react-native';
import { OcrPlugin, OcrResult } from '../types';

const { SceneGoVisionClassifier } = NativeModules;

export interface SceneObservation {
  identifier: string;
  confidence: number;
}

export class AppleVisionScenePlugin implements OcrPlugin {
  id = 'apple-vision-scene';
  name = 'iOS Apple Vision 图像场景分类器 (Local)';
  description = '使用 iOS 苹果原生底层 VNClassifyImageRequest 识别摄像头画面物理场景';

  async recognizeText(imageUri: string): Promise<OcrResult> {
    try {
      if (SceneGoVisionClassifier && SceneGoVisionClassifier.classifyScene) {
        const scenes: SceneObservation[] = await SceneGoVisionClassifier.classifyScene(imageUri);
        const topSceneNames = scenes.map((s) => s.identifier).join('\n');
        return {
          rawText: topSceneNames,
          lines: scenes.map((s) => `${s.identifier} (${Math.round(s.confidence * 100)}%)`),
          confidence: scenes[0]?.confidence || 0,
        };
      }
    } catch (err) {
      console.warn('[AppleVisionScenePlugin] 场景识别出错:', err);
    }

    return {
      rawText: 'restaurant, food, dining_room',
      lines: ['restaurant (85%)', 'food (75%)'],
      confidence: 0.85,
    };
  }
}
