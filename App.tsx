import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, ActivityIndicator, Animated, TouchableOpacity, Platform, Alert } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import { pluginManager, ScenarioResult } from './src/plugins';
import { CameraBackground } from './src/components/CameraBackground';
import { CameraPreviewBox } from './src/components/CameraPreviewBox';
import { FlashCardView, CardData } from './src/components/FlashCardView';
import { QuickNotesModal } from './src/components/QuickNotesModal';
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
import { TabBar, TabKey } from './src/components/TabBar';
import { CardStackPage } from './src/components/CardStackPage';
import { NotesPage } from './src/components/NotesPage';
import { MorePage } from './src/components/MorePage';
import { ChatMessage } from './src/core/types';
import { NativeSpeech } from './src/utils/NativeSpeech';
import { PlaceContext } from './src/utils/locationContext';
import { SavedCountry } from './src/utils/countryStore';
import { UserProfile } from './src/utils/userProfile';
import { getCountrySafety } from './src/data/countrySafety';
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
  const isCardVisible = useStore(cardStackStore, (s) => s.visible);
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

  /** 云端 VLM 多轮追问（业务在 expressionEngine + chatSessionStore）：回答追加对话流；表达需求自动成卡 */
  const sendSnapshotAndPromptToAI = async (imageUri: string, userPrompt: string) => {
    setProcessingLabel('正在回答...');
    try {
      const result = await expressionEngine.askFollowUp(
        imageUri,
        userPrompt,
        messagesToTurns(chatSessionStore.getState().messages),
      );
      chatSessionStore.getState().appendFollowUp(userPrompt, result.text, result.card);
      if (result.card) {
        cardStackStore.getState().add({
          ...result.card,
          sessionId: chatSessionStore.getState().sessionId ?? undefined,
        });
      }
    } catch (err) {
      console.warn('[AI Follow-up Error]:', err);
    } finally {
      setProcessingLabel(null);
    }
  };

  /** 恢复历史会话（业务状态由 chatSessionStore 回填）：待历史列表 dismiss 完成后打开快照弹窗 */
  const restoreSession = (s: SavedSession) => {
    chatSessionStore.getState().restore(s);
    setActiveScenarioResult(s.scenarioResult);
    setPendingSnapshotUri(s.imageUri);
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

  /** CAM 双击：拍照（设备层）→ expressionEngine 识别 → 新会话 + 表达卡入栈 */
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
      }

      // 模拟器/测试环境降级保底：若无法取得真实硬件快照，生成测试快照数据
      if (!photoUri) {
        console.log('[Camera] 正在为模拟器生成快照数据...');
        photoUri = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'; // 预设曼谷美食/场景测试图
      }

      setIsCameraActive(false);
      setIsCameraReady(false);

      // 识别管线（压缩/OCR/匹配/成卡）在 expressionEngine
      console.log('[Plugins] 启动插件管线，处理图像快照...');
      const { scenario, card } = await expressionEngine.processImage(photoUri);
      console.log('[Plugin 场景匹配结果]:', scenario.title);

      setActiveScenarioResult(scenario);
      setPendingSnapshotUri(photoUri);
      // 新会话：首条消息为场景解读并持久化；表达卡入栈（带会话 id，卡面可进追问）
      const newSessionId = chatSessionStore.getState().start(photoUri, scenario);
      cardStackStore.getState().add({ ...card, sessionId: newSessionId });
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


  /** 麦克风双击：停止转录 → speechController 意图处理（成卡 + 归档笔记） */
  const handleMicDoubleTap = async () => {
    const transcript = await stopMic();
    if (!transcript || transcript.includes('正在开启')) return;
    setProcessingLabel('正在理解意图并生成表达卡...');
    try {
      await speechController.handleTranscript(transcript);
      setNotes(await noteStore.getAll());
    } catch (err) {
      console.warn('[Voice Card Error]:', err);
    } finally {
      setProcessingLabel(null);
    }
  };

  /** V2 🎙️ 单击切换：开始 / 停止（停止后自动成卡 + 归档） */
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
      const card = await expressionEngine.generateCard(text);
      const id = chatSessionStore.getState().sessionId;
      if (card) {
        const withSession = { ...card, sessionId: id ?? undefined };
        cardStackStore.getState().add(withSession);
        chatSessionStore.getState().appendCard(withSession);
      } else {
        chatSessionStore.getState().appendSystem('未识别到明确表达需求，请说得更具体（如：我要打车 / 我对花生过敏）。');
      }
    } finally {
      setProcessingLabel(null);
    }
  };

  /** V2 点表达卡消息 → 全屏大字卡覆盖层 */
  const handleCardPress = (m: ChatMessage & { kind: 'card' }) => {
    if (m.card) setFullscreenCard(m.card);
  };



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
            <>
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
              />

              {/* V2 输入栏 + Tab 栏（贴底，Safe 区在 bottomBar 内） */}
              <View style={styles.bottomBar}>
                <ChatInputBar
                  isRecording={isMicActive}
                  onCamera={() => setIsCameraActive(true)}
                  onMicToggle={handleMicToggle}
                  onSend={handleSend}
                />
                <TabBar active={activeTab} onChange={setActiveTab} />
              </View>
            </>
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
                <TabBar active={activeTab} onChange={setActiveTab} />
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
            <Text style={styles.cameraHint}>对准菜单 / 标牌 / 售票机</Text>
            <CameraPreviewBox cameraRef={cameraRef} onCameraReady={() => setIsCameraReady(true)} />
            <TouchableOpacity style={styles.snapButton} onPress={handleCaptureFrame} activeOpacity={0.85}>
              <Text style={styles.snapText}>SNAP</Text>
              <Text style={styles.snapHint}>拍照即发送 · 单击取消</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* V2 全屏大字卡（点表达卡消息调起） */}
        {fullscreenCard ? (
          <View style={styles.fullscreenCardOverlay}>
            <FlashCardView
              card={fullscreenCard}
              currentIndex={0}
              totalCards={1}
              onNextCard={() => {}}
            />
            <TouchableOpacity style={styles.fullscreenClose} onPress={() => setFullscreenCard(null)}>
              <Text style={styles.fullscreenCloseText}>✕ 返回</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
  // V2：底部输入栏 + Tab 栏（Safe 区）
  bottomBar: {
    paddingBottom: LAYOUT.bottomSafeArea,
    backgroundColor: COLORS.bgBar,
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
  cameraHint: {
    color: '#4a4a52',
    fontSize: 14,
    textAlign: 'center',
    paddingBottom: 12,
  },
  snapButton: {
    marginHorizontal: 20,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.redBg,
    borderWidth: 1,
    borderColor: COLORS.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 34,
  },
  snapText: {
    color: COLORS.accentRed,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: FONT.monoBold,
  },
  snapHint: {
    color: COLORS.textTertiary,
    fontSize: 9,
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
