import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT } from '../theme/tokens';
import { V31ActionCard, V31ActionCardData } from './V31ActionCard';

export interface V31InsightData {
  id: string;
  imageUri?: string;
  mainCard: V31ActionCardData;
  phraseCards?: V31ActionCardData[];
  isError?: boolean;
  errorMessage?: string;
}

interface V31InsightViewProps {
  insight: V31InsightData;
  onPressCard?: (card: V31ActionCardData) => void;
  onResnap?: () => void;
  onManualInput?: () => void;
}

export const V31InsightView: React.FC<V31InsightViewProps> = ({
  insight,
  onPressCard,
  onResnap,
  onManualInput,
}) => {
  return (
    <View style={styles.container}>
      {/* Top: Captured Photo Image Thumbnail */}
      {insight.imageUri ? (
        <Image source={{ uri: insight.imageUri }} style={styles.photoThumbnail} />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderText}>实拍照片</Text>
        </View>
      )}

      {/* Main Insight Card or Exception Card */}
      {insight.isError ? (
        <View style={styles.exceptionCard}>
          <Text style={styles.exceptionTitle}>
            {insight.errorMessage || '画面模糊，未看到有效信息'}
          </Text>
          <View style={styles.actionBtnRow}>
            <TouchableOpacity style={styles.reshootBtn} onPress={onResnap}>
              <Text style={styles.reshootBtnText}>重新拍摄</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.manualBtn} onPress={onManualInput}>
              <Text style={styles.manualBtnText}>手动打字输入</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.mainCardWrap}>
          {/* Header Row with Resnap Button */}
          <View style={styles.cardHdrRow}>
            <Text style={styles.tagText}>图像解读</Text>
            <TouchableOpacity style={styles.resnapBtn} onPress={onResnap}>
              <Text style={styles.resnapBtnText}>重拍纠错</Text>
            </TouchableOpacity>
          </View>

          {/* Main Card */}
          <V31ActionCard card={insight.mainCard} onPressCard={onPressCard} />

          {/* Horizontal Scrolling Phrase Cards Row */}
          {insight.phraseCards && insight.phraseCards.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.phraseScrollContent}
              style={styles.phraseScroll}
            >
              {insight.phraseCards.map((card) => (
                <V31ActionCard
                  key={card.id}
                  card={card}
                  width={220}
                  isOptionCard
                  onPressCard={onPressCard}
                />
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  photoThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    backgroundColor: '#18181B',
  },
  photoPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    backgroundColor: '#18181B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  mainCardWrap: {
    gap: 10,
  },
  cardHdrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tagText: {
    fontFamily: FONT.monoBold,
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  resnapBtn: {
    backgroundColor: '#252528',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resnapBtnText: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  phraseScroll: {
    marginTop: 4,
  },
  phraseScrollContent: {
    gap: 10,
  },
  exceptionCard: {
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: 'rgba(239,83,80,0.3)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  exceptionTitle: {
    fontFamily: FONT.bold,
    fontSize: 13,
    color: COLORS.accentRed,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reshootBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  reshootBtnText: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  manualBtn: {
    backgroundColor: '#252528',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  manualBtnText: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
