import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT } from '../theme/tokens';

interface ControlBarBtnProps {
  label: string;
  /** 小字提示（如「双击分析 · 单击关闭」） */
  hint?: string;
  /** 激活态（绿） */
  active?: boolean;
  /** 危险/录制态（红） */
  danger?: boolean;
  /** SNAP 大按钮（相机态） */
  large?: boolean;
  onPress: () => void;
}

/** 底部控制栏统一按钮：高度/圆角/字号全站一致（spec §2.3/§4） */
export const ControlBarBtn: React.FC<ControlBarBtnProps> = ({
  label,
  hint,
  active,
  danger,
  large,
  onPress,
}) => {
  const bg = danger ? COLORS.redBg : active ? COLORS.greenBg : COLORS.grayBtnBg;
  const color = danger
    ? COLORS.accentRed
    : active
      ? COLORS.accentGreen
      : COLORS.grayBtnText;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        large && styles.btnLarge,
        hint && !large && styles.btnWide,
        { backgroundColor: bg },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text
        style={[styles.label, large && styles.labelLarge, { color }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {hint ? (
        <Text
          style={[styles.hint, large && styles.hintLarge]}
          numberOfLines={1}
        >
          {hint}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    minWidth: 52,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnWide: {
    minWidth: 96,
  },
  btnLarge: {
    flex: 1,
    height: 64,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  label: {
    fontFamily: FONT.bold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelLarge: {
    fontSize: 18,
    letterSpacing: 2,
  },
  hint: {
    fontFamily: FONT.regular,
    color: COLORS.textTertiary,
    fontSize: 8,
    marginTop: 2,
  },
  hintLarge: {
    fontSize: 9,
    marginTop: 3,
  },
});
