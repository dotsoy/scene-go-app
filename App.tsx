import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, ActivityIndicator, Animated } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import { pluginManager, ScenarioResult, ChatTurn } from './src/plugins';
import { CameraBackground } from './src/components/CameraBackground';
import { FlashCardView, CardData } from './src/components/FlashCardView';
import { ControlBar } from './src/components/ControlBar';
import { QuickNotesModal } from './src/components/QuickNotesModal';
import { SnapshotDialogModal } from './src/components/SnapshotDialogModal';
import { PluginSelectorModal } from './src/components/PluginSelectorModal';
import { ApiLogModal } from './src/components/ApiLogModal';
import { SessionHistoryModal } from './src/components/SessionHistoryModal';
import { UtilityDrawerModal, ToolKind } from './src/components/UtilityDrawerModal';
import { NativeSpeech } from './src/utils/NativeSpeech';
import { modelManager } from './src/utils/ModelManager';
import { sessionStore, SavedSession } from './src/utils/SessionStore';
import { noteStore, NoteItem } from './src/utils/NoteStore';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://71913c9b41554c4dd80d559db168205a@o4511835504574464.ingest.us.sentry.io/4511835559428096',
  sendDefaultPii: true,
  enableAutoSessionTracking: true,
  tracesSampleRate: 1.0,
  debug: __DEV__,
});

// 卡片预设测试数据（全部采用中文展示与测试）
const SCENARIO_GENERATORS: Record<string, (location: string) => CardData> = {
  AIRPORT_TAXI: (loc) => ({
    id: 'sc-1',
    categoryTag: '打车 / 计价器',
    locationName: loc,
    title: '出租车按表计费声明',
    targetText: '请按表计费，谢谢（请打表）',
    phonetic: 'Qing An Biao Ji Fei, Xie Xie',
    subText: '请使用计价器按标准费率打表',
    localTip: '曼谷机场打车请前往 1 楼叫号机，按表付费另加 50 铢附加费。',
    languageCode: 'zh-CN',
  }),
  DINING_ORDER: (loc) => ({
    id: 'sc-2',
    categoryTag: '餐饮 / 忌口过敏',
    locationName: loc,
    title: '餐食过敏与忌口说明',
    targetText: '我对花生严重过敏，请勿添加',
    phonetic: 'Wo Dui Hua Sheng Yan Zhong Guo Min',
    subText: '请确保菜品无花生及花生制品',
    localTip: '居酒屋默认自动提供开胃小菜（お通し，人头消费 300-500 日元）。',
    languageCode: 'zh-CN',
  }),
  TAX_REFUND: (loc) => ({
    id: 'sc-3',
    categoryTag: '购物 / 退税',
    locationName: loc,
    title: '购物退税单开具申请',
    targetText: '请帮我开具退税申请单，谢谢',
    phonetic: 'Qing Bang Wo Kai Ju Tui Shui Dan',
    subText: '请开具官方退税凭证与表格',
    localTip: '单日消费满 2,000 铢可开具退税单，离境在机场海关盖章。',
    languageCode: 'zh-CN',
  }),
  EMERGENCY_SOS: (loc) => ({
    id: 'sc-4',
    categoryTag: '紧急 / 救援',
    locationName: loc,
    title: '紧急大字求助与 GPS 坐标',
    targetText: '求助！请协助联系警察并定位此坐标',
    phonetic: 'Qiu Zhu! Qing Xie Zhu Lian Xi Jing Cha',
    subText: '紧急联系电话：旅游警察专线 1155',
    localTip: '遭遇紧急危险请出示此卡给路人，当地旅游警察专线：1155。',
    languageCode: 'zh-CN',
  }),
};

const SCENARIO_KEYS = Object.keys(SCENARIO_GENERATORS);
const MOCK_LOCATIONS = [
  '曼谷素万那普机场 (BKK)',
  '东京新宿居酒屋',
  '曼谷 CENTRAL WORLD 商场',
  '未知异国位置',
];

