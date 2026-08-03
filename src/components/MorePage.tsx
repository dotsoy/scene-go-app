/**
 * V2 更多页（05，Tab「更多」）：入口列表（安全指南/会话历史/API 日志/识别引擎设置/切换国家）。
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT } from '../theme/tokens';

interface MorePageProps {
  onOpenSafety: () => void;
  onOpenHistory: () => void;
  onOpenLogs: () => void;
  onOpenSettings: () => void;
  onSwitchCountry: () => void;
}

const ENTRIES: { key: string; icon: string; title: string; desc: string }[] = [
  { key: 'safety', icon: '🛡️', title: '安全指南', desc: '当前国家紧急电话 / 求助句 / 骗局提示' },
  { key: 'history', icon: '🕘', title: '会话历史', desc: '恢复历史快照的多轮追问' },
  { key: 'logs', icon: '🧾', title: 'API 日志', desc: '接口请求与响应日志' },
  { key: 'settings', icon: '⚙️', title: '识别引擎设置', desc: '切换引擎、配置 API Key' },
  { key: 'country', icon: '🌏', title: '切换国家', desc: '重新选择目的地国家' },
];

export const MorePage: React.FC<MorePageProps> = ({
  onOpenSafety,
  onOpenHistory,
  onOpenLogs,
  onOpenSettings,
  onSwitchCountry,
}) => {
  const handlers: Record<string, () => void> = {
    safety: onOpenSafety,
    history: onOpenHistory,
    logs: onOpenLogs,
    settings: onOpenSettings,
    country: onSwitchCountry,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>更多</Text>
      </View>
      <View style={styles.list}>
        <View style={styles.groupCard}>
          {ENTRIES.map((e, index) => (
            <React.Fragment key={e.key}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity style={styles.row} onPress={handlers[e.key]} activeOpacity={0.7}>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>{e.icon}</Text>
                </View>
                <View style={styles.textBox}>
                  <Text style={styles.rowTitle}>{e.title}</Text>
                  <Text style={styles.rowDesc}>{e.desc}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, paddingTop: 12 },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.textPrimary,
    fontFamily: FONT.regular,
  },
  list: { padding: 20, paddingTop: 8 },
  groupCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginLeft: 62,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.bgCardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  textBox: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, fontFamily: FONT.regular },
  rowDesc: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2, fontFamily: FONT.regular },
  arrow: { fontSize: 16, color: COLORS.textMuted },
});
