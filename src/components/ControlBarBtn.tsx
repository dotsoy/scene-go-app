import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT } from '../theme/tokens';

interface ControlBarBtnProps {
  label: string;
  /** 小字提示（如「双击分析 · 单击关闭」） */
  hint?: string;
  /** 激活态（绿，带光晕） */
  active?: boolean;
  /** 危险/录制态（红，SNAP） */
  danger?: boolean;
  /** SNAP 大按钮（相机态） */
  large?: boolean;
  onPress: () => void;
}

/**
 * 底部控制栏统一按钮（精致版）：
 * - Pressable 按压态：scale 0.96 + 降透明度，释放回弹
 * - 统一 1px 边框、12 圆角、字距层级
 * - 激活态绿色光晕（shadow），危险态红色光晕
 */
export const ControlBarBtn: React.FC<ControlBarBtnProps> = ({
  label,
  hint,
  active,
  danger,
  large,
  onPress,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        large && styles.btnLarge,
        hint && !large && styles.btnWide,
        pressed && styles.btnPressed,
        // 状态底色与描边
        danger
          ? styles.btnDanger
          : active
            ? styles.btnActive
            : styles.btnIdle,
        // 仅激活态保留光晕（SNAP 动作按钮不发光，避免过重）
        active && !danger && styles.glowActive,
      ]}
      onPress={onPress}
      android_ripple={undefined}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.labelRow, pressed && styles.labelRowPressed]}>
            {active && (
              <View style={[styles.stateDot, danger ? styles.dotDanger : styles.dotActive]} />
            )}
            <Text
              style={[
                styles.label,
                large && styles.labelLarge,
                danger
                  ? styles.labelDanger
                  : active
                    ? styles.labelActive
                    : styles.labelIdle,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
          {hint ? (
            <Text
              style={[styles.hint, large && styles.hintLarge]}
              numberOfLines={1}
            >
              {hint}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    minWidth: 54,
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnWide: {
    minWidth: 90,
  },
  btnLarge: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  btnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  // 状态底色
  btnIdle: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: COLORS.borderSubtle,
  },
  btnActive: {
    backgroundColor: 'rgba(76,175,80,0.16)',
    borderColor: 'rgba(129,199,132,0.35)',
  },
  btnDanger: {
    backgroundColor: 'rgba(244,67,54,0.28)',
    borderColor: 'rgba(239,83,80,0.4)',
  },
  // 光晕
  glowActive: {
    shadowColor: COLORS.accentGreen,
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelRowPressed: {
    opacity: 0.9,
  },
  stateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 5,
  },
  dotActive: {
    backgroundColor: COLORS.accentGreen,
  },
  dotDanger: {
    backgroundColor: COLORS.accentRed,
  },
  label: {
    fontFamily: FONT.bold,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  labelLarge: {
    fontSize: 15,
    letterSpacing: 2,
  },
  labelIdle: {
    color: '#9ca3af',
  },
  labelActive: {
    color: COLORS.accentGreen,
  },
  labelDanger: {
    color: COLORS.accentRed,
  },
  hint: {
    fontFamily: FONT.regular,
    color: '#6b7280',
    fontSize: 7.5,
    marginTop: 1,
    letterSpacing: 0.3,
  },
  hintLarge: {
    fontSize: 8.5,
    marginTop: 2,
  },
});
