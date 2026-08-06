import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import * as Speech from 'expo-speech';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import { COLORS, FONT } from '../theme/tokens';
import { ActionCard, ActionCardData } from './ActionCard';
import { PresentationModal } from './PresentationModal';
import { InsightView, InsightData } from './InsightView';
import { SettingsSheet } from './SettingsSheet';
import { expressionEngine } from '../core/expressionEngine';
import { speechController } from '../core/speechController';
import { NativeSpeech } from '../utils/NativeSpeech';
import { getOpenRouterApiKey, setOpenRouterApiKey, clearOpenRouterApiKey } from '../utils/SecureConfig';
import { loadAppSettings, saveAppSettings, AppSettings, DEFAULT_APP_SETTINGS } from '../utils/appSettings';
import { toPhraseCards } from '../utils/cardPhrases';
import type { CardData } from '../core/types';

/** CardData → 卡片模型（上下结构 + 可播放） */
function toActionCard(card: CardData): ActionCardData {
  return {
    id: card.id,
    foreignText: card.targetText,
    nativeText: card.subText || card.title,
    hasAudio: true,
    languageCode: card.languageCode,
  };
}

interface StreamErrorItem {
  id: number;
  type: 'error';
  text: string;
  retry: () => void;
  /** AI 失败时用户可「直接输出」：输入原文原样成卡 */
  directOutput?: () => void;
}

type StreamItem = { id: number; type: 'sys'; text: string } | StreamErrorItem;

