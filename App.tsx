import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, ActivityIndicator, Animated, TouchableOpacity, Platform, Alert } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import { pluginManager, ScenarioResult, ChatTurn } from './src/plugins';
import { CameraBackground } from './src/components/CameraBackground';
import { CameraPreviewBox } from './src/components/CameraPreviewBox';
import { CaptureDock } from './src/components/CaptureDock';
import { FlashCardView, CardData } from './src/components/FlashCardView';
import { ControlBar } from './src/components/ControlBar';
import { QuickNotesModal } from './src/components/QuickNotesModal';
import { SnapshotDialogModal } from './src/components/SnapshotDialogModal';
import { CountrySelectModal } from './src/components/CountrySelectModal';
import { CountrySwitchPromptModal } from './src/components/CountrySwitchPromptModal';
import { SafetyDetailModal } from './src/components/SafetyDetailModal';
import { PluginSelectorModal } from './src/components/PluginSelectorModal';
import { ApiLogModal } from './src/components/ApiLogModal';
import { SessionHistoryModal } from './src/components/SessionHistoryModal';
import { UtilityDrawerModal, ToolKind } from './src/components/UtilityDrawerModal';
import { NativeSpeech } from './src/utils/NativeSpeech';
import { scenarioToCard } from './src/utils/cardBuilder';
import { getLocationContext, getPlaceContext, PlaceContext } from './src/utils/locationContext';
import { compressImage } from './src/utils/imageCompress';
import { loadCountry, saveCountry, SavedCountry } from './src/utils/countryStore';
import { loadUserProfile, saveUserProfile, UserProfile } from './src/utils/userProfile';
import { getCountrySafety } from './src/data/countrySafety';
import { modelManager } from './src/utils/ModelManager';
import { initPack } from './src/packs/packManager';
import { sessionStore, SavedSession } from './src/utils/SessionStore';
import { noteStore, NoteItem } from './src/utils/NoteStore';
import { useFonts } from 'expo-font';
import { COLORS, FONT } from './src/theme/tokens';

