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
  /** LOCAL PROTOCOL 框内可选操作入口（如安全卡的「安全信息」） */
  tipActionLabel?: string;
  onTipAction?: () => void;
}

export const FlashCardView: React.FC<FlashCardViewProps> = ({
  card,
  currentIndex,
  totalCards,
  onNextCard,
  tipActionLabel,
  onTipAction,
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
      {/* Top Header: 分类名称 + 进度位置指示 */}
      <View style={styles.topRow}>
        <View style={styles.leftPillGroup}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{card.categoryTag.toUpperCase()}</Text>
          </View>
          <Text style={styles.locationText}>{card.locationName.toUpperCase()}</Text>
        </View>

        {/* 顶部进度批次展示 (01 / 04) + 分享按钮 */}
        <View style={styles.topRightGroup}>
          <TouchableOpacity style={styles.sharePill} onPress={handleShare} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={styles.shareText}>SHARE</Text>
          </TouchableOpacity>
          <View style={styles.progressPill}>
            <Text style={styles.progressText}>{formattedProgress}</Text>
          </View>
        </View>
      </View>

      {/* 点击卡片任意主体区域可快速切卡 */}
      <TouchableOpacity
        style={styles.cardBody}
        onPress={onNextCard}
        activeOpacity={0.9}
      >
        <Text style={styles.cardTitle}>{card.title}</Text>

        {/* 高对比大字核心展示区 */}
        <View style={styles.displayArea}>
          <Text style={styles.targetText}>{card.targetText}</Text>
        </View>

        {/* 读音与补充说明 */}
        <Text style={styles.phoneticText}>{card.phonetic}</Text>

        {/* 备用表达短语（点击朗读） */}
        {card.phrases && card.phrases.length > 0 && (
          <View style={styles.phrasesBlock}>
            <Text style={styles.phrasesHeader}>常用表达</Text>
            {card.phrases.slice(0, 3).map((phrase, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.phraseRow}
                onPress={() =>
                  Speech.speak(phrase.split('(')[0].trim(), {
                    language: card.languageCode,
                    pitch: 1.0,
                    rate: 0.85,
                  })
                }
                activeOpacity={0.6}
              >
                <Text style={styles.phraseLocal} numberOfLines={1}>
                  {phrase.split('(')[0].trim()}
                </Text>
                <Text style={styles.phraseZh} numberOfLines={1}>
                  {phrase.includes('(') ? phrase.slice(phrase.indexOf('(') + 1, phrase.lastIndexOf(')')) : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.englishText}>{card.subText}</Text>

        {/* 底部双操作按钮栏：PLAY AUDIO (左) 与 放大显眼的 NEXT CARD 按钮 (右) */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.audioPill} onPress={handlePlayAudio} activeOpacity={0.75}>
            <Text style={styles.audioPillText}>PLAY AUDIO</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextCardPill} onPress={onNextCard} activeOpacity={0.8}>
            <Text style={styles.nextCardPillText}>{'NEXT CARD ->'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* 本地指南提示卡：安全卡附带「安全信息」入口 */}
      <View style={styles.tipBox}>
        <Text style={styles.tipHeader}>LOCAL PROTOCOL</Text>
        <Text style={styles.tipBody}>{card.localTip}</Text>
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
        {tipActionLabel && onTipAction && (
          <TouchableOpacity style={styles.tipActionRow} onPress={onTipAction} activeOpacity={0.7}>
            <Text style={styles.tipActionText}>{tipActionLabel} ›</Text>
          </TouchableOpacity>
        )}
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
  topRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sharePill: {
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  shareText: {
    fontFamily: FONT.monoBold,
    color: COLORS.textTertiary,
    fontSize: 10,
    letterSpacing: 0.8,
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
    fontSize: 44,
    lineHeight: 57,
    letterSpacing: 0.5,
  },
  phoneticText: {
    fontFamily: FONT.regular,
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 10,
  },
  phrasesBlock: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  phrasesHeader: {
    fontFamily: FONT.mono,
    color: COLORS.textTertiary,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 6,
  },
  phraseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  phraseLocal: {
    fontFamily: FONT.semibold,
    color: '#e4e4e7',
    fontSize: 13,
    flex: 1,
  },
  phraseZh: {
    fontFamily: FONT.regular,
    color: COLORS.textTertiary,
    fontSize: 11,
    marginLeft: 12,
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
  tipActionRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.borderSubtle,
  },
  tipActionText: {
    fontFamily: FONT.bold,
    color: COLORS.accentBlue,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  tipBody: {
    fontFamily: FONT.regular,
    color: '#d4d4d8',
    fontSize: 12,
    lineHeight: 18,
  },
  tipList: {
    marginTop: 6,
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
    color: '#c4c4cc',
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});
