import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, GestureResponderEvent } from 'react-native';
import * as Speech from 'expo-speech';
import { COLORS, FONT } from '../theme/tokens';

export interface CardData {
  id: string;
  categoryTag: string;
  locationName: string;
  title: string;
  targetText: string;
  phonetic: string;
  /** 补充说明/服务语句（原 english 字段，实际存中文语义，改名避免误导） */
  subText: string;
  localTip: string;
  languageCode: string;
  badgeColor?: string;
}

interface FlashCardViewProps {
  card: CardData;
  currentIndex: number;
  totalCards: number;
  onNextCard: () => void;
  /** 安全卡等需要"点击展开详情"的卡片：存在时卡体点击/按钮改为打开详情 */
  detailLabel?: string;
  onShowDetail?: () => void;
}

export const FlashCardView: React.FC<FlashCardViewProps> = ({
  card,
  currentIndex,
  totalCards,
  onNextCard,
  detailLabel,
  onShowDetail,
}) => {
  const handlePlayAudio = (e: GestureResponderEvent) => {
    e.stopPropagation();
    Speech.speak(card.targetText, {
      language: card.languageCode,
      pitch: 1.0,
      rate: 0.85,
    });
  };

  const formattedProgress = `${(currentIndex + 1).toString().padStart(2, '0')} / ${totalCards.toString().padStart(2, '0')}`;

  return (
    <View style={styles.cardContainer}>
      {/* Top Header: 分类名称 + 进度位置指示 */}
      <View style={styles.topRow}>
        <View style={styles.leftPillGroup}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{card.categoryTag.toUpperCase()}</Text>
          </View>
          <Text style={styles.locationText}>{card.locationName.toUpperCase()}</Text>
        </View>

        {/* 顶部进度批次展示 (01 / 04) */}
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>{formattedProgress}</Text>
        </View>
      </View>

      {/* 点击卡片任意主体区域可快速切卡；安全卡改为打开详情 */}
      <TouchableOpacity
        style={styles.cardBody}
        onPress={onShowDetail ?? onNextCard}
        activeOpacity={0.9}
      >
        <Text style={styles.cardTitle}>{card.title}</Text>

        {/* 高对比大字核心展示区 */}
        <View style={styles.displayArea}>
          <Text style={styles.targetText}>{card.targetText}</Text>
        </View>

        {/* 读音与补充说明 */}
        <Text style={styles.phoneticText}>{card.phonetic}</Text>
        <Text style={styles.englishText}>{card.subText}</Text>

        {/* 底部双操作按钮栏：PLAY AUDIO (左) 与 放大显眼的 NEXT CARD 按钮 (右) */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.audioPill} onPress={handlePlayAudio} activeOpacity={0.75}>
            <Text style={styles.audioPillText}>PLAY AUDIO</Text>
          </TouchableOpacity>

          {detailLabel && onShowDetail ? (
            <TouchableOpacity style={styles.detailPill} onPress={onShowDetail} activeOpacity={0.8}>
              <Text style={styles.detailPillText}>{detailLabel}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextCardPill} onPress={onNextCard} activeOpacity={0.8}>
              <Text style={styles.nextCardPillText}>{'NEXT CARD ->'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* 本地指南提示卡 */}
      <View style={styles.tipBox}>
        <Text style={styles.tipHeader}>LOCAL PROTOCOL</Text>
        <Text style={styles.tipBody}>{card.localTip}</Text>
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
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  leftPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryPill: {
    backgroundColor: COLORS.bgCardLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  categoryText: {
    fontFamily: FONT.bold,
    color: '#e4e4e7',
    fontSize: 11,
    letterSpacing: 1,
  },
  locationText: {
    fontFamily: FONT.semibold,
    color: COLORS.textTertiary,
    fontSize: 10,
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  progressPill: {
    backgroundColor: COLORS.bgCardLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  progressText: {
    fontFamily: FONT.monoBold,
    color: COLORS.accentYellow,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  cardBody: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  cardTitle: {
    fontFamily: FONT.semibold,
    color: COLORS.textPrimary,
    fontSize: 15,
    marginBottom: 12,
  },
  displayArea: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  targetText: {
    fontFamily: FONT.extrabold,
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 31,
    letterSpacing: 0.5,
  },
  phoneticText: {
    fontFamily: FONT.regular,
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  englishText: {
    fontFamily: FONT.regular,
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  audioPill: {
    flex: 1,
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  audioPillText: {
    fontFamily: FONT.bold,
    color: COLORS.textSecondary,
    fontSize: 12,
    letterSpacing: 0.8,
  },
  nextCardPill: {
    flex: 1.2,
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  nextCardPillText: {
    fontFamily: FONT.bold,
    color: COLORS.textSecondary,
    fontSize: 12,
    letterSpacing: 0.8,
  },
  detailPill: {
    flex: 1.2,
    backgroundColor: COLORS.accentBlue,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  detailPillText: {
    fontFamily: FONT.bold,
    color: '#0a0a1e',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  tipBox: {
    marginTop: 14,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  tipHeader: {
    fontFamily: FONT.mono,
    color: COLORS.textTertiary,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  tipBody: {
    color: '#d4d4d8',
    fontSize: 12,
    lineHeight: 18,
  },
});