// Tap&Talk 兜底卡：始终存在于卡栈末尾，动态卡缺失时的默认表达入口
const TAP_TALK_CARD: CardData = {
  id: 'tap-talk',
  categoryTag: '通用 / 双向语音',
  locationName: '当前位置',
  title: 'Tap & Talk 通用表达',
  targetText: '按住麦克风说话，说出需求即可生成当地语言表达卡',
  phonetic: '',
  subText: '或拍摄眼前场景，一键生成表达卡递给当地人',
  localTip: '说清诉求（如：我要打车 / 我对花生过敏），卡片会按当地语言生成。',
  languageCode: 'zh-CN',
};

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
  const [isCardVisible, setIsCardVisible] = useState<boolean>(true);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false);

  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState<boolean>(false);
  const [pendingSnapshotUri, setPendingSnapshotUri] = useState<string | null>(null);
  const [activeScenarioResult, setActiveScenarioResult] = useState<ScenarioResult | null>(null);
  const [processingLabel, setProcessingLabel] = useState<string | null>(null);
  // 快照多轮对话历史（首条为场景解读，后续为追问问答）
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const chatTurnsRef = useRef<ChatTurn[]>([]);
  // 当前会话 id：新快照时重建，追问时更新同一会话
  const sessionIdRef = useRef<string | null>(null);
  // 场景结果 ref 副本（持久化/追问时读取最新值）
  const scenarioResultRef = useRef<ScenarioResult | null>(null);

  // 表达卡栈：动态生成卡在前，Tap&Talk 兑底卡恒在末尾；cardIndex 指向当前展示卡
  const [cards, setCards] = useState<CardData[]>([TAP_TALK_CARD]);
  const [cardIndex, setCardIndex] = useState<number>(0);
  // 当前国家/地区（缓存的用户选择）与 GPS 检测位置；用户档案（国籍+语言）
  const [currentCountry, setCurrentCountry] = useState<SavedCountry | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [detectedPlace, setDetectedPlace] = useState<PlaceContext | null>(null);
  const [isCountrySelectOpen, setIsCountrySelectOpen] = useState<boolean>(false);
  const [switchPrompt, setSwitchPrompt] = useState<{ detectedName: string } | null>(null);
  const [isSafetyDetailOpen, setIsSafetyDetailOpen] = useState<boolean>(false);
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
  // 待展示的快照弹窗标记：LOG dismiss 动画完成后再 present，避免 UIKit modal 队列冲突
  const pendingSnapshotRef = useRef(false);

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

  /** 云端 VLM 多轮追问：携带会话历史，回答后追加到对话流并持久化 */
  const sendSnapshotAndPromptToAI = async (imageUri: string, userPrompt: string) => {
    setProcessingLabel('正在回答...');
    try {
      const cloudVlm = pluginManager.getCloudVlmPlugin();
      const reply = await cloudVlm.askFollowUp(imageUri, userPrompt, chatTurnsRef.current);

      const newTurns = [
        ...chatTurnsRef.current,
        { role: 'user' as const, content: userPrompt },
        { role: 'assistant' as const, content: reply },
      ];
      chatTurnsRef.current = newTurns;
      setChatTurns(newTurns);
      if (sessionIdRef.current) {
        persistSession(sessionIdRef.current, imageUri, scenarioResultRef.current, newTurns);
      }
    } catch (err) {
      console.warn('[AI Follow-up Error]:', err);
    } finally {
      setProcessingLabel(null);
    }
  };

  /** 持久化当前快照会话（显式传参，避免 async 闭包读到过期 state） */
  const persistSession = (
    id: string,
    imageUri: string | null,
    scenarioResult: ScenarioResult | null,
    turns: ChatTurn[],
  ) => {
    sessionStore.save(sessionStore.build(id, imageUri, scenarioResult, turns));
  };

  /** 恢复历史会话：回填全部状态，待历史列表 dismiss 完成后打开快照弹窗 */
  const restoreSession = (s: SavedSession) => {
    sessionIdRef.current = s.id;
    scenarioResultRef.current = s.scenarioResult;
    chatTurnsRef.current = s.turns;
    setActiveScenarioResult(s.scenarioResult);
    setPendingSnapshotUri(s.imageUri);
    setChatTurns(s.turns);
    // 历史列表必然开着：先关，等 dismiss 动画完成再 present 快照
    pendingSnapshotRef.current = true;
    setIsHistoryOpen(false);
  };

  /** 待展示快照的延迟 present：任一 modal dismiss 完成后调用 */
  const handleDeferredSnapshot = () => {
    if (pendingSnapshotRef.current) {
      pendingSnapshotRef.current = false;
      setIsSnapshotModalOpen(true);
    }
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

  /** CAM 双击：拍照 → 提取信息 → 直接生成表达卡（卡片优先，解读降级为卡面入口） */
  const handleCaptureFrame = async () => {
    if (!isCameraActive) return;
    setProcessingLabel('正在提取信息并生成卡片...');
    try {
      const cam = cameraRef.current as { takePictureAsync?: (opts: { quality: number }) => Promise<{ uri: string }> } | null;
      let photoUri: string | null = null;

      if (cam?.takePictureAsync && isCameraReady) {
        try {
          const photo = await cam.takePictureAsync({ quality: 0.8 });
          photoUri = photo?.uri || null;
        } catch (camErr) {
          console.log('[Camera] 真实摄像头捕获失败 (模拟器环境)，启用模拟快照降级:', camErr);
        }
        // 上传前压缩（最长边 1280px + JPEG 0.7），弱网体验优化
        if (photoUri) {
          photoUri = await compressImage(photoUri);
        }
      }

      // 模拟器/测试环境降级保底：若无法取得真实硬件快照，生成测试快照数据
      if (!photoUri) {
        console.log('[Camera] 正在为模拟器生成快照数据...');
        photoUri = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'; // 预设曼谷美食/场景测试图
      }

      setIsCameraActive(false);
      setIsCameraReady(false);

      // 触发插件管线: 场景识别 + 语义匹配（携带位置上下文）
      console.log('[Plugins] 启动插件管线，处理图像快照...');
      const locationCtx = await getLocationContext();
      const result = await pluginManager.processImageSnapshot(photoUri, locationCtx ?? undefined);
      console.log('[Plugin OCR 结果]:', result.ocr.rawText.slice(0, 100));
      console.log('[Plugin 场景匹配结果]:', result.scenario.title);

      setActiveScenarioResult(result.scenario);
      setPendingSnapshotUri(photoUri);
      scenarioResultRef.current = result.scenario;
      // 新会话：首条消息为场景解读，并持久化
      const initialTurns: ChatTurn[] = [
        { role: 'assistant', content: result.scenario.translatedText },
      ];
      const newSessionId = Date.now().toString();
      sessionIdRef.current = newSessionId;
      chatTurnsRef.current = initialTurns;
      setChatTurns(initialTurns);
      persistSession(newSessionId, photoUri, result.scenario, initialTurns);
      // 直接成卡：场景解读 → 表达卡，置顶卡栈（解读不再自动弹窗，走卡面「AI 解读」入口）
      addExpressionCard({
        ...scenarioToCard(result.scenario, locationCtx ?? '当前位置'),
        sessionId: newSessionId,
      });
    } catch (err) {
      console.warn('Camera snapshot error:', err);
      setIsCameraActive(false);
      setIsCameraReady(false);
    } finally {
      setProcessingLabel(null);
    }
  };

  /** 卡面「AI 解读」入口：仅最新快照会话可进（状态已在内存） */
  const handleOpenSnapshotFromCard = () => {
    if (!currentCard.sessionId || currentCard.sessionId !== sessionIdRef.current) return;
    setIsSnapshotModalOpen(true);
  };

  const handleSnapshotSubmit = async (userPrompt: string, imageUri: string) => {
    await sendSnapshotAndPromptToAI(imageUri, userPrompt);
  };

  /** 启动麦克风（MIC OFF 态点按） */
  const handleStartMic = async () => {
    // Android 无原生听写模块：明确降级提示，避免启动失败的黑盒体验
    if (Platform.OS === 'android') {
      micActiveRef.current = false;
      Alert.alert(
        '语音转写暂不可用',
        '当前设备为 Android：实时语音转写模块仅支持 iOS。\n请用 CAM 拍照识别场景，或使用下方文字表达（Tap&Talk）。'
      );
      return;
    }
    // 期望状态先行，杜绝授权异步窗口内的重复触发
    micActiveRef.current = true;
    liveTranscriptRef.current = '';
    setIsMicActive(true);
    setLiveTranscript('正在开启原生听写，请说话...');
    const started = await NativeSpeech.start('zh-CN');
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
    await NativeSpeech.stop();
    const finalTranscript = liveTranscriptRef.current;
    liveTranscriptRef.current = '';
    setLiveTranscript('');
    return finalTranscript;
  };

  /** 麦克风单击：停止转录，不做任何操作 */
  const handleMicSingleTap = async () => {
    await stopMic();
  };

  /** 麦克风双击：停止转录，理解意图生成表达卡（双击即显式意图信号） */
  const handleMicDoubleTap = async () => {
    const transcript = await stopMic();
    if (!transcript || transcript.includes('正在开启')) return;
    handleAddNote(transcript, 'VOICE');
    setProcessingLabel('正在理解意图并生成表达卡...');
    try {
      const locationCtx = await getLocationContext();
      const result = await pluginManager.generateCardFromText(transcript, locationCtx ?? undefined);
      if (result && result.targetText) {
        addExpressionCard(scenarioToCard(result, '当前位置'));
      }
    } catch (err) {
      console.warn('[Voice Card Error]:', err);
    } finally {
      setProcessingLabel(null);
    }
  };

  const handleToggleCamera = () => {
    if (!isCameraActive) {
      setIsCameraReady(false);
      setIsCameraActive(true);
      setIsCardVisible(false);
    } else {
      setIsCameraReady(false);
      setIsCameraActive(false);
    }
  };

  const currentCard = cards[cardIndex] ?? TAP_TALK_CARD;

  const [notes, setNotes] = useState<NoteItem[]>([]);

  // 启动时加载持久化笔记
  useEffect(() => {
    noteStore.getAll().then(setNotes);
  }, []);

  const handleNextScenario = () => {
    setCardIndex((prev) => (prev + 1) % cards.length);
  };

  /** 新表达卡入栈：去重后置顶展示，并确保卡面可见 */
  const addExpressionCard = (card: CardData) => {
    setCards((prev) => [card, ...prev.filter((c) => c.id !== card.id)]);
    setCardIndex(0);
    setIsCardVisible(true);
  };

  /** 当前位置预设安全卡（卡栈第一张） */
  const buildSafetyCard = (country: SavedCountry): CardData => {
    const s = getCountrySafety(country.code)!;
    const city = detectedPlace?.city ?? '';
    return {
      id: `safety-${country.code}`,
      categoryTag: '本地安全指南',
      locationName: `${country.nameZh}${city ? ' · ' + city : ''}`,
      title: `${country.nameZh}安全与实用信息`,
      targetText: s.sos.local,
      phonetic: s.sos.phonetic,
      subText: `紧急电话：警察 ${s.emergency.police} · 急救 ${s.emergency.ambulance} · 火警 ${s.emergency.fire}${s.emergency.touristPolice ? ` · 旅游警察 ${s.emergency.touristPolice}` : ''}`,
      localTip: `使领馆领保 ${s.embassy} · ${s.tipping}`,
      languageCode: s.langCode,
    };
  };

  const ensureSafetyCard = (country: SavedCountry) => {
    if (!getCountrySafety(country.code)) return;
    addExpressionCard(buildSafetyCard(country));
  };

  /** 确认国家选择（首次启动/手动切换）：保存档案 + 缓存国家 + 生成安全卡 */
  const handleCountryConfirm = (code: string, profile: UserProfile) => {
    const s = getCountrySafety(code);
    setUserProfile(profile);
    saveUserProfile(profile);
    if (!s) {
      setIsCountrySelectOpen(false);
      return;
    }
    const saved: SavedCountry = { code, nameZh: s.nameZh, savedAt: Date.now() };
    setCurrentCountry(saved);
    saveCountry(saved);
    ensureSafetyCard(saved);
    setIsCountrySelectOpen(false);
  };

  const handleSwitchCountry = () => {
    if (!switchPrompt || !detectedPlace?.countryCode) return;
    setSwitchPrompt(null);
    // 切换国家时保留当前档案
    handleCountryConfirm(detectedPlace.countryCode, userProfile ?? { nationality: 'CN', language: 'zh-CN' });
  };

  const handleKeepCountry = () => {
    if (!currentCountry) return;
    setSwitchPrompt(null);
    ensureSafetyCard(currentCountry);
  };

  // 国家流程：首次启动选择（GPS 检测高亮）；再次打开 GPS 与缓存比对，不同则询问
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await loadCountry();
      const profile = await loadUserProfile();
      const place = await getPlaceContext();
      if (cancelled) return;
      setUserProfile(profile);
      setDetectedPlace(place);
      if (!cached) {
        // 首次启动（或档案/国家未设置）：打开选择（检测结果高亮）
        setIsCountrySelectOpen(true);
        return;
      }
      setCurrentCountry(cached);
      if (place?.countryCode && place.countryCode !== cached.code) {
        const detected = getCountrySafety(place.countryCode);
        if (detected) {
          setSwitchPrompt({ detectedName: detected.nameZh });
        } else {
          ensureSafetyCard(cached);
        }
      } else {
        ensureSafetyCard(cached);
      }
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
          {/* Top Header */}
          <View style={styles.topHeader}>
            <Text style={styles.brandTitle}>SCENEGO</Text>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, isMicActive ? styles.dotGreen : styles.dotGray]} />
              <Text style={styles.statusText}>{isMicActive ? 'LIVE' : 'IDLE'}</Text>
            </View>
          </View>

          {/* 当前位置栏：GPS 实际位置；与设置国家不一致时并排展示 */}
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

          {/* Processing Indicator */}
          {processingLabel && (
            <View style={styles.processingCard}>
              <ActivityIndicator size="small" color="#4fc3f7" />
              <Text style={styles.processingText}>{processingLabel}</Text>
            </View>
          )}

          {/* Live Speech Transcript Banner：录音中常显；关闭后仅真实异常（失败/异常/错误）保留 */}
          {isMicActive ||
          (liveTranscript &&
            (liveTranscript.includes('异常') ||
              liveTranscript.includes('失败') ||
              liveTranscript.includes('错误'))) ? (
            <View style={styles.liveTranscriptCard}>
              <View style={styles.liveHeaderRow}>
                <Text style={styles.liveBadge}>
                  {isMicActive ? '实时语音转录中' : '语音识别提示'}
                </Text>
                <View style={styles.liveHeaderRight}>
                  {isMicActive && (
                    <Animated.Text style={[styles.liveRecordingPulse, { opacity: pulseAnim }]}>
                      REC
                    </Animated.Text>
                  )}
                  {/* 异常提示可手动关闭 */}
                  {!isMicActive && (
                    <TouchableOpacity
                      onPress={() => setLiveTranscript('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.liveCloseText}>关闭</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <Text style={styles.liveTranscriptText}>
                {liveTranscript || '请说话，系统正在进行原生 0 延迟实时语音听写...'}
              </Text>
            </View>
          ) : null}

          {/* Center Card / 内嵌取景 */}
          <View style={styles.centerCardArea}>
            {isCameraActive ? (
              <CameraPreviewBox
                cameraRef={cameraRef}
                onCameraReady={() => setIsCameraReady(true)}
              />
            ) : isCardVisible ? (
              <FlashCardView
                card={currentCard}
                currentIndex={cardIndex}
                totalCards={cards.length}
                onNextCard={handleNextScenario}
                tipActionLabel={
                  currentCard.id.startsWith('safety-')
                    ? '安全信息'
                    : currentCard.sessionId === sessionIdRef.current
                      ? 'AI 解读'
                      : undefined
                }
                onTipAction={
                  currentCard.id.startsWith('safety-')
                    ? () => setIsSafetyDetailOpen(true)
                    : currentCard.sessionId === sessionIdRef.current
                      ? handleOpenSnapshotFromCard
                      : undefined
                }
              />
            ) : (
              <View style={styles.hiddenCardContainer}>
                <Text style={styles.hiddenCardText}>CARD HIDDEN</Text>
              </View>
            )}
          </View>

          {/* 卡片下方的输入双按钮：CAM 拍照 / MIC 说话 */}
          <CaptureDock
            isCameraActive={isCameraActive}
            isMicActive={isMicActive}
            onCamTap={handleToggleCamera}
            onCamDoubleTap={handleCaptureFrame}
            onCamSingleTap={() => {
              // 单击：只退出取景，不拍照、不触发云端分析
              setIsCameraReady(false);
              setIsCameraActive(false);
            }}
            onMicTap={handleStartMic}
            onMicDoubleTap={handleMicDoubleTap}
            onMicSingleTap={handleMicSingleTap}
          />

          {/* Bottom Control Bar：仅状态开关与入口 */}
          <ControlBar
            isCardVisible={isCardVisible}
            onToggleCard={() => setIsCardVisible(!isCardVisible)}
            onOpenNotes={() => setIsNotesOpen(true)}
            onOpenTools={() => setIsToolsOpen(true)}
          />
        </View>

        <QuickNotesModal
          visible={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
          notes={notes}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
        />

        <SnapshotDialogModal
          visible={isSnapshotModalOpen}
          imageUri={pendingSnapshotUri}
          scenarioResult={activeScenarioResult}
          turns={chatTurns}
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
          onDismiss={handleDeferredSnapshot}
        />

        <ApiLogModal
          visible={isLogsOpen}
          onClose={() => setIsLogsOpen(false)}
          onDismiss={handleDeferredSnapshot}
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
        />
      </SafeAreaView>
    </CameraBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
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
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotGreen: {
    backgroundColor: '#10b981',
  },
  dotGray: {
    backgroundColor: COLORS.textMuted,
  },
  statusText: {
    fontFamily: FONT.mono,
    color: COLORS.textSecondary,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    borderRadius: 10,
    height: 39,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginTop: 8,
  },
  locationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 7,
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
});
