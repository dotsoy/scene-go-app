import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, ActivityIndicator, Animated, TouchableOpacity, Platform, Alert, KeyboardAvoidingView, Keyboard, Linking } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as Device from 'expo-device';

import { pluginManager, ScenarioResult } from './src/plugins';
import { CameraBackground } from './src/components/CameraBackground';
import { CameraPreviewBox } from './src/components/CameraPreviewBox';
import { FlashCardView, CardData } from './src/components/FlashCardView';
import { StepsCardView } from './src/components/StepsCardView';
import { ListenReplyView } from './src/components/ListenReplyView';
import { EmergencyConfirmModal } from './src/components/EmergencyConfirmModal';
import { SnapshotDialogModal } from './src/components/SnapshotDialogModal';
import { CountrySelectModal } from './src/components/CountrySelectModal';
import { CountrySwitchPromptModal } from './src/components/CountrySwitchPromptModal';
import { SafetyDetailModal } from './src/components/SafetyDetailModal';
import { PluginSelectorModal } from './src/components/PluginSelectorModal';
import { ApiLogModal } from './src/components/ApiLogModal';
import { SessionHistoryModal } from './src/components/SessionHistoryModal';
import { UtilityDrawerModal, ToolKind } from './src/components/UtilityDrawerModal';
import { ChatPage } from './src/components/ChatPage';
import { ChatInputBar } from './src/components/ChatInputBar';
import { ScenarioCapsuleBar } from './src/components/ScenarioCapsuleBar';
import { TabBar, TabKey } from './src/components/TabBar';
import { CardStackPage } from './src/components/CardStackPage';
import { NotesPage } from './src/components/NotesPage';
import { MorePage } from './src/components/MorePage';
import { ChatMessage, ReplyOption, MenuDish } from './src/core/types';
import { NativeSpeech } from './src/utils/NativeSpeech';
import { PlaceContext } from './src/utils/locationContext';
import { SavedCountry } from './src/utils/countryStore';
import { UserProfile } from './src/utils/userProfile';
import { getCountrySafety } from './src/data/countrySafety';
import { getAirportCapsules, detectAirportDest, buildCapsuleCard, buildOrderCard } from './src/data/scenarioSops';
import { getOpenRouterApiKey } from './src/utils/SecureConfig';
import { modelManager } from './src/utils/ModelManager';
import { initPack } from './src/packs/packManager';
import { useStore } from 'zustand';
import { cardStackStore, TAP_TALK_CARD } from './src/core/cardStackStore';
import { chatSessionStore, messagesToTurns } from './src/core/chatSession';
import { expressionEngine } from './src/core/expressionEngine';
import { speechController } from './src/core/speechController';
import { countryController } from './src/core/countryController';
import { sessionStore, SavedSession } from './src/utils/SessionStore';
import { noteStore, NoteItem } from './src/utils/NoteStore';
import { useFonts } from 'expo-font';
import { COLORS, FONT, LAYOUT } from './src/theme/tokens';

// Tap&Talk 兜底卡定义已移至 src/core/cardStackStore（TAP_TALK_CARD）

/** 暂时隐藏的 Tab：卡栈/笔记先聚焦对话与更多（隐藏入口可随时恢复） */
const HIDDEN_TABS: TabKey[] = ['stack', 'notes'];

/** 云端插件错误文本前缀（CloudVlmOcrPlugin 约定）：命中则视为错误回复而非正常解读 */
const CLOUD_ERROR_PREFIXES = ['请先配置 API Key', '响应错误', '网络错误', '请求失败'];

function isCloudErrorText(text: string): boolean {
  return CLOUD_ERROR_PREFIXES.some((p) => text.startsWith(p));
}

/** 云端错误 → 用户可操作的中文提示（错误细节只进 ApiLog，不暴露给对话流） */
function cloudErrorHint(text: string): string {
  if (text.startsWith('请先配置')) return 'AI 服务未配置：请在「更多 → 识别引擎设置」中填入 API Key 后重试。';
  if (text.startsWith('响应错误') && text.includes('401')) return 'AI 服务鉴权失败：请检查「识别引擎设置」中的 API Key 是否有效。';
  return 'AI 服务暂时不可用：请检查网络连接后重试。';
}