export default Sentry.wrap(function App() {
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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  // 快照多轮对话历史（首条为场景解读，后续为追问问答）
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const chatTurnsRef = useRef<ChatTurn[]>([]);
  // 当前会话 id：新快照时重建，追问时更新同一会话
  const sessionIdRef = useRef<string | null>(null);
  // 场景结果 ref 副本（持久化/追问时读取最新值）
  const scenarioResultRef = useRef<ScenarioResult | null>(null);

  const [scenarioIndex, setScenarioIndex] = useState<number>(0);
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
  // 日志弹窗可见性的 ref 副本（async 管线内读取最新值）
  const isLogsOpenRef = useRef(false);
  // 待展示的快照弹窗标记：LOG dismiss 动画完成后再 present，避免 UIKit modal 队列冲突
  const pendingSnapshotRef = useRef(false);

  useEffect(() => {
    isLogsOpenRef.current = isLogsOpen;
  }, [isLogsOpen]);

  // 启动时探测本地模型：已下载的 Qwen/Whisper 自动注册并激活，无文件则静默跳过（不影响云端主链路）
  useEffect(() => {
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
    setIsProcessing(true);
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
      setIsProcessing(false);
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

  const handleCaptureFrame = async () => {
    if (!isCameraActive) return;
    setIsProcessing(true);
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

      // 触发插件管线: 场景识别 + 语义匹配
      console.log('[Plugins] 启动插件管线，处理图像快照...');
      const result = await pluginManager.processImageSnapshot(photoUri);
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
      if (isLogsOpenRef.current) {
        // LOG 弹窗开着：先关闭，待 dismiss 动画完成 (onDismiss) 后再弹快照
        pendingSnapshotRef.current = true;
        setIsLogsOpen(false);
      } else {
        setIsSnapshotModalOpen(true);
      }
    } catch (err) {
      console.warn('Camera snapshot error:', err);
      setIsCameraActive(false);
      setIsCameraReady(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSnapshotSubmit = async (userPrompt: string, imageUri: string) => {
    await sendSnapshotAndPromptToAI(imageUri, userPrompt);
  };

  const handleToggleMic = async () => {
    if (!micActiveRef.current) {
      // 期望状态先行，杜绝授权异步窗口内的重复触发
      micActiveRef.current = true;
      liveTranscriptRef.current = '';
      setIsMicActive(true);
      setLiveTranscript('正在开启原生听写，请说话...');
      const started = await NativeSpeech.start('zh-CN');
      if (!started) {
        // 启动失败（含授权窗口内被 stop 取消）：回滚状态
        micActiveRef.current = false;
        setIsMicActive(false);
        setLiveTranscript('语音识别启动失败：请检查麦克风权限，或在真机上测试（模拟器可能不支持中文语言包）');
      }
    } else {
      micActiveRef.current = false;
      setIsMicActive(false);
      await NativeSpeech.stop();
      // 从 ref 读取最新转录：await 期间到达的 final 事件不会丢失
      const finalTranscript = liveTranscriptRef.current;
      if (finalTranscript && !finalTranscript.includes('正在开启')) {
        handleAddNote(finalTranscript, 'VOICE');
      }
      liveTranscriptRef.current = '';
      setLiveTranscript('');
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

  const activeScenarioKey = SCENARIO_KEYS[scenarioIndex];
  const activeLocation = MOCK_LOCATIONS[scenarioIndex];
  const currentCard = SCENARIO_GENERATORS[activeScenarioKey](activeLocation);

  const [notes, setNotes] = useState<NoteItem[]>([]);

  // 启动时加载持久化笔记
  useEffect(() => {
    noteStore.getAll().then(setNotes);
  }, []);

  const handleNextScenario = () => {
    setScenarioIndex((prev) => (prev + 1) % SCENARIO_KEYS.length);
  };

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" />

      <CameraBackground isCameraActive={isCameraActive} cameraRef={cameraRef} onCameraReady={() => setIsCameraReady(true)}>
        <View style={styles.mainLayout}>
          {/* Top Header */}
          <View style={styles.topHeader}>
            <Text style={styles.brandTitle}>SCENEGO</Text>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, isMicActive ? styles.dotGreen : styles.dotGray]} />
              <Text style={styles.statusText}>{isMicActive ? 'LIVE' : 'IDLE'}</Text>
            </View>
          </View>

          {/* Processing Indicator */}
          {isProcessing && (
            <View style={styles.processingCard}>
              <ActivityIndicator size="small" color="#4fc3f7" />
              <Text style={styles.processingText}>
                {pluginManager.getActiveOcrId() === 'cloud-vlm'
                  ? '正在分析画面...'
                  : '正在识别场景...'}
              </Text>
            </View>
          )}

          {/* Live Speech Transcript Banner */}
          {isMicActive && (
            <View style={styles.liveTranscriptCard}>
              <View style={styles.liveHeaderRow}>
                <Text style={styles.liveBadge}>实时语音转录中</Text>
                <Animated.Text style={[styles.liveRecordingPulse, { opacity: pulseAnim }]}>
                  REC
                </Animated.Text>
              </View>
              <Text style={styles.liveTranscriptText}>
                {liveTranscript || '请说话，系统正在进行原生 0 延迟实时语音听写...'}
              </Text>
            </View>
          )}

          {/* Center Card */}
          <View style={styles.centerCardArea}>
            {isCardVisible ? (
              <FlashCardView
                card={currentCard}
                currentIndex={scenarioIndex}
                totalCards={SCENARIO_KEYS.length}
                onNextCard={handleNextScenario}
              />
            ) : (
              <View style={styles.hiddenCardContainer}>
                <Text style={styles.hiddenCardText}>CARD HIDDEN</Text>
              </View>
            )}
          </View>

          {/* Bottom Floating Control Bar */}
          <ControlBar
            isCameraActive={isCameraActive}
            isMicActive={isMicActive}
            isCardVisible={isCardVisible}
            onToggleCamera={handleToggleCamera}
            onCaptureFrame={handleCaptureFrame}
            onToggleMic={handleToggleMic}
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
      </CameraBackground>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: '#52525b',
  },
  statusText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
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
