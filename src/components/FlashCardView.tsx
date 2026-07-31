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
  english: string;
  localTip: string;
  languageCode: string;
  badgeColor?: string;
}

interface FlashCardViewProps {
  card: CardData;
  onNextCard: () => void;
}

export const FlashCardView: React.FC<FlashCardViewProps> = ({ card, onNextCard }) => {
  const handlePlayAudio = (e: GestureResponderEvent) => {
    e.stopPropagation(); // 阻止冒泡，避免播放发音时触发切卡
    Speech.speak(card.targetText, {
      language: card.languageCode,
      pitch: 1.0,
      rate: 0.85,
    });
  };

  return (
    <View style={styles.cardContainer}>
      {/* 极简 Top Bar（包含内置 NEXT 按钮与分类 Pill） */}
      <View style={styles.topRow}>
        <View style={styles.leftPillGroup}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{card.categoryTag.toUpperCase()}</Text>
          </View>
          <Text style={styles.locationText}>{card.locationName.toUpperCase()}</Text>
        </View>

        {/* 移入 Card 内部的极简 NEXT 按钮 */}
        <TouchableOpacity style={styles.nextCardPill} onPress={onNextCard} activeOpacity={0.7}>
          <Text style={styles.nextCardPillText}>NEXT ➔</Text>
        </TouchableOpacity>
      </View>

      {/* 点击卡片任意主体区域，快速切换下一张 Card */}
      <TouchableOpacity
        style={styles.cardBody}
        onPress={onNextCard}
        activeOpacity={0.88}
      >
        <Text style={styles.cardTitle}>{card.title}</Text>

        {/* 高对比大字核心展示区 */}
        <View style={styles.displayArea}>
          <Text style={styles.targetText}>{card.targetText}</Text>
        </View>

        {/* 读音与英文 */}
        <Text style={styles.phoneticText}>{card.phonetic}</Text>
        <Text style={styles.englishText}>{card.english}</Text>

        {/* 发音按钮 */}
        <TouchableOpacity style={styles.audioPill} onPress={handlePlayAudio} activeOpacity={0.75}>
          <Text style={styles.audioPillText}>PLAY AUDIO</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* 极简指南提示卡 */}
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
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  nextCardPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nextCardPillText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardBody: {
    backgroundColor: '#121214',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    color: '#f4f4f5',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  displayArea: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  targetText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 44,
    letterSpacing: 0.5,
  },
  phoneticText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  englishText: {
    color: '#52525b',
    fontSize: 13,
    marginBottom: 18,
  },
  audioPill: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  audioPillText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
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
