import * as FileSystem from 'expo-file-system';
import { pluginManager, QwenLocalPlugin, WhisperSpeechPlugin } from '../plugins';

export interface ModelStatus {
  qwenInstalled: boolean;
  qwenProgress: number; // 0 ~ 100
  whisperInstalled: boolean;
  whisperProgress: number; // 0 ~ 100
  isDownloading: boolean;
}

const QWEN_MODEL_URL =
  'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';
const WHISPER_MODEL_URL =
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin';

const QWEN_FILE_NAME = 'qwen2.5-0.5b-instruct-q4_k_m.gguf';
const WHISPER_FILE_NAME = 'ggml-tiny.bin';

class ModelManager {
  private docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';

  public getQwenPath(): string {
    return `${this.docDir}${QWEN_FILE_NAME}`;
  }

  public getWhisperPath(): string {
    return `${this.docDir}${WHISPER_FILE_NAME}`;
  }

  // 检查端侧模型安装状态
  async checkModelStatus(): Promise<ModelStatus> {
    const qwenPath = this.getQwenPath();
    const whisperPath = this.getWhisperPath();

    const qwenInfo = await FileSystem.getInfoAsync(qwenPath);
    const whisperInfo = await FileSystem.getInfoAsync(whisperPath);

    return {
      qwenInstalled: qwenInfo.exists,
      qwenProgress: qwenInfo.exists ? 100 : 0,
      whisperInstalled: whisperInfo.exists,
      whisperProgress: whisperInfo.exists ? 100 : 0,
      isDownloading: false,
    };
  }

  // 初始化并加载已有模型到插件管理器
  async initializeExistingModels(): Promise<boolean> {
    const status = await this.checkModelStatus();
    let anyLoaded = false;

    if (status.qwenInstalled) {
      try {
        const qwenPlugin = new QwenLocalPlugin(this.getQwenPath());
        pluginManager.registerMatcher(qwenPlugin);
        pluginManager.setActiveMatcher(qwenPlugin.id);
        anyLoaded = true;
      } catch (err) {
        console.warn('[ModelManager] Qwen load failed:', err);
      }
    }

    if (status.whisperInstalled) {
      try {
        const whisperPlugin = new WhisperSpeechPlugin();
        await whisperPlugin.initModel(this.getWhisperPath());
        console.log('[ModelManager] Whisper registered:', whisperPlugin.id);
        anyLoaded = true;
      } catch (err) {
        console.warn('[ModelManager] Whisper load failed:', err);
      }
    }

    return anyLoaded;
  }

  // 下载 Qwen 本地大模型
  async downloadQwenModel(
    onProgress?: (progress: number) => void,
  ): Promise<boolean> {
    const targetPath = this.getQwenPath();
    const downloadResumable = FileSystem.createDownloadResumable(
      QWEN_MODEL_URL,
      targetPath,
      {},
      (downloadProgress) => {
        const progress =
          (downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite) *
          100;
        if (onProgress) onProgress(Math.round(progress));
      },
    );

    try {
      const result = await downloadResumable.downloadAsync();
      if (result?.uri) {
        await this.initializeExistingModels();
        return true;
      }
    } catch (e) {
      console.warn('[ModelManager] Qwen download failed:', e);
    }
    return false;
  }

  // 下载 Whisper 本地语音模型
  async downloadWhisperModel(
    onProgress?: (progress: number) => void,
  ): Promise<boolean> {
    const targetPath = this.getWhisperPath();
    const downloadResumable = FileSystem.createDownloadResumable(
      WHISPER_MODEL_URL,
      targetPath,
      {},
      (downloadProgress) => {
        const progress =
          (downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite) *
          100;
        if (onProgress) onProgress(Math.round(progress));
      },
    );

    try {
      const result = await downloadResumable.downloadAsync();
      if (result?.uri) {
        await this.initializeExistingModels();
        return true;
      }
    } catch (e) {
      console.warn('[ModelManager] Whisper download failed:', e);
    }
    return false;
  }
}

export const modelManager = new ModelManager();
