import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, GestureResponderEvent } from 'react-native';
import * as Speech from 'expo-speech';

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
}

export const FlashCardView: React.FC<FlashCardViewProps> = ({
  card,
  currentIndex,
  totalCards,
  onNextCard,
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
        <Text style={styles.englishText}>{card.subText}</Text>

        {/* 底部双操作按钮栏：PLAY AUDIO (左) 与 放大显眼的 NEXT CARD 按钮 (右) */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.audioPill} onPress={handlePlayAudio} activeOpacity={0.75}>
            <Text style={styles.audioPillText}>PLAY AUDIO</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextCardPill} onPress={onNextCard} activeOpacity={0.8}>
            <Text style={styles.nextCardPillText}>NEXT CARD ➔</Text>
          </TouchableOpacity>
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
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryText: {
    color: '#e4e4e7',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  locationText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  progressPill: {
    backgroundColor: '#18181b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  progressText: {
    color: '#facc15', // 黄色高亮进度数字
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardBody: {
    backgroundColor: '#121214',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    color: '#f4f4f5',
    fontSize: 15,
    fontWeight: '600',
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
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 42,
    letterSpacing: 0.5,
  },
  phoneticText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  englishText: {
    color: '#52525b',
    fontSize: 12,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  audioPill: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  audioPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  nextCardPill: {
    flex: 1.2,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nextCardPillText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  tipBox: {
    marginTop: 14,
    backgroundColor: '#121214',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tipHeader: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tipBody: {
    color: '#d4d4d8',
    fontSize: 12,
    lineHeight: 18,
  },
});