export default function App() {
  // 字体加载：未就绪前保持启动画面（注意：必须放在所有 hooks 之后提前返回，避免 hooks 数量跳变崩溃）
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
    'Inter-ExtraBold': require('./assets/fonts/Inter-ExtraBold.ttf'),
    'JetBrainsMono-Regular': require('./assets/fonts/JetBrainsMono-Regular.ttf'),
    'JetBrainsMono-Bold': require('./assets/fonts/JetBrainsMono-Bold.ttf'),
  });
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  // V2：底部四 Tab（默认对话）
  const [activeTab, setActiveTab] = useState<TabKey>('chat');
  // V2：点表达卡 → 全屏大字卡覆盖层
  const [fullscreenCard, setFullscreenCard] = useState<CardData | null>(null);
  // V2：听对方说话覆盖层（一卡全览/单步的 🎙️ 入口）
  const [listenCard, setListenCard] = useState<CardData | null>(null);
  const [listenTranslated, setListenTranslated] = useState<string | null>(null);
  const [listenTranslateFailed, setListenTranslateFailed] = useState<boolean>(false);
  const [listenElapsed, setListenElapsed] = useState<number>(0);
  const listenStartAtRef = useRef<number>(0);
  const isCardVisible = useStore(cardStackStore, (s) => s.visible);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false);

  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState<boolean>(false);
  const [pendingSnapshotUri, setPendingSnapshotUri] = useState<string | null>(null);
  const [activeScenarioResult, setActiveScenarioResult] = useState<ScenarioResult | null>(null);
  const [processingLabel, setProcessingLabel] = useState<string | null>(null);
  // 快照对话流（首条为场景解读，后续为追问问答）——状态由 chatSessionStore 管理（V2 ChatMessage[]）
  const chatMessages = useStore(chatSessionStore, (s) => s.messages);
  const sessionId = useStore(chatSessionStore, (s) => s.sessionId);
  const scenarioResult = useStore(chatSessionStore, (s) => s.scenario);

  // 表达卡栈（动态卡在前，Tap&Talk 兜底卡恒在末尾）——状态由 cardStackStore 管理
  const cards = useStore(cardStackStore, (s) => s.cards);
  const cardIndex = useStore(cardStackStore, (s) => s.index);
  // 当前国家/地区（缓存的用户选择）与 GPS 检测位置；用户档案（国籍+语言）
  const [currentCountry, setCurrentCountry] = useState<SavedCountry | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [detectedPlace, setDetectedPlace] = useState<PlaceContext | null>(null);
  const [isCountrySelectOpen, setIsCountrySelectOpen] = useState<boolean>(false);
  const [switchPrompt, setSwitchPrompt] = useState<{ detectedName: string } | null>(null);
  const [isSafetyDetailOpen, setIsSafetyDetailOpen] = useState<boolean>(false);
  // 紧急拨打二次确认：待确认的号码（null = 关闭）
  const [confirmDial, setConfirmDial] = useState<{ num: string; label: string } | null>(null);
  const cameraRef = useRef<unknown>(null);
  // REC 指示呼吸动画
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isMicActive) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => {
        loop.stop();
        pulseAnim.setValue(1);
      };
    }
  }, [isMicActive, pulseAnim]);
  // 最新转录文本的 ref 副本：避免 async 回调读取到过期的闭包 state
  const liveTranscriptRef = useRef<string>('');
  // 麦克风期望状态 ref：同步 isMicActive，防止授权异步窗口内重复触发
  const micActiveRef = useRef(false);
  // 恢复历史会话后，等待历史列表 dismiss 动画完成再 present 快照弹窗，避免 UIKit modal 队列冲突。
  // 统一用延时覆盖双端（iOS Modal.onDismiss 为 iOS 专属，Android 无此回调）
  // @types/node 环境下全局 setTimeout 返回 NodeJS.Timeout
  const restoreTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    return () => {
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
    };
  }, []);

  // 启动时探测本地模型：已下载的 Qwen/Whisper 自动注册并激活，无文件则静默跳过（不影响云端主链路）
  // 同时初始化场景包：应用缓存内容（离线可用），后台尝试远程下发（未配置时保持内嵌默认包）
  useEffect(() => {
    initPack().catch((err) => console.warn('[ScenePack] 初始化失败:', err));
    modelManager.initializeExistingModels().then((loaded) => {
      if (loaded) {
        console.log('[Models] 本地模型已加载:', pluginManager.getActiveMatcherId());
      }
    });
  }, []);

  // 绑定原生 iOS SFSpeechRecognizer 听写监听
  useEffect(() => {
    const subResult = NativeSpeech.onSpeechResult((e) => {
      if (e.transcript) {
        liveTranscriptRef.current = e.transcript;
        setLiveTranscript(e.transcript);
      }
    });
    const subError = NativeSpeech.onSpeechError((e) => {
      setLiveTranscript(`语音识别异常: ${e.message}`);
      liveTranscriptRef.current = '';
      // 原生侧已停止，回滚录音状态，避免 UI 显示 ON 而实际未录音
      micActiveRef.current = false;
      setIsMicActive(false);
    });
    return () => {
      subResult.remove();
      subError.remove();
    };
  }, []);

  /** 云端 VLM 多轮追问（业务在 expressionEngine + chatSessionStore）：回答追加对话流；表达需求自动成卡 */
  const sendSnapshotAndPromptToAI = async (imageUri: string, userPrompt: string) => {
    setProcessingLabel('正在回答...');
    try {
      const result = await expressionEngine.askFollowUp(
        imageUri,
        userPrompt,
        messagesToTurns(chatSessionStore.getState().messages),
      );
      // 云端错误文本（请先配置 / 响应错误 / 网络错误）不进入对话流，转为可操作的系统提示
      if (isCloudErrorText(result.text)) {
        chatSessionStore.getState().appendSystem(cloudErrorHint(result.text));
        return;
      }
      chatSessionStore.getState().appendFollowUp(userPrompt, result.text, result.card);
      if (result.card) {
        cardStackStore.getState().add({
          ...result.card,
          sessionId: chatSessionStore.getState().sessionId ?? undefined,
        });
      }
    } catch (err) {
      console.warn('[AI Follow-up Error]:', err);
      chatSessionStore.getState().appendSystem('追问失败：网络异常或服务不可用，请稍后重试。');
    } finally {
      setProcessingLabel(null);
    }
  };

  /** 恢复历史会话（业务状态由 chatSessionStore 回填）：先关历史列表，等 dismiss 动画完成再打开快照弹窗 */
  const restoreSession = (s: SavedSession) => {
    chatSessionStore.getState().restore(s);
    setActiveScenarioResult(s.scenarioResult);
    setPendingSnapshotUri(s.imageUri);
    setIsHistoryOpen(false);
    if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
    restoreTimerRef.current = setTimeout(() => setIsSnapshotModalOpen(true), 320);
  };

  const handleToolSelect = (kind: ToolKind) => {
    setIsToolsOpen(false);
    if (kind === 'logs') setIsLogsOpen(true);
    else if (kind === 'history') handleOpenHistory();
    else setIsSettingsOpen(true);
  };

  /** 打开会话记录列表 */
  const handleOpenHistory = async () => {
    setSessions(await sessionStore.getAll());
    setIsHistoryOpen(true);
  };

  /** 删除历史会话 */
  const handleDeleteSession = async (id: string) => {
    await sessionStore.remove(id);
    setSessions(await sessionStore.getAll());
  };

  /** CAM 拍照：拍照（设备层）→ expressionEngine 识别 → 新会话 + 表达卡入栈（防抖：处理中忽略重复点按） */
  const captureInFlightRef = useRef(false);
  const handleCaptureFrame = async () => {
    if (!isCameraActive || captureInFlightRef.current) return;
    captureInFlightRef.current = true;
    setProcessingLabel('正在提取信息并生成卡片...');
    try {
      const cam = cameraRef.current as { takePictureAsync?: (opts: { quality: number }) => Promise<{ uri: string }> } | null;
      let photoUri: string | null = null;

      if (cam?.takePictureAsync && isCameraReady) {
        try {
          const photo = await cam.takePictureAsync({ quality: 0.8 });
          photoUri = photo?.uri || null;
        } catch (camErr) {
          console.warn('[Camera] 拍照失败:', camErr);
        }
      }

      // 无真实画面：仅模拟器走测试图降级；真机拍照失败必须明确提示，绝不静默顶替用户照片
      if (!photoUri) {
        if (__DEV__ && !Device.isDevice) {
          console.log('[Camera] 模拟器环境，生成测试快照数据');
          photoUri = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'; // 预设曼谷美食/场景测试图
        } else {
          Alert.alert(
            '拍照失败',
            '未能获取相机画面。若相机权限被拒绝，请前往系统设置允许 SceneGo 使用相机后重试。',
          );
          return;
        }
      }

      setIsCameraActive(false);
      setIsCameraReady(false);

      // 识别管线（压缩/OCR/匹配/成卡）在 expressionEngine
      console.log('[Plugins] 启动插件管线，处理图像快照...');
      const { scenario, card, ocrIssue } = await expressionEngine.processImage(photoUri);
      console.log('[Plugin 场景匹配结果]:', scenario.title);
      // 云端识别不可用（未配置 Key / 鉴权失败 / 网络异常）时，明确告知用户已用本地词库兜底，避免误以为是精准识别
      if (ocrIssue) {
        Alert.alert('云端识别暂不可用', `${ocrIssue}\n\n已使用本地词库匹配兜底，可在「更多 → 识别引擎设置」中配置 API Key 后重试。`);
      }

      setActiveScenarioResult(scenario);
      setPendingSnapshotUri(photoUri);
      // 新会话：首条消息为场景解读并持久化；表达卡入栈（带会话 id，卡面可进追问）
      const newSessionId = chatSessionStore.getState().start(photoUri, scenario);
      cardStackStore.getState().add({ ...card, sessionId: newSessionId });
    } catch (err) {
      console.warn('Camera snapshot error:', err);
      setIsCameraActive(false);
      setIsCameraReady(false);
      Alert.alert('识别失败', '未能完成场景识别，请检查网络连接或 API Key 设置后重试。');
    } finally {
      captureInFlightRef.current = false;
      setProcessingLabel(null);
    }
  };

  /** 卡面「AI 解读」入口：仅最新快照会话可进（状态已在内存） */
  const handleOpenSnapshotFromCard = () => {
    if (!currentCard.sessionId || currentCard.sessionId !== sessionId) return;
    setIsSnapshotModalOpen(true);
  };

  const handleSnapshotSubmit = async (userPrompt: string, imageUri: string) => {
    await sendSnapshotAndPromptToAI(imageUri, userPrompt);
  };

  /** 启动麦克风（MIC OFF 态点按）——听写能力在 speechController */
  const handleStartMic = async () => {
    // Android 无原生听写模块：明确降级提示，避免启动失败的黑盒体验
    if (!speechController.isSupported()) {
      micActiveRef.current = false;
      Alert.alert('语音转写暂不可用', speechController.unsupportedReason());
      return;
    }
    // 期望状态先行，杜绝授权异步窗口内的重复触发
    micActiveRef.current = true;
    liveTranscriptRef.current = '';
    setIsMicActive(true);
    setLiveTranscript('正在开启原生听写，请说话...');
    const started = await speechController.start();
    if (!started.ok) {
      // 启动失败：若用户已快速关回（micActiveRef 已 false）则静默，否则回滚并展示真实原因
      if (micActiveRef.current) {
        micActiveRef.current = false;
        setIsMicActive(false);
        setLiveTranscript(`语音识别启动失败: ${started.error}`);
      }
    }
  };

  /** 停止麦克风，返回最终转录文本（await 期间到达的 final 事件不会丢失） */
  const stopMic = async (): Promise<string> => {
    micActiveRef.current = false;
    setIsMicActive(false);
    await speechController.stop();
    const finalTranscript = liveTranscriptRef.current;
    liveTranscriptRef.current = '';
    setLiveTranscript('');
    return finalTranscript;
  };


  /** V2 🎙️ 切换：开始 / 停止（停止后自动成卡 + 归档） */
  const handleMicToggle = async () => {
    if (isMicActive) {
      await stopMicAndProcess();
    } else {
      await handleStartMic();
    }
  };

  /** 停止听写并处理转录（成卡 + 归档笔记） */
  const stopMicAndProcess = async () => {
    const transcript = await stopMic();
    if (!transcript || transcript.includes('正在开启')) return;
    setProcessingLabel('正在理解意图并生成表达卡...');
    try {
      await speechController.handleTranscript(transcript);
      setNotes(await noteStore.getAll());
    } catch (err) {
      console.warn('[Voice Card Error]:', err);
      Alert.alert('语音处理失败', '未能理解语音内容，请重试，或改用文字表达（Tap & Talk）。');
    } finally {
      setProcessingLabel(null);
    }
  };

  /** V2 输入框发送：有快照会话 → 追问；否则文本直接生成表达卡 */
  const handleSend = async (text: string) => {
    const s = chatSessionStore.getState();
    if (s.sessionId && s.imageUri) {
      await sendSnapshotAndPromptToAI(s.imageUri, text);
      return;
    }
    setProcessingLabel('正在生成表达卡...');
    try {
      const card = await expressionEngine.generateCard(
        text,
        undefined,
        userProfile?.language ?? 'zh-CN',
      );
      const id = chatSessionStore.getState().sessionId;
      if (card) {
        const withSession = { ...card, sessionId: id ?? undefined };
        cardStackStore.getState().add(withSession);
        chatSessionStore.getState().appendCard(withSession);
      } else {
        // 区分「未配置 Key」与「表达不明确」，避免把云端不可用误归因给用户输入
        const hasKey = !!(await getOpenRouterApiKey().catch(() => null));
        chatSessionStore.getState().appendSystem(
          hasKey
            ? '未识别到明确表达需求，请说得更具体（如：我要打车 / 我对花生过敏）。'
            : 'AI 服务未配置：请在「更多 → 识别引擎设置」中填入 API Key 后重试。',
        );
      }
    } finally {
      setProcessingLabel(null);
    }
  };

  /** 菜单解读「出卡」：生成点餐大字卡入对话流 + 卡栈 */
  const handleMenuOrder = (dish: MenuDish) => {
    const card = buildOrderCard(dish, {
      location: currentCountry?.nameZh ?? '当前位置',
      languageCode: chatSessionStore.getState().scenario?.languageCode ?? 'en-US',
    });
    const withSession = { ...card, sessionId: chatSessionStore.getState().sessionId ?? undefined };
    cardStackStore.getState().add(withSession);
    chatSessionStore.getState().appendCard(withSession);
  };

  /** 机场场景胶囊：一键生成打车/末班车/eSIM 表达卡（离线内容） */
  const handleCapsuleSelect = (key: string) => {
    const capsule = getAirportCapsules().find((c) => c.key === key);
    if (!capsule) return;
    const placeStr =
      [detectedPlace?.city, detectedPlace?.region, detectedPlace?.country]
        .filter(Boolean)
        .join(' · ') || '';
    const dest = detectAirportDest(placeStr);
    const lang = userProfile?.language === 'en-US' ? 'en-US' : 'zh-CN';
    const card = buildCapsuleCard(capsule, { dest }, currentCountry?.nameZh ?? '当前位置', lang);
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    chatSessionStore
      .getState()
      .appendSystem(`📍 已根据你的位置与时间（${pad(now.getHours())}:${pad(now.getMinutes())}），为你推荐机场场景`);
    chatSessionStore.getState().appendCard(card);
    cardStackStore.getState().add(card);
  };

  /** 紧急拨打：先弹二次确认（FlashCardView/SafetyDetailModal 拨号入口统一走此） */
  const requestDial = (num: string, label: string) => {
    setConfirmDial({ num, label });
  };

  /** 确认拨打：真正拨出（tel: 打开系统拨号） */
  const handleConfirmDial = () => {
    if (!confirmDial) return;
    Linking.openURL(`tel:${confirmDial.num.replace(/[^+\d]/g, '')}`).catch(() => {});
    setConfirmDial(null);
  };

  /** V2 点表达卡消息 → 全屏大字卡覆盖层 */
  const handleCardPress = (m: ChatMessage & { kind: 'card' }) => {
    if (m.card) setFullscreenCard(m.card);
  };

  /** 一卡全览回应选项：回卡入卡栈 + 对话流（听对方说话/全览共用） */
  const handleReplyPick = (option: ReplyOption) => {
    cardStackStore.getState().add(option.replyCard);
    chatSessionStore.getState().appendCard(option.replyCard);
  };

  // ── 听对方说话（ListenReplyView）──
  /** 打开听对方说话：先静默停止对话麦克风（不触发成卡），再以卡片语言开始听写 */
  const openListen = async (card: CardData) => {
    if (isMicActive) await stopMic();
    setListenTranslated(null);
    setListenTranslateFailed(false);
    setListenElapsed(0);
    setListenCard(card);
    await startListenMic(card);
  };

  /** 以卡片语言开始听写（locale = card.languageCode，如 en-US） */
  const startListenMic = async (card: CardData | null = listenCard) => {
    if (!card) return;
    if (!speechController.isSupported()) {
      micActiveRef.current = false;
      Alert.alert('语音转写暂不可用', speechController.unsupportedReason());
      return;
    }
    micActiveRef.current = true;
    liveTranscriptRef.current = '';
    listenStartAtRef.current = Date.now();
    setListenElapsed(0);
    setIsMicActive(true);
    setLiveTranscript('正在开启原生听写，请说话...');
    const started = await speechController.start(card.languageCode);
    if (!started.ok && micActiveRef.current) {
      micActiveRef.current = false;
      setIsMicActive(false);
      setLiveTranscript(`语音识别启动失败: ${started.error}`);
    }
  };

  /** 停止听写并翻译最终转写（失败显示兜底提示） */
  const stopListenMic = async () => {
    const transcript = await stopMic();
    if (!transcript || transcript.includes('正在开启')) return;
    setListenTranslated(null);
    setListenTranslateFailed(false);
    const translated = await pluginManager
      .getCloudVlmPlugin()
      .translateUtterance(transcript, userProfile?.language ?? 'zh-CN');
    if (translated) setListenTranslated(translated);
    else setListenTranslateFailed(true);
  };

  /** 换个说法：清译文重听 */
  const handleListenRephrase = async () => {
    setListenTranslated(null);
    setListenTranslateFailed(false);
    if (isMicActive) await stopMic();
    await startListenMic(listenCard);
  };

  /** 返回一卡全览 / 关闭：静默停止麦克风并收起覆盖层 */
  const handleListenExit = async () => {
    if (isMicActive) await stopMic();
    setListenCard(null);
    setListenTranslated(null);
    setListenTranslateFailed(false);
  };

  /** 听对方说话回应：回卡 + 收起覆盖层（回落一卡全览） */
  const handleListenReply = async (option: ReplyOption) => {
    if (isMicActive) await stopMic();
    setListenCard(null);
    handleReplyPick(option);
  };

  // 听译秒表：仅听对方说话覆盖层录音期间走动
  useEffect(() => {
    if (!listenCard || !isMicActive) return;
    const timer = setInterval(() => {
      setListenElapsed(Math.floor((Date.now() - listenStartAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [listenCard, isMicActive]);



  const currentCard = cards[cardIndex] ?? TAP_TALK_CARD;

  const [notes, setNotes] = useState<NoteItem[]>([]);

  // 启动时加载持久化笔记
  useEffect(() => {
    noteStore.getAll().then(setNotes);
  }, []);

  const handleNextScenario = () => {
    cardStackStore.getState().next();
  };

  /** 当前位置预设安全卡（countryController 提供） */
  const ensureSafetyCard = (country: SavedCountry) => {
    countryController.ensureSafetyCard(country, detectedPlace?.city);
  };

  /** 确认国家选择（首次启动/手动切换）：保存档案 + 缓存国家 + 生成安全卡（业务在 countryController） */
  const handleCountryConfirm = async (code: string, profile: UserProfile) => {
    setUserProfile(profile);
    const ok = await countryController.confirm(code, profile, detectedPlace?.city);
    setIsCountrySelectOpen(false);
    if (ok) {
      const s = getCountrySafety(code);
      setCurrentCountry(s ? { code, nameZh: s.nameZh, savedAt: Date.now() } : null);
    }
  };

  const handleSwitchCountry = () => {
    if (!switchPrompt || !detectedPlace?.countryCode) return;
    setSwitchPrompt(null);
    // 切换国家时保留当前档案
    handleCountryConfirm(
      detectedPlace.countryCode,
      userProfile ?? { nationality: 'CN', language: 'zh-CN' },
    );
  };

  const handleKeepCountry = () => {
    if (!currentCountry) return;
    setSwitchPrompt(null);
    ensureSafetyCard(currentCountry);
  };

  // 国家流程：首次启动选择（GPS 检测高亮）；再次打开 GPS 与缓存比对，不同则询问（业务在 countryController.init）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await countryController.init();
      if (cancelled) return;
      setUserProfile(result.profile);
      setDetectedPlace(result.place);
      if (!result.cached) {
        // 首次启动（或档案/国家未设置）：打开选择（检测结果高亮）
        setIsCountrySelectOpen(true);
        return;
      }
      setCurrentCountry(result.cached);
      setSwitchPrompt(result.switchPrompt);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddNote = (content: string, category: string) => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const newEntry: NoteItem = {
      id: Date.now().toString(),
      content,
      category,
      timestamp: timeStr,
    };
    setNotes((prev) => [newEntry, ...prev]);
    noteStore.save(newEntry);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    noteStore.remove(id);
  };

  // 字体加载完成前保持启动画面（所有 hooks 已执行，此处提前返回安全）
  if (!fontsLoaded) {
    return (
      <View style={styles.fontLoading}>
        <ActivityIndicator size="large" color="#4fc3f7" />
      </View>
    );
  }

  return (
    // 渐变背景最外层（全屏含安全区），SafeAreaView 透明内嵌负责安全区留白
    <CameraBackground>
      <SafeAreaView style={styles.safeArea}>
        <ExpoStatusBar style="light" />
        <StatusBar barStyle="light-content" />

        <View style={styles.mainLayout}>
          {activeTab === 'chat' ? (
            <KeyboardAvoidingView
              style={styles.chatTabWrapper}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              {/* Top Header */}
              <View style={styles.topHeader}>
                <Text style={styles.brandTitle}>SCENEGO</Text>
                <View style={styles.statusPill}>
                  <View style={[styles.statusDot, isMicActive ? styles.dotGreen : styles.dotGray]} />
                  <Text style={styles.statusText}>{isMicActive ? 'LIVE' : 'IDLE'}</Text>
                </View>
              </View>

              {/* 当前位置栏 */}
              <TouchableOpacity
                style={styles.locationBar}
                onPress={() => setIsCountrySelectOpen(true)}
                activeOpacity={0.75}
              >
                <View style={[styles.locationDot, currentCountry ? styles.dotGreen : styles.dotAmber]} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {(() => {
                    const gpsName =
                      detectedPlace && (detectedPlace.country || detectedPlace.city)
                        ? [detectedPlace.country, detectedPlace.city].filter(Boolean).join(' · ')
                        : null;
                    const selectedName = currentCountry?.nameZh ?? '未选择国家';
                    const mismatch =
                      !!gpsName &&
                      !!currentCountry &&
                      detectedPlace?.countryCode !== currentCountry.code;
                    return mismatch ? `位置 ${gpsName} · 设置 ${selectedName}` : selectedName;
                  })()}
                </Text>
                <Text style={styles.locationChange}>切换 ›</Text>
              </TouchableOpacity>

              {/* 场景胶囊（机场推荐，内容通用不绑定国家） */}
              {getAirportCapsules().length > 0 ? (
                <ScenarioCapsuleBar
                  capsules={getAirportCapsules()}
                  lang={userProfile?.language === 'en-US' ? 'en-US' : 'zh-CN'}
                  onSelect={handleCapsuleSelect}
                />
              ) : null}

              {/* Processing Indicator */}
              {processingLabel && (
                <View style={styles.processingCard}>
                  <ActivityIndicator size="small" color="#4fc3f7" />
                  <Text style={styles.processingText}>{processingLabel}</Text>
                </View>
              )}

              {/* V2 对话流 */}
              <ChatPage
                messages={chatMessages}
                isRecording={isMicActive}
                liveTranscript={liveTranscript}
                onCardPress={handleCardPress}
                onMenuOrder={handleMenuOrder}
              />

              {/* V2 输入栏 + Tab 栏（贴底，Safe 区在 bottomBar 内） */}
              {/* V2 输入栏 + Tab 栏（键盘弹起时收起 TabBar 贴合键盘上沿） */}
              <View style={[styles.bottomBar, isKeyboardVisible && styles.bottomBarKeyboard]}>
                <ChatInputBar
                  isRecording={isMicActive}
                  onCamera={() => setIsCameraActive(true)}
                  onMicToggle={handleMicToggle}
                  onSend={handleSend}
                />
                {!isKeyboardVisible && (
                  <TabBar active={activeTab} onChange={setActiveTab} hidden={HIDDEN_TABS} />
                )}
              </View>
            </KeyboardAvoidingView>
          ) : (
            <>
              {activeTab === 'stack' && (
                <CardStackPage
                  cards={cards}
                  onCardPress={(card) => setFullscreenCard(card)}
                  onDelete={(id) => cardStackStore.getState().remove(id)}
                  onClear={() => cardStackStore.getState().clear()}
                />
              )}
              {activeTab === 'notes' && (
                <NotesPage notes={notes} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} />
              )}
              {activeTab === 'more' && (
                <MorePage
                  onOpenSafety={() => setIsSafetyDetailOpen(true)}
                  onOpenHistory={handleOpenHistory}
                  onOpenLogs={() => setIsLogsOpen(true)}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  onSwitchCountry={() => setIsCountrySelectOpen(true)}
                />
              )}
              <View style={styles.bottomBar}>
                <TabBar active={activeTab} onChange={setActiveTab} hidden={HIDDEN_TABS} />
              </View>
            </>
          )}
        </View>

        {/* V2 全屏取景（输入栏 📷 调起；段 E 精化 SNAP 交互） */}
        {isCameraActive ? (
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <Text style={styles.cameraBrand}>SCENEGO</Text>
              <TouchableOpacity
                style={styles.cameraCancel}
                onPress={() => {
                  setIsCameraReady(false);
                  setIsCameraActive(false);
                }}
              >
                <Text style={styles.cameraCancelText}>取消</Text>
              </TouchableOpacity>
            </View>
            <CameraPreviewBox cameraRef={cameraRef} onCameraReady={() => setIsCameraReady(true)} />
            <View style={styles.shutterContainer}>
              <TouchableOpacity style={styles.shutterOuter} onPress={handleCaptureFrame} activeOpacity={0.7}>
                <View style={styles.shutterInner} />
              </TouchableOpacity>
              <Text style={styles.snapHint}>轻触拍照</Text>
            </View>
          </View>
        ) : null}

        {/* V2 全屏大字卡（点表达卡消息调起；多步骤卡走一卡全览） */}
        {fullscreenCard ? (
          <View style={styles.fullscreenCardOverlay}>
            {fullscreenCard.steps && fullscreenCard.steps.length > 0 ? (
              <StepsCardView
                card={fullscreenCard}
                locationName={fullscreenCard.locationName}
                onClose={() => setFullscreenCard(null)}
                onListen={() => openListen(fullscreenCard)}
                onReplyPick={handleReplyPick}
              />
            ) : (
              <FlashCardView
                card={fullscreenCard}
                currentIndex={0}
                totalCards={1}
                onNextCard={() => {}}
                tipActionLabel={
                  fullscreenCard.id.startsWith('safety-')
                    ? '安全信息'
                    : fullscreenCard.sessionId === chatSessionStore.getState().sessionId
                      ? 'AI 解读'
                      : undefined
                }
                onTipAction={
                  fullscreenCard.id.startsWith('safety-')
                    ? () => setIsSafetyDetailOpen(true)
                    : fullscreenCard.sessionId === chatSessionStore.getState().sessionId
                      ? handleOpenSnapshotFromCard
                      : undefined
                }
                onClose={() => setFullscreenCard(null)}
                onDial={requestDial}
              />
            )}
          </View>
        ) : null}

        {/* V2 听对方说话覆盖层（层级在 steps 全览之上） */}
        {listenCard ? (
          <View style={styles.fullscreenCardOverlay}>
            <ListenReplyView
              card={listenCard}
              isRecording={isMicActive}
              transcript={liveTranscript}
              translated={listenTranslated}
              translateFailed={listenTranslateFailed}
              elapsedSec={listenElapsed}
              onToggleMic={isMicActive ? stopListenMic : () => startListenMic(listenCard)}
              onRephrase={handleListenRephrase}
              onBack={handleListenExit}
              onReplyPick={handleListenReply}
              onClose={handleListenExit}
            />
          </View>
        ) : null}

        <SnapshotDialogModal
          visible={isSnapshotModalOpen}
          imageUri={pendingSnapshotUri}
          scenarioResult={activeScenarioResult}
          turns={messagesToTurns(chatMessages)}
          onClose={() => setIsSnapshotModalOpen(false)}
          onSubmit={handleSnapshotSubmit}
          onCollect={(content) => handleAddNote(content, 'CARD')}
        />

        <PluginSelectorModal
          visible={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        <UtilityDrawerModal
          visible={isToolsOpen}
          onClose={() => setIsToolsOpen(false)}
          onSelect={handleToolSelect}
        />

        <SessionHistoryModal
          visible={isHistoryOpen}
          sessions={sessions}
          onClose={() => setIsHistoryOpen(false)}
          onSelect={restoreSession}
          onDelete={handleDeleteSession}
        />

        <ApiLogModal
          visible={isLogsOpen}
          onClose={() => setIsLogsOpen(false)}
        />

        <CountrySelectModal
          visible={isCountrySelectOpen}
          detected={detectedPlace}
          currentCode={currentCountry?.code}
          profile={userProfile}
          onClose={() => setIsCountrySelectOpen(false)}
          onConfirm={handleCountryConfirm}
        />

        <CountrySwitchPromptModal
          visible={!!switchPrompt}
          detectedName={switchPrompt?.detectedName ?? ''}
          currentName={currentCountry?.nameZh ?? ''}
          onSwitch={handleSwitchCountry}
          onKeep={handleKeepCountry}
        />

        <SafetyDetailModal
          visible={isSafetyDetailOpen}
          safety={currentCountry ? getCountrySafety(currentCountry.code) : null}
          place={detectedPlace}
          profile={userProfile}
          onClose={() => setIsSafetyDetailOpen(false)}
          onDial={requestDial}
        />

        <EmergencyConfirmModal
          visible={!!confirmDial}
          num={confirmDial?.num ?? ''}
          label={confirmDial?.label ?? ''}
          countryName={currentCountry?.nameZh ?? ''}
          sos={currentCountry ? (getCountrySafety(currentCountry.code)?.sos ?? null) : null}
          onClose={() => setConfirmDial(null)}
          onConfirm={handleConfirmDial}
        />
      </SafeAreaView>
    </CameraBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  fontLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b',
  },
  mainLayout: {
    flex: 1,
    justifyContent: 'space-between',
  },
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.95)',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.4)',
    gap: 10,
  },
  processingText: {
    color: '#4fc3f7',
    fontSize: 13,
    fontWeight: '600',
  },
  liveTranscriptCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.92)',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.4)',
  },
  liveHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  liveHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveCloseText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
  },
  liveBadge: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  liveRecordingPulse: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '800',
  },
  liveTranscriptText: {
    color: '#f4f4f5',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  chatTabWrapper: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  brandTitle: {
    fontFamily: FONT.monoBold,
    color: '#ffffff',
    fontSize: 18,
    letterSpacing: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: COLORS.accentGreen,
  },
  dotGray: {
    backgroundColor: COLORS.textMuted,
  },
  statusText: {
    fontFamily: FONT.mono,
    color: COLORS.accentGreen,
    fontSize: 10,
    letterSpacing: 1,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    height: 39,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginTop: 4,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationText: {
    fontFamily: FONT.semibold,
    color: COLORS.textPrimary,
    fontSize: 13,
    flex: 1,
  },
  locationChange: {
    fontFamily: FONT.regular,
    color: COLORS.textTertiary,
    fontSize: 12,
    marginLeft: 8,
  },
  dotAmber: {
    backgroundColor: '#f59e0b',
  },
  centerCardArea: {
    flex: 1,
    justifyContent: 'center',
  },
  hiddenCardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenCardText: {
    color: '#52525b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  // V2：底部输入栏 + Tab 栏（Safe 区）
  bottomBar: {
    paddingBottom: LAYOUT.bottomSafeArea,
    backgroundColor: COLORS.bgBar,
  },
  bottomBarKeyboard: {
    paddingBottom: 0,
  },
  tabPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPlaceholderText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  // V2：全屏取景覆盖层
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 20,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  cameraBrand: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: FONT.monoBold,
  },
  cameraCancel: {
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cameraCancelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  shutterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 34,
    gap: 8,
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  snapHint: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontFamily: FONT.regular,
  },
  // V2：全屏大字卡覆盖层
  fullscreenCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bgPrimary,
    zIndex: 30,
    paddingTop: 52,
    paddingHorizontal: 20,
  },
  fullscreenClose: {
    alignSelf: 'center',
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 34,
  },
  fullscreenCloseText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
});
