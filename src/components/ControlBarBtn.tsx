import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT } from '../theme/tokens';

interface ControlBarBtnProps {
  label: string;
  /** 小字提示（如「双击分析 · 单击关闭」） */
  hint?: string;
  /** 激活态（绿，带光晕） */
  active?: boolean;
  /** 危险/拍摄态（红调，无光晕） */
  danger?: boolean;
  /** 加高（卡片区输入按钮用） */
  tall?: boolean;
  onPress: () => void;
}

/**
 * 底部控制栏统一按钮（精致版）：
 * - Pressable 按压态：scale 0.96 + 降透明度，释放回弹
 * - 统一 1px 边框、10 圆角、字距层级
 * - 激活态绿色光晕（§7.4 次按钮规范：半透明白底 + 细描边）
 */
export const ControlBarBtn: React.FC<ControlBarBtnProps> = ({
  label,
  hint,
  active,
  danger,
  tall,
  onPress,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        tall && styles.btnTall,
        hint && styles.btnWide,
        pressed && styles.btnPressed,
        danger
          ? styles.btnDanger
          : active
            ? styles.btnActive
            : styles.btnIdle,
        active && styles.glowActive,
      ]}
      onPress={onPress}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.labelRow, pressed && styles.labelRowPressed]}>
            {(active || danger) && (
              <View
                style={[styles.stateDot, danger ? styles.dotDanger : styles.dotActive]}
              />
            )}
            <Text
              style={[
                styles.label,
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
            <Text style={styles.hint} numberOfLines={1}>
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
  btnTall: {
    height: 48,
  },
  btnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  // 状态底色（§7.4：次按钮半透明白 + 细描边；激活态品牌绿）
  btnIdle: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  btnDanger: {
    backgroundColor: 'rgba(244,67,54,0.18)',
    borderColor: 'rgba(239,83,80,0.4)',
  },
  btnActive: {
    backgroundColor: 'rgba(76,175,80,0.18)',
    borderColor: 'rgba(129,199,132,0.4)',
  },
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
  dotDanger: {
    backgroundColor: COLORS.accentRed,
  },
  label: {
    fontFamily: FONT.bold,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  labelIdle: {
    color: 'rgba(255,255,255,0.7)',
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
});
