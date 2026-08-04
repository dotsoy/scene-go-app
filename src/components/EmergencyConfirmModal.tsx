/**
 * 紧急拨打二次确认（DESIGN-v2.1 §21）：高对比警示 + 确认/取消，防止误拨。
 * 全屏覆盖层（由 App 以 fullscreenCardOverlay 承载），不订阅任何 store。
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT } from '../theme/tokens';

interface EmergencyConfirmModalProps {
  visible: boolean;
  num: string;
  label: string;
  countryName: string;
  sos: { local: string; phonetic: string } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const EmergencyConfirmModal: React.FC<EmergencyConfirmModalProps> = ({
  visible,
  num,
  label,
  countryName,
  sos,
  onClose,
  onConfirm,
}) => {
  if (!visible) return null;
  const sosLocal = sos?.local ?? 'ช่วยด้วย';
  const sosPhonetic = sos?.phonetic ?? '';

  return (
    <View style={styles.container}>
      {/* 顶行：关闭 + 分类 + 位置 + 二次确认徽标 */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={8}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="关闭"
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>紧急求助</Text>
        </View>
        <Text style={styles.locationText} numberOfLines={1}>
          {countryName}
        </Text>
        <View style={styles.topSpacer} />
        <View style={styles.guardPill}>
          <Text style={styles.guardPillText}>⚠️ 紧急求助 · 二次确认</Text>
        </View>
      </View>

      {/* 高对比大字求助句 */}
      <View style={styles.bigWrap}>
        <View style={styles.bigArea}>
          <Text style={styles.targetText}>{sosLocal}</Text>
          {sosPhonetic ? <Text style={styles.phoneticText}>{sosPhonetic}</Text> : null}
          <Text style={styles.supplementText}>请拨打 {num} · 联系当地{label}（仅紧急情况）</Text>
        </View>
      </View>

      {/* 警示确认框 */}
      <View style={styles.warnBox}>
        <Text style={styles.warnTitle}>⚠️ 请再次确认 · 拨出紧急电话</Text>
        <Text style={styles.warnBody}>
          确认后将拨打当地{label}电话 {num}。仅在你确实需要帮助时点击，避免误拨。
        </Text>
        <View style={styles.flagRow}>
          <Text style={styles.flagLabel}>呼叫状态</Text>
          <Text style={styles.flagValue}>未拨打 · 待确认</Text>
          <Text style={styles.flagPending}>⏳</Text>
        </View>
      </View>

      {/* 操作：取消 / 确认拨打 */}
      <View style={styles.actionWrap}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onClose}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="取消"
        >
          <Text style={styles.cancelText}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={onConfirm}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`确认拨打 ${num}`}
        >
          <Text style={styles.confirmText}>⚠️ 确认拨打 {num}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
      <Text style={styles.swipeHint}>紧急求助卡：高对比警示 + 二次确认，防止误拨</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgCardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  categoryPill: {
    backgroundColor: COLORS.bgCardLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontFamily: FONT.bold,
    color: COLORS.accentRed,
    fontSize: 11,
    letterSpacing: 1,
  },
  locationText: {
    fontFamily: FONT.regular,
    color: COLORS.textTertiary,
    fontSize: 12,
    flexShrink: 1,
  },
  topSpacer: {
    flex: 1,
  },
  guardPill: {
    backgroundColor: COLORS.redBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  guardPillText: {
    fontFamily: FONT.bold,
    color: COLORS.accentRed,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  bigWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  bigArea: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  targetText: {
    fontFamily: FONT.extrabold,
    color: '#ffffff',
    fontSize: 44,
    lineHeight: 57,
    letterSpacing: 0.5,
  },
  phoneticText: {
    fontFamily: FONT.regular,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  supplementText: {
    fontFamily: FONT.regular,
    color: COLORS.textMuted,
    fontSize: 13,
  },
  warnBox: {
    backgroundColor: COLORS.redBg,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  warnTitle: {
    fontFamily: FONT.bold,
    color: COLORS.accentRed,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  warnBody: {
    fontFamily: FONT.regular,
    color: COLORS.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagLabel: {
    fontFamily: FONT.bold,
    color: COLORS.accentRed,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  flagValue: {
    fontFamily: FONT.regular,
    color: COLORS.textSecondary,
    fontSize: 10,
    flex: 1,
    marginLeft: 8,
  },
  flagPending: {
    fontSize: 12,
    color: COLORS.accentRed,
  },
  actionWrap: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: FONT.bold,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: COLORS.redBg,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: FONT.bold,
    color: COLORS.accentRed,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    flex: 1,
  },
  swipeHint: {
    fontFamily: FONT.regular,
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});
