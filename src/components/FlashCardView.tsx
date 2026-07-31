import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
}

export const FlashCardView: React.FC<FlashCardViewProps> = ({ card }) => {
  const handlePlayAudio = () => {
    Speech.speak(card.targetText, {
      language: card.languageCode,
      pitch: 1.0,
      rate: 0.85,
    });
  };

  return (
    <View style={styles.cardContainer}>
      {/* 极简 Top Bar */}
      <View style={styles.topRow}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{card.categoryTag.toUpperCase()}</Text>
        </View>
        <Text style={styles.locationText}>{card.locationName.toUpperCase()}</Text>
      </View>

      {/* 极简主卡片 */}
      <View style={styles.cardBody}>
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
      </View>

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
    marginBottom: 16,
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
  cardBody: {
    backgroundColor: '#121214',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    color: '#f4f4f5',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  displayArea: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  targetText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 46,
    letterSpacing: 0.5,
  },
  phoneticText: {
    color: '#a1a1aa',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  englishText: {
    color: '#52525b',
    fontSize: 13,
    marginBottom: 20,
  },
  audioPill: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  audioPillText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tipBox: {
    marginTop: 16,
    backgroundColor: '#121214',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tipHeader: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  tipBody: {
    color: '#d4d4d8',
    fontSize: 13,
    lineHeight: 19,
  },
});
