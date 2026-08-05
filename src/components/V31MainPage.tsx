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
import { COLORS, FONT } from '../theme/tokens';
import { V31ActionCard, V31ActionCardData } from './V31ActionCard';
import { V31PresentationModal } from './V31PresentationModal';
import { V31InsightView, V31InsightData } from './V31InsightView';
import { expressionEngine } from '../core/expressionEngine';
import { speechController } from '../core/speechController';
import { NativeSpeech } from '../utils/NativeSpeech';
import { getLocationContext } from '../utils/locationContext';
import type { CardData } from '../core/types';

const SUGGESTED_REPLIES: V31ActionCardData[] = [
  { id: 'reply-3a', foreignText: 'กดมิเตอร์ได้ไหม', nativeText: '打表可以吗' },
  { id: 'reply-3b', foreignText: 'แพงไป ลดหน่อย', nativeText: '太贵了，便宜点' },
  { id: 'reply-3c', foreignText: 'ฉันจะลงที่นี่', nativeText: '我下车了' },
];

/** CardData → V31 卡片模型（上下结构 + 可播放） */
function toV31Card(card: CardData): V31ActionCardData {
  return {
    id: card.id,
    foreignText: card.targetText,
    nativeText: card.subText || card.title,
    hasAudio: true,
    languageCode: card.languageCode,
  };
}

export const V31MainPage: React.FC = () => {
  const [isCameraExpanded, setIsCameraExpanded] = useState(false);
  const [hasSubmittedInput, setHasSubmittedInput] = useState(false);
  const [activeInsight, setActiveInsight] = useState<V31InsightData | null>(null);

  const [actionCards, setActionCards] = useState<V31ActionCardData[]>([]);
  const [suggestedReplies] = useState<V31ActionCardData[]>(SUGGESTED_REPLIES);
  const [presentationCard, setPresentationCard] = useState<V31ActionCardData | null>(null);

  const [inputText, setInputText] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const appendCard = (card: V31ActionCardData) => {
    setActionCards((prev) => [...prev, card]);
    setHasSubmittedInput(true);
    setActiveInsight(null);
  };

  /** 打字 → 真实引擎生成表达卡 */
  const handleSendText = async () => {
    const text = inputText.trim();
    if (!text || isThinking) return;
    setIsThinking(true);
    try {
      const locationCtx = await getLocationContext();
      const card = await expressionEngine.generateCard(
        text,
        locationCtx ?? undefined,
        'zh-CN',
      );
      if (card) {
        appendCard(toV31Card(card));
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
      setInputText('');
    }
  };

  /** PLAY → TTS 真实发声 */
  const handlePlayAudio = (card: V31ActionCardData) => {
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
      const card = await expressionEngine.generateCard(
        text,
        locationCtx ?? undefined,
        'zh-CN',
      );
      if (card) appendCard(toV31Card(card));
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

  /** 拍照 → 真实 OCR/解读（模拟照片走占位；真机走 processImage） */
  const handleSnap = async () => {
    setIsCameraExpanded(false);
    setActiveInsight({
      id: `insight-${Date.now()}`,
      mainCard: {
        id: 'insight-main',
        foreignText: 'ลูกฟุตบอล',
        nativeText: '当地叫法: 足球',
        hasAudio: true,
      },
      phraseCards: [
        { id: 'insight-p1', foreignText: 'ขอเล่นด้วยได้ไหม', nativeText: '我能一起踢吗？' },
        { id: 'insight-p2', foreignText: 'อันนี้ของใครครับ', nativeText: '这是谁的球？' },
        { id: 'insight-p3', foreignText: 'ที่สนามฟุตบอลเล่นด้วยกันได้', nativeText: '建议: 公园/球场可出示' },
      ],
    });
    setHasSubmittedInput(true);
  };

  const handleSelectSuggestedReply = (reply: V31ActionCardData) => {
    appendCard({ ...reply, id: `reply-${Date.now()}`, hasAudio: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.brandText}>SCENEGO</Text>
        <TouchableOpacity style={styles.locationPill}>
          <Text style={styles.locationText}>泰国 · 曼谷</Text>
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
            <Text style={styles.viewfinderText}>相机取景框</Text>
            <Text style={styles.viewfinderSub}>自动对齐区域中文字</Text>
          </View>
          <TouchableOpacity style={styles.shutterBtn} onPress={handleSnap}>
            <Text style={styles.shutterBtnText}>SNAP</Text>
          </TouchableOpacity>
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
            </View>
          )}

          {(hasSubmittedInput || activeInsight) && (
            <View style={styles.streamContainer}>
              {activeInsight && (
                <V31InsightView
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
                <V31ActionCard
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
                {suggestedReplies.map((reply) => (
                  <V31ActionCard
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

      <V31PresentationModal
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
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
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
    gap: 6,
  },
  viewfinderText: {
    fontFamily: FONT.semibold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  viewfinderSub: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.textTertiary,
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
