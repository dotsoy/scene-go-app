import { File, Paths } from 'expo-file-system';
import { pluginManager, QwenLocalPlugin, WhisperSpeechPlugin } from '../plugins';

export interface ModelStatus {
  qwenInstalled: boolean;
  qwenProgress: number; // 0 ~ 100
  whisperInstalled: boolean;
  whisperProgress: number; // 0 ~ 100
  isDownloading: boolean;
}

const QWEN_MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';
const WHISPER_MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin';

const QWEN_FILE_NAME = 'qwen2.5-0.5b-instruct-q4_k_m.gguf';
const WHISPER_FILE_NAME = 'ggml-tiny.bin';

class ModelManager {
  private docDir = Paths.document.uri || Paths.cache.uri || '';

  public getQwenPath(): string {
    return `${this.docDir}/${QWEN_FILE_NAME}`;
  }

  public getWhisperPath(): string {
    return `${this.docDir}/${WHISPER_FILE_NAME}`;
  }

  // 检查端侧模型安装状态
  async checkModelStatus(): Promise<ModelStatus> {
    const qwenFile = new File(this.getQwenPath());
    const whisperFile = new File(this.getWhisperPath());

    return {
      qwenInstalled: qwenFile.exists,
      qwenProgress: qwenFile.exists ? 100 : 0,
      whisperInstalled: whisperFile.exists,
      whisperProgress: whisperFile.exists ? 100 : 0,
      isDownloading: false,
    };
  }

  // 初始化并加载已有模型到插件管理器
  async initializeExistingModels(): Promise<boolean> {
    let qwenReady = false;
    let whisperReady = false;

    const qwenPath = this.getQwenPath();
    const qwenFile = new File(qwenPath);
    if (qwenFile.exists) {
      const qwenPlugin = new QwenLocalPlugin();
      qwenReady = await qwenPlugin.initModel(qwenPath);
      if (qwenReady) {
        pluginManager.registerMatcher(qwenPlugin);
        pluginManager.setActiveMatcher('qwen-0.5b');
      }
    }

    const whisperPath = this.getWhisperPath();
    const whisperFile = new File(whisperPath);
    if (whisperFile.exists) {
      const whisperPlugin = new WhisperSpeechPlugin();
      whisperReady = await whisperPlugin.initModel(whisperPath);
    }

    return qwenReady || whisperReady;
  }

  // 下载 Qwen 本地大模型
  async downloadQwenModel(onProgress?: (progress: number) => void): Promise<boolean> {
    try {
      const targetFile = new File(this.getQwenPath());
      const downloadedFile = await File.downloadFileAsync(QWEN_MODEL_URL, targetFile);
      if (downloadedFile && downloadedFile.exists) {
        console.log('[ModelManager] Qwen2.5 模型下载完成:', downloadedFile.uri);
        const qwenPlugin = new QwenLocalPlugin();
        const ok = await qwenPlugin.initModel(downloadedFile.uri);
        if (ok) {
          pluginManager.registerMatcher(qwenPlugin);
          pluginManager.setActiveMatcher('qwen-0.5b');
        }
        return true;
      }
    } catch (err) {
      console.warn('[ModelManager] Qwen 模型下载失败:', err);
    }
    return false;
  }

  // 下载 Whisper 本地语音模型
  async downloadWhisperModel(onProgress?: (progress: number) => void): Promise<boolean> {
    try {
      const targetFile = new File(this.getWhisperPath());
      const downloadedFile = await File.downloadFileAsync(WHISPER_MODEL_URL, targetFile);
      if (downloadedFile && downloadedFile.exists) {
        console.log('[ModelManager] Whisper 模型下载完成:', downloadedFile.uri);
        const whisperPlugin = new WhisperSpeechPlugin();
        await whisperPlugin.initModel(downloadedFile.uri);
        return true;
      }
    } catch (err) {
      console.warn('[ModelManager] Whisper 模型下载失败:', err);
    }
    return false;
  }
}

export const modelManager = new ModelManager();
