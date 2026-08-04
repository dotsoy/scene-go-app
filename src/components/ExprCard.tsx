/**
 * V2 表达卡组件（对话流消息 + 卡栈条目共用，实施稿 §2.2）。
 * variant:
 * - 'chat'：大字 30pt，无 LOCAL PROTOCOL，右侧「全屏 ›」；
 * - 'stack'：大字 30pt，无 LOCAL PROTOCOL / PLAY AUDIO，右侧红「×」删除。
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT } from '../theme/tokens';
import { CardData } from '../core/types';

interface ExprCardProps {
  card: CardData;
  variant: 'chat' | 'stack';
  onPress: () => void;
  onDelete?: () => void;
}

export const ExprCard: React.FC<ExprCardProps> = ({ card, variant, onPress, onDelete }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={onPress}
    activeOpacity={0.85}
    accessibilityRole="button"
  >
    {/* 顶行：分类胶囊 + 标题 + 操作位 */}
    <View style={styles.topRow}>
      <View style={styles.categoryPill}>
        <Text style={styles.categoryText}>{card.categoryTag}</Text>
      </View>
      {card.steps && card.steps.length > 0 ? (
        <View style={styles.stepsBadge}>
          <Text style={styles.stepsBadgeText}>共 {card.steps.length} 步</Text>
        </View>
      ) : null}
      <Text style={styles.title} numberOfLines={1}>
        {card.title}
      </Text>
      {variant === 'stack' && onDelete ? (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="删除卡片"
        >
          <Text style={styles.delete}>×</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.fullscreen}>全屏 ›</Text>
      )}
    </View>
    {/* 大字区 */}
    <View style={styles.textArea}>
      <Text style={styles.target}>{card.targetText}</Text>
      {card.phonetic ? <Text style={styles.phonetic}>{card.phonetic}</Text> : null}
      {card.subText ? <Text style={styles.subText}>{card.subText}</Text> : null}
    </View>
    {/* 操作行：对话流显示 PLAY AUDIO */}
    {variant === 'chat' ? (
      <View style={styles.actionRow}>
        <Text style={styles.playAudio}>PLAY AUDIO</Text>
      </View>
    ) : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 16,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.textSecondary,
    fontFamily: FONT.regular,
  },
  stepsBadge: {
    backgroundColor: COLORS.greenBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stepsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentGreen,
    fontFamily: FONT.regular,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONT.regular,
  },
  fullscreen: {
    fontSize: 12,
    color: COLORS.accentBlue,
    fontWeight: '600',
  },
  delete: {
    fontSize: 18,
    color: COLORS.accentRed,
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    gap: 6,
  },
  target: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 39,
    fontFamily: FONT.extrabold,
  },
  phonetic: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONT.regular,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONT.regular,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  playAudio: {
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.textSecondary,
    overflow: 'hidden',
    fontFamily: FONT.regular,
  },
});
