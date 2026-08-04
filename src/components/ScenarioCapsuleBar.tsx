/**
 * 对话页场景胶囊（DESIGN-v2.1 §14）：当前位置栏下方的「为你推荐」胶囊条。
 * 内容通用（不绑定国家）；文案按档案语言取用（zh/en）。
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT } from '../theme/tokens';
import { AirportCapsule, Lang } from '../data/scenarioSops';

interface ScenarioCapsuleBarProps {
  capsules: AirportCapsule[];
  lang: Lang;
  onSelect: (key: string) => void;
}

const pick = (b: { zh: string; en: string }, lang: Lang) => (lang === 'en-US' ? b.en : b.zh);

export const ScenarioCapsuleBar: React.FC<ScenarioCapsuleBarProps> = ({ capsules, lang, onSelect }) => (
  <View style={styles.wrap}>
    <Text style={styles.title}>📍 为你推荐 · 当前场景</Text>
    <View style={styles.row}>
      {capsules.map((c) => (
        <TouchableOpacity
          key={c.key}
          style={[styles.capsule, c.accent ? styles.capsuleAccent : styles.capsulePlain]}
          onPress={() => onSelect(c.key)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={pick(c.label, lang)}
        >
          <Text style={styles.emoji}>{c.emoji}</Text>
          <Text style={[styles.label, c.accent ? styles.labelAccent : styles.labelPlain]}>
            {pick(c.label, lang)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 8,
  },
  title: {
    fontFamily: FONT.semibold,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  capsuleAccent: {
    backgroundColor: COLORS.accentBlue,
  },
  capsulePlain: {
    backgroundColor: COLORS.bgCardLight,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontFamily: FONT.semibold,
    fontSize: 12,
  },
  labelAccent: {
    color: '#0a0a1e',
  },
  labelPlain: {
    color: COLORS.textPrimary,
  },
});
