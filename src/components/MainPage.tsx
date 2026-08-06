import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import * as Speech from 'expo-speech';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import { COLORS, FONT } from '../theme/tokens';
import { ActionCard, ActionCardData } from './ActionCard';
import { PresentationModal } from './PresentationModal';
import { InsightView, InsightData } from './InsightView';
import { expressionEngine } from '../core/expressionEngine';
import { speechController } from '../core/speechController';
import { countryController } from '../core/countryController';
import { NativeSpeech } from '../utils/NativeSpeech';
import { getLocationContext } from '../utils/locationContext';
import { getCountrySafety } from '../data/countrySafety';
import type { CardData } from '../core/types';
import type { SavedCountry } from '../utils/countryStore';
import type { UserProfile } from '../utils/userProfile';
import type { PlaceContext } from '../utils/locationContext';
import { CountrySelectModal } from './CountrySelectModal';
import { CountrySwitchPromptModal } from './CountrySwitchPromptModal';

/** Idle 快捷表达 chips（对齐 Open Design 原型）：点击走真实 generateCard */
const QUICK_EXPRESSIONS = ['我要去大皇宫，打表', '太贵了，便宜点'];

/** 推荐回复 3 组轮换（对齐原型 RECS_SETS，随对话推进切换） */
const RECS_SETS: ActionCardData[][] = [
  [
    { id: 'reply-3a', foreignText: 'กดมิเตอร์ได้ไหม', nativeText: '打表可以吗？' },
    { id: 'reply-3b', foreignText: 'แพงไป ลดหน่อยได้ไหม', nativeText: '太贵了，能便宜点吗？' },
    { id: 'reply-3c', foreignText: 'ฉันจะลงที่นี่', nativeText: '我在这里下车' },
  ],
  [
    { id: 'reply-3d', foreignText: 'รับแบงค์พันไหมครับ', nativeText: '收一千泰铢纸币吗？' },
    { id: 'reply-3e', foreignText: 'จอดข้างหน้าด้วยครับ', nativeText: '请在前面停车' },
    { id: 'reply-3f', foreignText: 'ช่วยขับช้าๆ หน่อยครับ', nativeText: '请开慢一点' },
  ],
  [
    { id: 'reply-3g', foreignText: 'มีใบเสร็จไหมครับ', nativeText: '能给收据吗？' },
    { id: 'reply-3h', foreignText: 'ขอบคุณมากครับ', nativeText: '非常感谢' },
    { id: 'reply-3i', foreignText: 'พรุ่งนี้มารับกี่โมงดีครับ', nativeText: '明天几点来接合适？' },
  ],
];

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

/**
 * recommendedPhrases 约定格式「当地语言短语 (中文翻译)」→ 上下结构横滑卡。
 * 无中文翻译的短语无法构成上下结构，不展示（避免误导）。
 */
function toPhraseCards(phrases: string[] | undefined): ActionCardData[] | undefined {
  if (!phrases || phrases.length === 0) return undefined;
  const cards: ActionCardData[] = [];
  for (const phrase of phrases.slice(0, 3)) {
    const m = phrase.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (!m) continue;
    cards.push({
      id: `phrase-${cards.length + 1}`,
      foreignText: m[1].trim(),
      nativeText: m[2].trim(),
      hasAudio: true,
    });
  }
  return cards.length > 0 ? cards : undefined;
}

