import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, DimensionValue } from 'react-native';
import { COLORS, FONT } from '../theme/tokens';

export interface V31ActionCardData {
  id: string;
  foreignText: string;
  nativeText: string;
  hasAudio?: boolean;
  languageCode?: string;
}

interface V31ActionCardProps {
  card: V31ActionCardData;
  onPressCard?: (card: V31ActionCardData) => void;
  onPlayAudio?: (card: V31ActionCardData) => void;
  width?: DimensionValue;
  isOptionCard?: boolean;
}

export const V31ActionCard: React.FC<V31ActionCardProps> = ({
  card,
  onPressCard,
  onPlayAudio,
  width = '100%',
  isOptionCard = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPressCard && onPressCard(card)}
      style={[
        styles.cardContainer,
        { width },
        isOptionCard && styles.optionCardContainer,
      ]}
    >
      {/* Top: Foreign Language Expression */}
      <Text style={[styles.foreignText, isOptionCard && styles.optionForeignText]}>
        {card.foreignText}
      </Text>

      {/* Bottom: Native Language Explanation */}
      <Text style={[styles.nativeText, isOptionCard && styles.optionNativeText]}>
        {card.nativeText}
      </Text>

      {/* Bottom Right: Audio Play Button */}
      {card.hasAudio && !isOptionCard && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.playBtn}
            onPress={(e) => {
              e.stopPropagation();
              onPlayAudio && onPlayAudio(card);
            }}
          >
            <Text style={styles.playBtnText}>PLAY</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 16,
    gap: 8,
  },
  optionCardContainer: {
    backgroundColor: '#252528',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  foreignText: {
    fontFamily: FONT.bold,
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 30,
  },
  optionForeignText: {
    fontSize: 13,
    lineHeight: 18,
  },
  nativeText: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    color: COLORS.accentYellow,
    lineHeight: 18,
  },
  optionNativeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  playBtn: {
    backgroundColor: '#252528',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  playBtnText: {
    fontFamily: FONT.monoBold,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
