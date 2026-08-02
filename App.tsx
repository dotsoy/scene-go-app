import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import { pluginManager, ScenarioResult } from './src/plugins';
import { CameraBackground } from './src/components/CameraBackground';
import { FlashCardView, CardData } from './src/components/FlashCardView';
import { ControlBar } from './src/components/ControlBar';
import { QuickNotesModal, NoteItem } from './src/components/QuickNotesModal';
import { SnapshotDialogModal } from './src/components/SnapshotDialogModal';
import { PluginSelectorModal } from './src/components/PluginSelectorModal';
import { ApiLogModal } from './src/components/ApiLogModal';
import { NativeSpeech } from './src/utils/NativeSpeech';
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
    english: '请使用计价器按标准费率打表',
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
    english: '请确保菜品无花生及花生制品',
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
    english: '请开具官方退税凭证与表格',
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
    english: '紧急联系电话：旅游警察专线 1155',
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

  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState<boolean>(false);
  const [pendingSnapshotUri, setPendingSnapshotUri] = useState<string | null>(null);
  const [activeScenarioResult, setActiveScenarioResult] = useState<ScenarioResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [scenarioIndex, setScenarioIndex] = useState<number>(0);
  const cameraRef = useRef<unknown>(null);
  // 最新转录文本的 ref 副本：避免 async 回调读取到过期的闭包 state
  const liveTranscriptRef = useRef<string>('');

  // 绑定原生 iOS SFSpeechRecognizer 听写监听
  useEffect(() => {
    const sub = NativeSpeech.onSpeechResult((e) => {
      if (e.transcript) {
        liveTranscriptRef.current = e.transcript;
        setLiveTranscript(e.transcript);
      }
    });
    return () => {
      sub.remove();
    };
  }, []);

  /** 云端 VLM 多轮追问：用户基于快照照片提出具体问题 */
  const sendSnapshotAndPromptToAI = async (imageUri: string, userPrompt: string) => {
    setIsProcessing(true);
    try {
      const cloudVlm = pluginManager.getCloudVlmPlugin();
      const reply = await cloudVlm.askFollowUp(imageUri, userPrompt);

      setActiveScenarioResult((prev) =>
        prev
          ? {
              ...prev,
              translatedText: reply,
              tips: [],
              recommendedPhrases: [],
            }
          : {
              title: '追问回答',
              category: 'FOLLOW_UP',
              originalText: userPrompt,
              translatedText: reply,
              tips: [],
              recommendedPhrases: [],
            },
      );
    } catch (err) {
      console.warn('[AI Follow-up Error]:', err);
    } finally {
      setIsProcessing(false);
    }
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
      setIsSnapshotModalOpen(true);
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
    if (!isMicActive) {
      liveTranscriptRef.current = '';
      setIsMicActive(true);
      setLiveTranscript('正在开启原生听写，请说话...');
      await NativeSpeech.start('zh-CN');
    } else {
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

  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: 'n1',
      content: '曼谷酒店 Wi-Fi 密码: BKK2026',
      category: 'TRIP',
      timestamp: '14:20',
    },
    {
      id: 'n2',
      content: '退税单号记录: TX-984210',
      category: 'TAX',
      timestamp: '16:05',
    },
  ]);

  const handleNextScenario = () => {
    setScenarioIndex((prev) => (prev + 1) % SCENARIO_KEYS.length);
  };

  const handleAddNote = (content: string, category: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newEntry: NoteItem = {
      id: Date.now().toString(),
      content,
      category,
      timestamp: timeStr,
    };
    setNotes([newEntry, ...notes]);
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
                  ? '☁️ 云端视觉大模型分析中...'
                  : '📱 本地场景识别中...'}
              </Text>
            </View>
          )}

          {/* Live Speech Transcript Banner */}
          {isMicActive && (
            <View style={styles.liveTranscriptCard}>
              <View style={styles.liveHeaderRow}>
                <Text style={styles.liveBadge}>🎙️ 实时语音转录中</Text>
                <Text style={styles.liveRecordingPulse}>● REC</Text>
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
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenLogs={() => setIsLogsOpen(true)}
          />
        </View>

        <QuickNotesModal
          visible={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
          notes={notes}
          onAddNote={handleAddNote}
        />

        <SnapshotDialogModal
          visible={isSnapshotModalOpen}
          imageUri={pendingSnapshotUri}
          scenarioResult={activeScenarioResult}
          onClose={() => setIsSnapshotModalOpen(false)}
          onSubmit={handleSnapshotSubmit}
        />

        <PluginSelectorModal
          visible={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        <ApiLogModal
          visible={isLogsOpen}
          onClose={() => setIsLogsOpen(false)}
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
