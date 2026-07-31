import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';

export interface CardData {
  id: string;
  scenarioTag: string;
  locationName: string;
  title: string;
  targetText: string;
  phonetic: string;
  english: string;
  localTip: string;
  languageCode: string;
  badgeColor: string;
}

interface FlashCardViewProps {
  card: CardData;
}

export const FlashCardView: React.FC<FlashCardViewProps> = ({ card }) => {
  const handlePlayAudio = () => {
    Speech.speak(card.targetText, {
      language: card.languageCode,
      pitch: 1.0,
      rate: 0.9,
    });
  };

  return (
    <View style={styles.cardContainer}>
      {/* 顶部场景与位置 Badge */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: card.badgeColor }]}>
          <Text style={styles.badgeText}>{card.scenarioTag}</Text>
        </View>
        <Text style={styles.locationText}>📍 {card.locationName}</Text>
      </View>

      {/* 闪示卡卡片主体 */}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{card.title}</Text>

        {/* 超高对比度大字闪示区域 */}
        <View style={styles.textHighlightBox}>
          <Text style={styles.targetText}>{card.targetText}</Text>
        </View>

        {/* 读音与英语辅助说明 */}
        <Text style={styles.phoneticText}>🗣️ {card.phonetic}</Text>
        <Text style={styles.englishText}>🇬🇧 {card.english}</Text>

        {/* 语音朗读按钮 */}
        <TouchableOpacity style={styles.audioButton} onPress={handlePlayAudio} activeOpacity={0.8}>
          <Text style={styles.audioButtonText}>🔊 点击播放本地发音</Text>
        </TouchableOpacity>
      </View>

      {/* 本地规避与小费浮窗 (Local Protocol) */}
      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>💡 本地出行指南 (Local Protocol)</Text>
        <Text style={styles.tipText}>{card.localTip}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 1,
    justify: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  locationText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '500',
  },
  cardBody: {
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    color: '#facc15', // 醒目金黄
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  textHighlightBox: {
    backgroundColor: '#000000',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#facc15',
  },
  targetText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 46,
    textAlign: 'left',
  },
  phoneticText: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  englishText: {
    color: '#a1a1aa',
    fontSize: 14,
    marginBottom: 20,
  },
  audioButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  audioButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  tipBox: {
    marginTop: 16,
    backgroundColor: 'rgba(39, 39, 42, 0.9)',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  tipTitle: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipText: {
    color: '#e4e4e7',
    fontSize: 13,
    lineHeight: 18,
  },
});
