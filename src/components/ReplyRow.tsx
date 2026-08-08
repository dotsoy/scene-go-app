/**
 * 02 屏建议回复区 —— ReplyLabel + ReplyRow（纯文字块）。
 * 规格（DESIGN-v2.1.pen PLn8O / rrvQK / SCN-27）：
 * 块高 40、r10、$bg-card-light、paddingH 14、文字 13px $text-primary；
 * 无图标（SCN-27：✓/✗ 无法表达场景回复的情绪，语义由文案承担）。
 * 点选「直出 replyCard」：回调 onSelect(ReplyOption)。
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../theme/tokens';
import { ReplyOption } from '../core/types';

export function ReplyRow({
  label,
  options,
  onSelect,
}: {
  label: string;
  options: ReplyOption[];
  onSelect: (opt: ReplyOption) => void;
}) {
  if (!options.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((opt) => (
          <Pressable
            key={opt.label}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            onPress={() => onSelect(opt)}
          >
            <Text style={styles.optionText} numberOfLines={1}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { width: '100%', gap: 10 },
  label: { fontFamily: fonts.body, fontSize: 12, color: colors.textTertiary },
  row: { width: '100%', flexDirection: 'row', gap: 10 },
  option: {
    height: 40,
    flex: 1,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  optionPressed: { opacity: 0.7 },
  optionText: { fontFamily: fonts.body, fontSize: 13, color: colors.textPrimary },
});
