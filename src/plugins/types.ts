export interface OcrResult {
  rawText: string;
  lines: string[];
  confidence?: number;
}

export interface ScenarioResult {
  title: string;
  category: string;
  originalText: string;
  translatedText: string;
  tips: string[];
  recommendedPhrases: string[];
}

export interface OcrPlugin {
  id: string;
  name: string;
  description: string;
  recognizeText(imageUri: string): Promise<OcrResult>;
}

export interface MatcherPlugin {
  id: string;
  name: string;
  description: string;
  match(text: string, location?: string): Promise<ScenarioResult>;
}

export interface SpeechPlugin {
  id: string;
  name: string;
  description: string;
  transcribe(audioFilePath: string): Promise<string>;
}
