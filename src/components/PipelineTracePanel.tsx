/**
 * 管线实时反馈悬浮面板（__DEV__）：右下角悬浮按钮 → 底部面板。
 * 展示真实数据流：定位(GPS) → 场景推理 → 推荐输出 → 成卡 trace。
 * 数据源：pipelineTraceStore（App/expressionEngine 写入），本组件只读。
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useStore } from 'zustand';
import { COLORS, FONT, LAYOUT } from '../theme/tokens';
import { pipelineTraceStore } from '../core/pipelineTrace';
import { CardTrace } from '../core/pipelineTrace';

interface PipelineTracePanelProps {
  onRelocate: () => void;
}

const fmtTime = (at: number) => {
  const d = new Date(at);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const PATH_META: Record<CardTrace['path'], { label: string; color: string }> = {
  sop: { label: '离线SOP', color: COLORS.accentGreen },
  vlm: { label: '云端VLM', color: COLORS.accentBlue },
  capsule: { label: '场景胶囊', color: COLORS.accentYellow },
  none: { label: '未命中', color: COLORS.accentRed },
};

export const PipelineTracePanel: React.FC<PipelineTracePanelProps> = ({ onRelocate }) => {
  const [open, setOpen] = React.useState(false);
  const place = useStore(pipelineTraceStore, (s) => s.place);
  const scene = useStore(pipelineTraceStore, (s) => s.scene);
  const capsules = useStore(pipelineTraceStore, (s) => s.capsules);
  const traces = useStore(pipelineTraceStore, (s) => s.traces);

  return (
    <>
      {/* 悬浮入口 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="管线反馈"
      >
        <Text style={styles.fabIcon}>🧭</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>管线实时反馈（__DEV__）</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn} accessibilityRole="button">
                <Text style={styles.closeText}>关闭</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
              {/* ① 定位 */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>① 定位 · GPS</Text>
                {place ? (
                  <>
                    <Text style={styles.mono}>坐标 {place.lat.toFixed(4)}, {place.lng.toFixed(4)}</Text>
                    <Text style={styles.row}>
                      {[place.city, place.region, place.country].filter(Boolean).join(' · ') || '—'}{place.timezone ? ` · ${place.timezone}` : ''}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.row, styles.muted]}>未授权或定位失败（无 GPS 数据）</Text>
                )}
                <TouchableOpacity style={styles.relocateBtn} onPress={onRelocate} activeOpacity={0.8} accessibilityRole="button">
                  <Text style={styles.relocateText}>重新定位</Text>
                </TouchableOpacity>
              </View>

              {/* ② 场景推理 */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>② 场景推理</Text>
                {scene ? (
                  <>
                    <Text style={styles.row}>
                      命中场景 <Text style={[styles.mono, { color: COLORS.accentGreen }]}>{scene.key.toUpperCase()}</Text>
                    </Text>
                    <Text style={[styles.row, styles.muted]}>{scene.matched}</Text>
                  </>
                ) : (
                  <Text style={[styles.row, styles.muted]}>未命中场景（无推荐）</Text>
                )}
              </View>

              {/* ③ 推荐输出 */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>③ 推荐输出</Text>
                {capsules.length > 0 ? (
                  <Text style={styles.row}>{capsules.join(' · ')}</Text>
                ) : (
                  <Text style={[styles.row, styles.muted]}>无推荐 → 胶囊条不显示</Text>
                )}
              </View>

              {/* ④ 成卡 trace */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>④ 成卡 trace（最近 {traces.length} 条）</Text>
                {traces.length === 0 ? (
                  <Text style={[styles.row, styles.muted]}>暂无（在对话页输入一句话即可产生）</Text>
                ) : (
                  traces.map((t, i) => (
                    <View key={i} style={styles.traceRow}>
                      <Text style={[styles.tracePath, { color: PATH_META[t.path].color }]}>
                        [{PATH_META[t.path].label}]
                      </Text>
                      <View style={styles.traceBody}>
                        <Text style={styles.traceInput} numberOfLines={1}>
                          {t.input || '（胶囊触发）'}
                        </Text>
                        <Text style={styles.traceMeta} numberOfLines={2}>
                          {t.category} · {t.targetText || '无大字'}{t.steps > 0 ? ` · ${t.steps} 步` : ''}{t.menu ? ` · ${t.menu}` : ''}
                        </Text>
                      </View>
                      <Text style={styles.traceTime}>{fmtTime(t.at)}</Text>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: LAYOUT.tabBarHeight + LAYOUT.bottomSafeArea + 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgBar,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  fabIcon: {
    fontSize: 18,
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.mask,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bgBar,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '78%',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: LAYOUT.bottomSafeArea + 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    fontFamily: FONT.bold,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  closeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeText: {
    fontFamily: FONT.regular,
    color: COLORS.accentBlue,
    fontSize: 12,
  },
  body: {
    gap: 12,
    paddingBottom: 8,
  },
  section: {
    gap: 4,
  },
  sectionLabel: {
    fontFamily: FONT.bold,
    color: COLORS.accentCyan,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  row: {
    fontFamily: FONT.regular,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  mono: {
    fontFamily: FONT.mono,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  muted: {
    color: COLORS.textMuted,
  },
  relocateBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
  },
  relocateText: {
    fontFamily: FONT.semibold,
    color: COLORS.textPrimary,
    fontSize: 11,
  },
  traceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.bgCard,
    borderRadius: 8,
    padding: 8,
  },
  tracePath: {
    fontFamily: FONT.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  traceBody: {
    flex: 1,
    gap: 2,
  },
  traceInput: {
    fontFamily: FONT.regular,
    color: COLORS.textPrimary,
    fontSize: 11,
  },
  traceMeta: {
    fontFamily: FONT.regular,
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  traceTime: {
    fontFamily: FONT.mono,
    color: COLORS.textTertiary,
    fontSize: 9,
  },
});
