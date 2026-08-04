/**
 * 语音流程编排：听写启动/停止 + 转录意图处理（生成表达卡 + 归档笔记）。
 * 实时转录显示（liveTranscript）属视图层，由 UI 订阅原生事件自行展示。
 */
import { Platform } from 'react-native';
import { NativeSpeech } from '../utils/NativeSpeech';
import { getLocationContext } from '../utils/locationContext';
import { loadUserProfile } from '../utils/userProfile';
import { noteStore, NoteItem } from '../utils/NoteStore';
import { expressionEngine } from './expressionEngine';
import { cardStackStore } from './cardStackStore';
import { chatSessionStore } from './chatSession';
import { CardData } from './types';

export interface SpeechStartResult {
  ok: boolean;
  error?: string;
}

export interface TranscriptResult {
  /** 最终转录文本 */
  text: string;
  /** 是否成功生成表达卡并入栈 */
  cardCreated: boolean;
  card?: CardData;
  /** 是否归档到笔记（含笔记对象，供 UI 刷新） */
  note?: NoteItem;
}

/** 时间戳构造（MM-DD HH:MM，与 UI 显示一致） */
function timeStamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export const speechController = {
  /** Android 无原生听写模块（降级由 UI 提示） */
  isSupported(): boolean {
    return Platform.OS !== 'android';
  },

  unsupportedReason(): string {
    return '当前设备为 Android：实时语音转写模块仅支持 iOS。\n请用 CAM 拍照识别场景，或使用下方文字表达（Tap&Talk）。';
  },

  /** 开始听写；locale 为 BCP-47 识别语言（默认中文，听对方说话时传对方语言） */
  async start(locale: string = 'zh-CN'): Promise<SpeechStartResult> {
    return NativeSpeech.start(locale);
  },

  /** 停止转录并返回最终文本（await 期间到达的 final 事件不会丢失） */
  async stop(): Promise<string> {
    await NativeSpeech.stop();
    return '';
  },

  /**
   * 转录意图处理：语音文本 → 动态表达卡入栈 + 归档笔记。
   * 返回结果由 UI 决定展示（卡栈已由本模块更新）。
   */
  async handleTranscript(transcript: string): Promise<TranscriptResult> {
    const locationCtx = await getLocationContext();
    const profile = await loadUserProfile();
    const card = await expressionEngine.generateCard(
      transcript,
      locationCtx ?? undefined,
      profile?.language ?? 'zh-CN',
    );
    const note: NoteItem = {
      id: Date.now().toString(),
      content: transcript,
      category: 'VOICE',
      timestamp: timeStamp(),
    };
    await noteStore.save(note);
    if (card) {
      cardStackStore.getState().add(card);
      // 语音表达卡同步进入对话流（V2 视觉稿 §5 流程 3：语音 → 表达卡消息入流）
      chatSessionStore.getState().appendCard(card);
      return { text: transcript, cardCreated: true, card, note };
    }
    // 成卡失败也要让用户在对话页看到结果，避免「录完毫无反应」
    chatSessionStore.getState().appendSystem('未识别到明确表达需求，请说得更具体（如：我要打车 / 我对花生过敏）。');
    return { text: transcript, cardCreated: false, note };
  },
};