export const MainPage: React.FC = () => {
  const [isCameraExpanded, setIsCameraExpanded] = useState(false);
  const [hasSubmittedInput, setHasSubmittedInput] = useState(false);
  const [activeInsight, setActiveInsight] = useState<InsightData | null>(null);
  const [isSnapProcessing, setIsSnapProcessing] = useState(false);

  const [actionCards, setActionCards] = useState<ActionCardData[]>([]);
  const [streamItems, setStreamItems] = useState<StreamItem[]>([]);
  const [presentationCard, setPresentationCard] = useState<ActionCardData | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const [inputText, setInputText] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // 设置（目的地国家/地区 + 目标语言 + 模型 + Key 状态）
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  // Orb 按住说话：上滑取消 + 麦克风错误提示
  const [orbCancel, setOrbCancel] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const seqRef = useRef(0);
  const micOnRef = useRef(false);
  const thinkingRef = useRef(false);
  const liveTranscriptRef = useRef('');
  const lastPhotoRef = useRef<string | null>(null);
  const holdErrorTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 相机权限：未授权且可再次询问时自动请求（拒绝后由权限层提供重试）
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // 启动：加载设置（目的地/语言/模型）+ API Key 状态
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await loadAppSettings();
      const key = await getOpenRouterApiKey().catch(() => '');
      if (cancelled) return;
      setSettings(s);
      setHasKey(!!key);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    micOnRef.current = isMicOn;
  }, [isMicOn]);

  useEffect(() => {
    thinkingRef.current = isThinking;
  }, [isThinking]);

  const appendCard = (card: ActionCardData) => {
    setActionCards((prev) => [...prev, card]);
    setHasSubmittedInput(true);
    setActiveInsight(null);
  };

  const appendSys = (text: string) => {
    setStreamItems((prev) => [...prev, { id: ++seqRef.current, type: 'sys', text }]);
  };

  const appendError = (text: string, retry: () => void, directOutput?: () => void) => {
    setStreamItems((prev) => [...prev, { id: ++seqRef.current, type: 'error', text, retry, directOutput }]);
  };

  /** 用户直接输出：输入原文原样成卡（AI 不可用时的最后手段） */
  const directOutputCard = (text: string) => {
    appendCard({
      id: `manual-${Date.now()}`,
      foreignText: text,
      nativeText: text,
      hasAudio: true,
    });
  };

  /** 文本成卡核心：打字/语音转录 → AI 翻译成目标语言；失败 → 错误行（重试 / 直接输出） */
  const submitText = async (text: string) => {
    const v = text.trim();
    if (!v || thinkingRef.current) return;
    setIsThinking(true);
    try {
      const card = await expressionEngine.generateCard(v, settings.countryZh);
      if (card) {
        appendCard(toActionCard(card));
      } else {
        appendError('AI 暂时无法生成卡片，请重试或直接输出', () => submitText(v), () => directOutputCard(v));
      }
    } catch (err) {
      console.warn('[Card Error]:', err);
      appendError('网络或服务暂时不可用', () => submitText(v), () => directOutputCard(v));
    } finally {
      setIsThinking(false);
    }
  };

  const handleSendText = () => {
    const text = inputText.trim();
    setInputText('');
    submitText(text);
  };

  /** PLAY/STOP 切换：播放中点击停止，播放结束自动复位 */
  const handlePlayAudio = (card: ActionCardData) => {
    if (playingId === card.id) {
      Speech.stop();
      setPlayingId(null);
      return;
    }
    Speech.stop();
    setPlayingId(card.id);
    Speech.speak(card.foreignText, {
      language: card.languageCode ?? 'th-TH',
      pitch: 1.0,
      rate: 0.85,
      onDone: () => setPlayingId(null),
      onStopped: () => setPlayingId(null),
      onError: () => setPlayingId(null),
    });
  };

  const showHoldError = (msg: string) => {
    setHoldError(msg);
    if (holdErrorTimerRef.current) clearTimeout(holdErrorTimerRef.current);
    holdErrorTimerRef.current = setTimeout(() => setHoldError(null), 2600);
  };

  /** Orb 按住说话：自己说话（中文听写）→ 松开发送 → AI 翻译成卡 */
  const startListening = async () => {
    const res = await speechController.start('zh-CN');
    if (res.ok) {
      setIsMicOn(true);
      micOnRef.current = true;
      setLiveTranscript('');
      liveTranscriptRef.current = '';
    } else {
      showHoldError('无法使用麦克风 · 请在系统设置中允许');
    }
  };

  const cancelListening = async () => {
    if (!micOnRef.current) return;
    await NativeSpeech.stop().catch(() => {});
    micOnRef.current = false;
    setIsMicOn(false);
    setLiveTranscript('');
    liveTranscriptRef.current = '';
  };

  const stopListening = async () => {
    if (!micOnRef.current) return;
    await NativeSpeech.stop().catch(() => {});
    micOnRef.current = false;
    setIsMicOn(false);
    const text = liveTranscriptRef.current.trim();
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    if (text) submitText(text);
  };

  useEffect(() => {
    const sub = NativeSpeech.onSpeechResult((e) => {
      liveTranscriptRef.current = e.transcript;
      setLiveTranscript(e.transcript);
    });
    return () => sub.remove();
  }, []);

  /** 按住说话 Orb：PanResponder 实现「上滑取消 / 松开发送」 */
  const orbPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          if (micOnRef.current || thinkingRef.current) return;
          startListening();
        },
        onPanResponderMove: (_evt, g) => {
          const cancel = g.dy < -70;
          setOrbCancel((prev) => (prev === cancel ? prev : cancel));
        },
        onPanResponderRelease: (_evt, g) => {
          setOrbCancel(false);
          if (g.dy < -70) cancelListening();
          else stopListening();
        },
        onPanResponderTerminate: () => {
          setOrbCancel(false);
          cancelListening();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /** 聆听对方：转录文本 → 一张合并回复卡（外语回复上 / 母语译文下） */
  const replyFromUtterance = async (text: string) => {
    setIsThinking(true);
    try {
      const card = await expressionEngine.replyToUtterance(text, settings.countryZh);
      if (card) {
        appendCard(toActionCard(card));
      } else {
        appendError('AI 暂时无法生成回复卡，请重试或直接输出', () => replyFromUtterance(text), () => directOutputCard(text));
      }
    } catch (err) {
      console.warn('[Reply Card Error]:', err);
      appendError('网络或服务暂时不可用', () => replyFromUtterance(text), () => directOutputCard(text));
    } finally {
      setIsThinking(false);
    }
  };

  /** mic ON/OFF：ON = 以目标语言持续聆听对方；OFF = 转录 → 合并回复卡 */
  const onMicToggle = async () => {
    if (micOnRef.current) {
      await NativeSpeech.stop().catch(() => {});
      micOnRef.current = false;
      setIsMicOn(false);
      const text = liveTranscriptRef.current.trim();
      setLiveTranscript('');
      liveTranscriptRef.current = '';
      if (text) replyFromUtterance(text);
      return;
    }
    const res = await speechController.start(settings.targetLangCode);
    if (res.ok) {
      setIsMicOn(true);
      micOnRef.current = true;
      setLiveTranscript('');
      liveTranscriptRef.current = '';
    } else {
      showHoldError('无法使用麦克风 · 请在系统设置中允许');
    }
  };

  /** 拍照 SNAP → 真实相机捕获 → processImage（模拟器走测试图降级；目的地作为位置上下文） */
  const processInsight = async (photoUri: string) => {
    setIsSnapProcessing(true);
    try {
      const result = await expressionEngine.processImage(photoUri, settings.countryZh);
      // 已配置 Key 但云端识别失败（网络/鉴权）：按「识别失败，请重试」展示；未配置 Key 走本地词库兜底
      if (result.ocrIssue && hasKey) {
        setActiveInsight({
          id: `insight-${Date.now()}`,
          isError: true,
          errorMessage: '识别失败，请重试',
          mainCard: { id: 'insight-error', foreignText: '', nativeText: '', hasAudio: false },
        });
        setHasSubmittedInput(true);
        return;
      }
      setActiveInsight({
        id: `insight-${Date.now()}`,
        imageUri: photoUri,
        mainCard: toActionCard(result.card),
        phraseCards: toPhraseCards(result.scenario.recommendedPhrases),
      });
      setHasSubmittedInput(true);
    } catch (err) {
      console.warn('[Snap] 拍照识别失败:', err);
      setActiveInsight({
        id: `insight-${Date.now()}`,
        isError: true,
        errorMessage: '照片识别失败，请重新拍摄或手动输入',
        mainCard: { id: 'insight-error', foreignText: '', nativeText: '', hasAudio: false },
      });
      setHasSubmittedInput(true);
    } finally {
      setIsSnapProcessing(false);
    }
  };

  const handleSnap = async () => {
    if (isSnapProcessing) return;
    try {
      let photoUri: string | null = null;
      if (Device.isDevice) {
        const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
        photoUri = photo?.uri ?? null;
      } else {
        // 模拟器无物理摄像头：仓库既有测试图降级（开发用，非产品内容）
        photoUri = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800';
      }
      if (!photoUri) throw new Error('camera-capture-failed');
      lastPhotoRef.current = photoUri;
      setIsCameraExpanded(false);
      await processInsight(photoUri);
    } catch (err) {
      console.warn('[Snap] 拍照失败:', err);
      setActiveInsight({
        id: `insight-${Date.now()}`,
        isError: true,
        errorMessage: '照片识别失败，请重新拍摄或手动输入',
        mainCard: { id: 'insight-error', foreignText: '', nativeText: '', hasAudio: false },
      });
      setIsCameraExpanded(false);
      setHasSubmittedInput(true);
    }
  };

  /** 回到首页：清空卡片流/Insight，复位 mic/输入，返回 Idle */
  const handleResetToHome = () => {
    if (micOnRef.current) {
      NativeSpeech.stop().catch(() => {});
    }
    micOnRef.current = false;
    setIsMicOn(false);
    setLiveTranscript('');
    setHoldError(null);
    if (holdErrorTimerRef.current) clearTimeout(holdErrorTimerRef.current);
    setActionCards([]);
    setStreamItems([]);
    setActiveInsight(null);
    setHasSubmittedInput(false);
    setInputText('');
    setIsCameraExpanded(false);
    setPresentationCard(null);
    Speech.stop();
    setPlayingId(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  /** 设置保存：Key 入 Keychain，目的地/语言/模型持久化 */
  const handleSaveSettings = async (key: string, s: AppSettings) => {
    if (key) await setOpenRouterApiKey(key);
    else await clearOpenRouterApiKey();
    await saveAppSettings(s);
    setSettings(s);
    setHasKey(!!key);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header：目的地胶囊 + 设置入口 */}
      <View style={styles.headerRow}>
        <Text style={styles.brandText}>SCENEGO</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.locationPill}
            onPress={() => setSettingsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="打开设置"
          >
            <Text style={styles.locationText}>
              {settings.countryZh} · {settings.targetLang}
            </Text>
            <Text style={styles.switchText}>设置</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.gearBtn}
            onPress={() => setSettingsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="打开设置"
          >
            <Text style={styles.gearBtnText}>设置</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area (flex:1) */}
      {isCameraExpanded ? (
        <View style={styles.inlineCameraWrap}>
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraHeaderGuide}>对准菜单 / 标牌 / 告示</Text>
            <TouchableOpacity onPress={() => setIsCameraExpanded(false)}>
              <Text style={styles.cameraCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.viewfinder}>
            {permission?.granted ? (
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                facing="back"
              >
                <View style={styles.viewfinderShade} />
                <View style={styles.viewfinderCorners} pointerEvents="none">
                  <Text style={styles.viewfinderHint}>对齐画面中的文字区域</Text>
                </View>
              </CameraView>
            ) : (
              <View style={styles.camPerm}>
                <Text style={styles.camPermTitle}>无法访问相机</Text>
                <Text style={styles.camPermDesc}>
                  {permission?.canAskAgain
                    ? '请在系统设置中允许 SceneGo 使用相机后重试。'
                    : '相机权限已被拒绝，请在系统设置中开启后重试。'}
                </Text>
                <View style={styles.camPermActions}>
                  <TouchableOpacity
                    style={styles.camPermPrimary}
                    onPress={() => requestPermission()}
                    accessibilityRole="button"
                  >
                    <Text style={styles.camPermPrimaryText}>重试</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
          <View style={styles.snapRow}>
            <TouchableOpacity
              style={styles.shutterBtn}
              onPress={handleSnap}
              disabled={isSnapProcessing}
            >
              <Text style={styles.shutterBtnText}>{isSnapProcessing ? '处理中' : 'SNAP'}</Text>
            </TouchableOpacity>
            <Text style={styles.snapCaption}>轻点拍照 · 自动发送识别</Text>
          </View>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {!hasSubmittedInput && !activeInsight && (
            <View style={styles.heroCenter}>
              {(isMicOn || holdError) && (
                <View style={styles.recBubbleWrap}>
                  <View style={styles.recBubble}>
                    <Text style={[styles.recBadge, holdError && styles.recBadgeErr]}>
                      {holdError ? '!' : 'REC'}
                    </Text>
                    <Text style={[styles.recText, holdError && styles.recTextErr]} numberOfLines={2}>
                      {holdError ?? liveTranscript}
                    </Text>
                  </View>
                </View>
              )}
              <View
                style={[
                  styles.heroOrb,
                  isMicOn && styles.heroOrbActive,
                  orbCancel && styles.heroOrbCancel,
                ]}
                {...orbPanResponder.panHandlers}
                accessible
                accessibilityRole="button"
                accessibilityLabel="按住说话"
              >
                <Text style={styles.orbText}>
                  {isMicOn ? (orbCancel ? '松开取消' : '松开发送') : '按住说话'}
                </Text>
              </View>
              <Text style={styles.orbHint}>
                {isMicOn
                  ? liveTranscript || '正在聆听...'
                  : '按住说出需求 · 上滑取消，松开发送'}
              </Text>
            </View>
          )}

          {(hasSubmittedInput || activeInsight) && (
            <View style={styles.streamContainer}>
              {activeInsight && (
                <InsightView
                  insight={activeInsight}
                  onPressCard={(c) => setPresentationCard(c)}
                  onPlayAudio={handlePlayAudio}
                  playing={playingId === 'insight-main'}
                  onResnap={() => setIsCameraExpanded(true)}
                  onManualInput={() => {
                    setActiveInsight(null);
                    setHasSubmittedInput(true);
                  }}
                  onRetry={
                    activeInsight.isError && lastPhotoRef.current
                      ? () => processInsight(lastPhotoRef.current!)
                      : undefined
                  }
                />
              )}

              {actionCards.map((card) => (
                <ActionCard
                  key={card.id}
                  card={card}
                  onPressCard={(c) => setPresentationCard(c)}
                  onPlayAudio={handlePlayAudio}
                  playing={playingId === card.id}
                />
              ))}

              {streamItems.map((item) => {
                if (item.type === 'sys') {
                  return (
                    <Text key={item.id} style={styles.sysLine}>
                      {item.text}
                    </Text>
                  );
                }
                return (
                  <View key={item.id} style={styles.errLine}>
                    <Text style={styles.errLineText}>{item.text}</Text>
                    <View style={styles.errActions}>
                      <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={item.retry}
                        accessibilityRole="button"
                      >
                        <Text style={styles.retryBtnText}>重试</Text>
                      </TouchableOpacity>
                      {item.directOutput && (
                        <TouchableOpacity
                          style={styles.retryBtn}
                          onPress={item.directOutput}
                          accessibilityRole="button"
                        >
                          <Text style={styles.retryBtnText}>直接输出</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}

              {isThinking && (
                <View style={styles.thinkingRow}>
                  <ActivityIndicator size="small" color={COLORS.accentBlue} />
                  <Text style={styles.thinkingText}>正在理解...</Text>
                </View>
              )}

              {/* 聆听对方：mic ON 时实时转写展示 */}
              {isMicOn && (
                <View style={styles.thinkingRow}>
                  <ActivityIndicator size="small" color={COLORS.accentGreen} />
                  <Text style={styles.thinkingText} numberOfLines={3}>
                    正在听对方说话… {liveTranscript}
                  </Text>
                </View>
              )}

              {/* Mic & Text Bar */}
              <View style={styles.micBar}>
                <TouchableOpacity
                  style={styles.homeBtn}
                  onPress={handleResetToHome}
                  accessibilityRole="button"
                  accessibilityLabel="回到首页"
                >
                  <Text style={styles.homeBtnText}>首页</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onMicToggle}>
                  <Text style={styles.micText}>{isMicOn ? 'mic ON' : 'mic OFF'}</Text>
                </TouchableOpacity>
                <View style={styles.micInputSubGroup}>
                  <TextInput
                    style={styles.micTextInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="打字补充说明..."
                    placeholderTextColor={COLORS.textTertiary}
                    onSubmitEditing={handleSendText}
                  />
                  <TouchableOpacity style={styles.micSendBtn} onPress={handleSendText}>
                    <Text style={styles.micSendArrow}>&gt;</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <SettingsSheet
        visible={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      <PresentationModal
        visible={!!presentationCard}
        card={presentationCard}
        onClose={() => setPresentationCard(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  brandText: {
    fontFamily: FONT.monoBold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161618',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  locationText: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  switchText: {
    fontFamily: FONT.regular,
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  gearBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearBtnText: {
    fontFamily: FONT.regular,
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  heroCenter: {
    flex: 1,
    minHeight: 360,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  recBubbleWrap: {
    alignSelf: 'center',
    maxWidth: 300,
  },
  recBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(24,24,27,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(79,195,247,0.4)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  recBadge: {
    fontFamily: FONT.monoBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: COLORS.accentRed,
  },
  recBadgeErr: {
    color: '#f4706c',
  },
  recText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  recTextErr: {
    color: '#f4706c',
  },
  heroOrb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(37,99,235,0.5)',
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  heroOrbActive: {
    backgroundColor: '#EF5350',
    shadowColor: 'rgba(239,83,80,0.5)',
  },
  heroOrbCancel: {
    backgroundColor: '#EF5350',
    opacity: 0.75,
    shadowColor: 'rgba(239,83,80,0.7)',
  },
  orbText: {
    fontFamily: FONT.bold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  orbHint: {
    fontFamily: FONT.regular,
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  streamContainer: {
    gap: 12,
  },
  sysLine: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textSecondary,
    paddingHorizontal: 14,
    lineHeight: 18,
  },
  errLine: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  errLineText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#f4706c',
    paddingHorizontal: 14,
    lineHeight: 18,
  },
  errActions: {
    flexDirection: 'row',
    gap: 10,
  },
  retryBtn: {
    backgroundColor: '#252528',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryBtnText: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  thinkingText: {
    flex: 1,
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  micBar: {
    backgroundColor: '#161618',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
  },
  homeBtn: {
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  homeBtnText: {
    fontFamily: FONT.monoBold,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  micText: {
    fontFamily: FONT.monoBold,
    fontSize: 12,
    color: COLORS.accentGreen,
  },
  micInputSubGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'flex-end',
  },
  micTextInput: {
    flex: 1,
    fontFamily: FONT.regular,
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'right',
  },
  micSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micSendArrow: {
    fontFamily: FONT.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  inlineCameraWrap: {
    flex: 1,
    backgroundColor: '#09090B',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    gap: 16,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraHeaderGuide: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    color: COLORS.accentYellow,
  },
  cameraCancelText: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  viewfinder: {
    flex: 1,
    backgroundColor: '#161618',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  viewfinderShade: {
    ...StyleSheet.absoluteFillObject,
  },
  viewfinderCorners: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  viewfinderHint: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    fontSize: 12,
    color: '#FFFFFF',
    overflow: 'hidden',
  },
  camPerm: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 30,
    backgroundColor: 'rgba(5,5,7,0.92)',
  },
  camPermTitle: {
    fontFamily: FONT.bold,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  camPermDesc: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 19,
  },
  camPermActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  camPermPrimary: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  camPermPrimaryText: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  snapRow: {
    alignItems: 'center',
    gap: 8,
  },
  snapCaption: {
    fontFamily: FONT.regular,
    fontSize: 10,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  shutterBtn: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accentRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterBtnText: {
    fontFamily: FONT.monoBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
