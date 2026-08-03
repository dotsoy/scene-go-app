import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, GestureResponderEvent } from 'react-native';
import * as Speech from 'expo-speech';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { COLORS, FONT } from '../theme/tokens';
import { CardData } from '../core/types';

export type { CardData } from '../core/types';

interface FlashCardViewProps {
  card: CardData;
  currentIndex: number;
  totalCards: number;
  onNextCard: () => void;
  /** LOCAL PROTOCOL 框内可选操作入口（如安全卡的「安全信息」/ 普通卡「AI 解读」） */
  tipActionLabel?: string;
  onTipAction?: () => void;
  /** 全屏模式关闭（✕） */
  onClose?: () => void;
}

export const FlashCardView: React.FC<FlashCardViewProps> = ({
  card,
  currentIndex,
  totalCards,
  onNextCard,
  tipActionLabel,
  onTipAction,
  onClose,
}) => {
  const handlePlayAudio = (e: GestureResponderEvent) => {
    e.stopPropagation();
    Speech.speak(card.targetText, {
      language: card.languageCode,
      pitch: 1.0,
      rate: 0.85,
    });
  };

  // 整卡截图分享：截图对象为卡片容器（含大字展示 + 本地提示），生成 PNG 后调系统分享
  const cardRef = useRef<View>(null);
  const handleShare = async (e: GestureResponderEvent) => {
    e.stopPropagation();
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 0.9 });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `分享表达卡：${card.title}`,
        UTI: 'public.png',
      });
    } catch (err) {
      console.warn('[Share] 表达卡分享失败:', err);
    }
  };

  const formattedProgress = `${(currentIndex + 1).toString().padStart(2, '0')} / ${totalCards.toString().padStart(2, '0')}`;

  return (
    <View ref={cardRef} collapsable={false} style={styles.cardContainer}>
      {/* TopRow：关闭 + 分类 + 位置 + 进度 */}
      <View style={styles.topRow}>
        {onClose ? (
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={8} activeOpacity={0.7}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{card.categoryTag.toUpperCase()}</Text>
        </View>
        <Text style={styles.locationText} numberOfLines={1}>
          {card.locationName}
        </Text>
        <View style={styles.topSpacer} />
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>{formattedProgress}</Text>
        </View>
      </View>

      <View style={styles.bigWrap}>
        {/* 高对比大字核心展示区 */}
        <View style={styles.bigArea}>
          <Text style={styles.targetText}>{card.targetText}</Text>
          {card.phonetic ? <Text style={styles.phoneticText}>{card.phonetic}</Text> : null}
          {card.subText ? <Text style={styles.supplementText}>{card.subText}</Text> : null}
        </View>

        {/* 操作行：PLAY AUDIO + AI 解读 + NEXT CARD */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.playBtn} onPress={handlePlayAudio} activeOpacity={0.75}>
            <Text style={styles.playBtnText}>▶ PLAY AUDIO</Text>
          </TouchableOpacity>
          {tipActionLabel && onTipAction ? (
            <TouchableOpacity style={styles.aiBtn} onPress={onTipAction} activeOpacity={0.75}>
              <Text style={styles.aiBtnText}>{tipActionLabel}</Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.actionSpacer} />
          <TouchableOpacity style={styles.nextBtn} onPress={onNextCard} activeOpacity={0.7}>
            <Text style={styles.nextBtnText}>NEXT CARD →</Text>
          </TouchableOpacity>
        </View>

        {/* LOCAL PROTOCOL */}
        <View style={styles.protoWrap}>
          <Text style={styles.protoHead}>LOCAL PROTOCOL</Text>
          <View style={styles.protoBox}>
            <Text style={styles.protoBody}>{card.localTip}</Text>
            {card.tips && card.tips.length > 0 && (
              <View style={styles.tipList}>
                {card.tips.map((tip, idx) => (
                  <View key={idx} style={styles.tipRow}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipRowText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
        <Text style={styles.swipeHint}>点击 ✕ 返回 · 下滑关闭</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgCardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  topSpacer: {
    flex: 1,
  },
  actionSpacer: {
    flex: 1,
  },
  bigWrap: {
    gap: 12,
  },
  categoryPill: {
    backgroundColor: COLORS.bgCardLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontFamily: FONT.bold,
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
  },
  locationText: {
    fontFamily: FONT.regular,
    color: COLORS.textTertiary,
    fontSize: 12,
    flexShrink: 1,
  },
  progressPill: {
    backgroundColor: COLORS.bgCardLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontFamily: FONT.monoBold,
    color: COLORS.accentYellow,
    fontSize: 12,
    letterSpacing: 1,
  },
  bigArea: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  targetText: {
    fontFamily: FONT.extrabold,
    color: '#ffffff',
    fontSize: 44,
    lineHeight: 57,
    letterSpacing: 0.5,
  },
  phoneticText: {
    fontFamily: FONT.regular,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  supplementText: {
    fontFamily: FONT.regular,
    color: COLORS.textMuted,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playBtn: {
    backgroundColor: COLORS.accentBlue,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  playBtnText: {
    fontFamily: FONT.bold,
    color: '#0a0a1e',
    fontSize: 12,
    letterSpacing: 1,
  },
  aiBtn: {
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  aiBtnText: {
    fontFamily: FONT.regular,
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  nextBtn: {
    alignItems: 'center',
  },
  nextBtnText: {
    fontFamily: FONT.bold,
    color: COLORS.accentBlue,
    fontSize: 12,
    letterSpacing: 1,
  },
  protoWrap: {
    gap: 4,
  },
  protoHead: {
    fontFamily: FONT.mono,
    color: COLORS.textTertiary,
    fontSize: 10,
    letterSpacing: 1,
  },
  protoBox: {
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  protoBody: {
    fontFamily: FONT.regular,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  tipList: {
    marginTop: 4,
  },
  tipRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tipBullet: {
    color: COLORS.accentYellow,
    marginRight: 6,
    fontSize: 12,
  },
  tipRowText: {
    fontFamily: FONT.regular,
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  bottomSpacer: {
    flex: 1,
  },
  swipeHint: {
    fontFamily: FONT.regular,
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});
