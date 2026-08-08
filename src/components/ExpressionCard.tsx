/**
 * 02 屏双气泡 —— 「我方表达」+「对方回话」。
 * 规格（DESIGN-v2.1.pen ch9RB / P1k4v / N6aSn）：
 * 气泡宽 284、r16、$bg-card-light、padding 14、gap 6。
 * 我方：WhoTag「我的表达」accent-blue；对方：WhoTag「对方」accent-green。
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../theme/tokens';

export interface BubbleProps {
  /** 顶行标签（「我的表达」/「对方」） */
  who: string;
  whoColor: string;
  /** 当地语言大字（17px, 500） */
  foreign: string;
  /** 拉丁转写（12px, secondary） */
  phonetic?: string;
  /** 中文/母语（13px, yellow） */
  zh: string;
  /** 右侧操作区（播放/换一句/重听），由调用方注入节点 */
  actions?: React.ReactNode;
}

/** 单侧气泡 */
export function Bubble({ who, whoColor, foreign, phonetic, zh, actions }: BubbleProps) {
  return (
    <View style={styles.bubble}>
      <View style={styles.metaRow}>
        <Text style={[styles.whoTag, { color: whoColor }]}>{who}</Text>
        {actions ? <View style={styles.acts}>{actions}</View> : null}
      </View>
      <Text style={styles.foreign} numberOfLines={3}>
        {foreign}
      </Text>
      {phonetic ? (
        <Text style={styles.phonetic} numberOfLines={2}>
          {phonetic}
        </Text>
      ) : null}
      <Text style={styles.zh} numberOfLines={2}>
        {zh}
      </Text>
    </View>
  );
}

/** 双气泡容器（左对方 / 右我方） */
export function ExpressionCard({
  mine,
  theirs,
}: {
  mine: BubbleProps;
  theirs?: BubbleProps;
}) {
  return (
    <View style={styles.wrap}>
      {theirs ? (
        <View style={styles.row}>
          <Bubble {...theirs} />
        </View>
      ) : null}
      <View style={[styles.row, styles.mineRow]}>
        <Bubble {...mine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 16, alignItems: 'center' },
  row: { width: '100%', flexDirection: 'row' },
  mineRow: { justifyContent: 'flex-end' },
  bubble: {
    width: 284,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r16,
    gap: 6,
    padding: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  acts: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  whoTag: { fontFamily: fonts.body, fontSize: 11 },
  foreign: {
    fontFamily: fonts.body,
    fontSize: 17,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  phonetic: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  zh: { fontFamily: fonts.body, fontSize: 13, color: colors.accentYellow },
});