export const MainPage: React.FC = () => {
  const [isCameraExpanded, setIsCameraExpanded] = useState(false);
  const [hasSubmittedInput, setHasSubmittedInput] = useState(false);
  const [activeInsight, setActiveInsight] = useState<InsightData | null>(null);
  const [isSnapProcessing, setIsSnapProcessing] = useState(false);

  const [actionCards, setActionCards] = useState<ActionCardData[]>([]);
  const [recsSetIdx, setRecsSetIdx] = useState(0);
  const [presentationCard, setPresentationCard] = useState<ActionCardData | null>(null);

  // 国家/位置（右上角「切换」与首次启动选择，业务在 countryController）
  const [currentCountry, setCurrentCountry] = useState<SavedCountry | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [detectedPlace, setDetectedPlace] = useState<PlaceContext | null>(null);
  const [isCountrySelectOpen, setIsCountrySelectOpen] = useState(false);
  const [switchPrompt, setSwitchPrompt] = useState<{ detectedName: string } | null>(null);

  const [inputText, setInputText] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // 相机权限：未授权且可再次询问时自动请求（对齐仓库既有相机权限模式；拒绝后不再空转重试）
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // 启动：加载缓存国家/档案 + GPS 检测；未设置国家则打开选择，位置变化则提示切换（业务在 countryController）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await countryController.init();
      if (cancelled) return;
      setUserProfile(result.profile);
      setDetectedPlace(result.place);
      if (!result.cached) {
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

  /** 确认国家（弹窗手动选择 = 目的地）：保存档案 + 缓存国家（业务在 countryController），目的地为权威 */
  const handleCountryConfirm = async (code: string, profile: UserProfile) => {
    setUserProfile(profile);
    const ok = await countryController.confirm(code, profile, detectedPlace?.city, true);
    setSwitchPrompt(null);
    setIsCountrySelectOpen(false);
    if (ok) {
      const s = getCountrySafety(code);
      if (s) setCurrentCountry({ code, nameZh: s.nameZh, savedAt: Date.now(), manual: true });
    }
  };

  /** GPS 检测到位置变化：跟随定位切换（保留自动检测能力，下次位置再变仍会提示） */
  const handleSwitchCountry = async () => {
    if (!switchPrompt || !detectedPlace?.countryCode) return;
    setSwitchPrompt(null);
    const ok = await countryController.switchTo(
      detectedPlace.countryCode,
      userProfile ?? { nationality: 'CN', language: 'zh-CN' },
      detectedPlace.city,
    );
    if (ok) {
      const s = getCountrySafety(detectedPlace.countryCode);
      if (s) setCurrentCountry({ code: s.code, nameZh: s.nameZh, savedAt: Date.now() });
    }
  };

  /** 保持当前国家（重放安全卡） */
  const handleKeepCountry = () => {
    if (!currentCountry) return;
    setSwitchPrompt(null);
    countryController.keep(currentCountry, detectedPlace?.city);
  };

  const appendCard = (card: ActionCardData) => {
    setActionCards((prev) => [...prev, card]);
    setHasSubmittedInput(true);
    setActiveInsight(null);
  };

  /** 打字/快捷表达 → 真实引擎生成表达卡（离线 SOP 优先，云端 VLM 兜底） */
  const handleSendText = async (preset?: string) => {
    const text = (preset ?? inputText).trim();
    if (!text || isThinking) return;
    setIsThinking(true);
    try {
      const locationCtx = await getLocationContext();
      const card = await expressionEngine.generateCard(text, locationCtx ?? undefined, 'zh-CN');
      if (card) {
        appendCard(toActionCard(card));
      } else {
        appendCard({
          id: `fallback-${Date.now()}`,
          foreignText: 'ไม่เข้าใจ ครับ/ค่ะ',
          nativeText: `未识别到明确表达需求：${text}`,
          hasAudio: true,
        });
      }
    } finally {
      setIsThinking(false);
      if (preset === undefined) setInputText('');
    }
  };

  /** PLAY → TTS 真实发声 */
  const handlePlayAudio = (card: ActionCardData) => {
    Speech.speak(card.foreignText, {
      language: card.languageCode ?? 'th-TH',
      pitch: 1.0,
      rate: 0.85,
    });
  };

  /** 语音：按住开始听写 */
  const startListening = async () => {
    if (!speechController.isSupported()) return;
    const res = await speechController.start('zh-CN');
    if (res.ok) {
      setIsMicOn(true);
      setLiveTranscript('');
    }
  };

  /** 语音：松开停止 → 真实转写 → 生成卡片 */
  const stopListening = async () => {
    if (!isMicOn) return;
    await NativeSpeech.stop();
    setIsMicOn(false);
    const text = liveTranscript.trim();
    setLiveTranscript('');
    if (!text) return;
    setIsThinking(true);
    try {
      const locationCtx = await getLocationContext();
      const card = await expressionEngine.generateCard(text, locationCtx ?? undefined, 'zh-CN');
      if (card) appendCard(toActionCard(card));
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    const sub = NativeSpeech.onSpeechResult((e) => {
      setLiveTranscript(e.transcript);
    });
    return () => sub.remove();
  }, []);

  /** 拍照 SNAP → 真实相机捕获 → expressionEngine.processImage 真实识别（模拟器走仓库既有测试图降级） */
  const handleSnap = async () => {
    if (isSnapProcessing) return;
    setIsSnapProcessing(true);
    try {
      let photoUri: string | null = null;
      if (Device.isDevice) {
        const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
        photoUri = photo?.uri ?? null;
      } else {
        // 模拟器无物理摄像头：走仓库既有测试图降级（真机绝不顶替用户照片）
        photoUri = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800';
      }
      if (!photoUri) throw new Error('camera-capture-failed');
      setIsCameraExpanded(false);
      const result = await expressionEngine.processImage(photoUri);
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
      setIsCameraExpanded(false);
      setHasSubmittedInput(true);
    } finally {
      setIsSnapProcessing(false);
    }
  };

  const handleSelectSuggestedReply = (reply: ActionCardData) => {
    appendCard({ ...reply, id: `reply-${Date.now()}`, hasAudio: true });
    setRecsSetIdx((i) => (i + 1) % RECS_SETS.length);
  };

  /** 回到首页：清空卡片流/Insight，复位 mic/输入/推荐轮换，返回 Idle（对齐原型 resetToHome） */
  const handleResetToHome = () => {
    if (isMicOn) {
      NativeSpeech.stop().catch(() => {});
    }
    setIsMicOn(false);
    setLiveTranscript('');
    setActionCards([]);
    setActiveInsight(null);
    setHasSubmittedInput(false);
    setInputText('');
    setRecsSetIdx(0);
    setIsCameraExpanded(false);
    setPresentationCard(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.brandText}>SCENEGO</Text>
        <TouchableOpacity style={styles.locationPill} onPress={() => setIsCountrySelectOpen(true)}>
          <Text style={styles.locationText}>
            {currentCountry
              ? (() => {
                  // 目的地（手动选择）为权威；城市仅在与目的地国家一致时展示，避免与定位混拼
                  const countryMatches =
                    !detectedPlace?.countryCode || detectedPlace.countryCode === currentCountry.code;
                  return countryMatches && detectedPlace?.city
                    ? `${currentCountry.nameZh} · ${detectedPlace.city}`
                    : currentCountry.nameZh;
                })()
              : '当前位置'}
          </Text>
          <Text style={styles.switchText}>切换 &gt;</Text>
        </TouchableOpacity>
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
              <Text style={styles.viewfinderSub}>相机权限未就绪，将使用模拟图识别</Text>
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
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.heroOrb, isMicOn && styles.heroOrbActive]}
                onPressIn={startListening}
                onPressOut={stopListening}
              >
                <Text style={styles.orbText}>{isMicOn ? '松开发送' : '按住说话'}</Text>
              </TouchableOpacity>
              <Text style={styles.orbHint}>
                {isMicOn ? liveTranscript || '正在聆听...' : '松开理解内容并生成卡片'}
              </Text>
              <View style={styles.chipRow}>
                {QUICK_EXPRESSIONS.map((label) => (
                  <TouchableOpacity
                    key={label}
                    style={styles.chip}
                    onPress={() => handleSendText(label)}
                  >
                    <Text style={styles.chipText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {(hasSubmittedInput || activeInsight) && (
            <View style={styles.streamContainer}>
              {activeInsight && (
                <InsightView
                  insight={activeInsight}
                  onPressCard={(c) => setPresentationCard(c)}
                  onResnap={() => setIsCameraExpanded(true)}
                  onManualInput={() => {
                    setActiveInsight(null);
                    setHasSubmittedInput(true);
                  }}
                />
              )}

              {actionCards.map((card) => (
                <ActionCard
                  key={card.id}
                  card={card}
                  onPressCard={(c) => setPresentationCard(c)}
                  onPlayAudio={handlePlayAudio}
                />
              ))}

              {isThinking && (
                <View style={styles.thinkingRow}>
                  <ActivityIndicator size="small" color={COLORS.accentBlue} />
                  <Text style={styles.thinkingText}>正在理解...</Text>
                </View>
              )}

              {/* Horizontal Suggested Replies */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestedScrollContent}
                style={styles.suggestedScroll}
              >
                {RECS_SETS[recsSetIdx].map((reply) => (
                  <ActionCard
                    key={reply.id}
                    card={reply}
                    width={220}
                    isOptionCard
                    onPressCard={handleSelectSuggestedReply}
                  />
                ))}
              </ScrollView>

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
                <TouchableOpacity onPress={() => setIsMicOn(!isMicOn)}>
                  <Text style={styles.micText}>{isMicOn ? 'mic ON' : 'mic OFF'}</Text>
                </TouchableOpacity>
                <View style={styles.micInputSubGroup}>
                  <TextInput
                    style={styles.micTextInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="打字补充说明..."
                    placeholderTextColor={COLORS.textTertiary}
                    onSubmitEditing={() => handleSendText()}
                  />
                  <TouchableOpacity style={styles.micSendBtn} onPress={() => handleSendText()}>
                    <Text style={styles.micSendArrow}>&gt;</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <CountrySelectModal
        visible={isCountrySelectOpen}
        detected={detectedPlace}
        currentCode={currentCountry?.code ?? null}
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
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161618',
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
  heroOrb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOrbActive: {
    backgroundColor: '#EF5350',
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipText: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  streamContainer: {
    gap: 12,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  thinkingText: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  suggestedScroll: {
    marginTop: 2,
  },
  suggestedScrollContent: {
    gap: 10,
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
  viewfinderSub: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.textTertiary,
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
