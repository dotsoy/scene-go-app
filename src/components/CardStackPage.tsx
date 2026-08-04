/**
 * V2 卡栈页（03，Tab「卡栈」）：场景分类 chips + 表达卡列表 + 空态。
 * 数据源 cardStackStore（与对话流共享）；Tap&Talk 兜底卡不参与删除/清空。
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { COLORS, FONT } from '../theme/tokens';
import { CardData } from '../core/types';
import { ExprCard } from './ExprCard';

const CATEGORIES = [
  '全部',
  'TAXI',
  'METRO',
  'RESTAURANT',
  'TAX_REFUND',
  'SHOPPING',
  'HOTEL',
  'AIRPORT',
  'TRANSPORT',
  'MEDICAL',
  'EXCHANGE',
  'SOS',
] as const;

interface CardStackPageProps {
  cards: CardData[];
  onCardPress: (card: CardData) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const CardStackPage: React.FC<CardStackPageProps> = ({
  cards,
  onCardPress,
  onDelete,
  onClear,
}) => {
  const [cat, setCat] = useState<string>('全部');
  const visible = cat === '全部' ? cards : cards.filter((c) => c.categoryTag === cat);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>卡栈</Text>
        <TouchableOpacity
          onPress={onClear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="清除全部"
        >
          <Text style={styles.clear}>清空</Text>
        </TouchableOpacity>
      </View>
      {/* 分类 chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chips}
      >
        {CATEGORIES.map((c) => {
          const selected = c === cat;
          return (
            <TouchableOpacity
              key={c}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setCat(c)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {/* 列表 / 空态 */}
      {visible.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>还没有表达卡</Text>
          <Text style={styles.emptyHint}>去对话页拍照 / 说话 / 打字生成第一张</Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ExprCard
              card={item}
              variant="stack"
              onPress={() => onCardPress(item)}
              onDelete={() => onDelete(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.textPrimary,
    fontFamily: FONT.regular,
  },
  clear: {
    fontSize: 12,
    color: COLORS.accentRed,
  },
  chipsScroll: {
    maxHeight: 44,
  },
  chips: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: 'rgba(79, 195, 247, 0.12)',
    borderColor: COLORS.accentBlue,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: FONT.regular,
  },
  chipTextSelected: {
    color: COLORS.accentBlue,
    fontWeight: '700',
  },
  list: {
    padding: 20,
    gap: 10,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: FONT.regular,
  },
  emptyHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONT.regular,
  },
});
