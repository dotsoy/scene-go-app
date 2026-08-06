import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COUNTRY_SAFETY } from '../data/countrySafety';
import { PlaceContext } from '../utils/locationContext';
import {
  UserProfile,
  NATIONALITY_OPTIONS,
  LANGUAGE_OPTIONS,
} from '../utils/userProfile';
import { COLORS, FONT } from '../theme/tokens';

interface CountrySelectModalProps {
  visible: boolean;
  /** 首次启动自动检测到的位置（可为 null：未授权/失败） */
  detected?: PlaceContext | null;
  /** 当前已选国家码（手动切换时预选） */
  currentCode?: string | null;
  /** 已保存的用户档案（手动打开时预选） */
  profile?: UserProfile | null;
  onClose: () => void;
  onConfirm: (code: string, profile: UserProfile) => void;
}

const GRID_FIRST = 6; // 首屏网格 2×3，其余由「更多」展开

/** 首次启动/手动切换：目的地国家（网格）+ 用户档案（国籍/语言）—— spec §4 06 */
export const CountrySelectModal: React.FC<CountrySelectModalProps> = ({
  visible,
  detected,
  currentCode,
  profile,
  onClose,
  onConfirm,
}) => {
  const [selected, setSelected] = useState<string>(currentCode ?? '');
  const [showAll, setShowAll] = useState(false);
  const [nationality, setNationality] = useState<string>('CN');
  const [language, setLanguage] = useState<string>('zh-CN');
  const [expandedCell, setExpandedCell] = useState<'nationality' | 'language' | null>(null);

  useEffect(() => {
    if (!visible) return;
    const detectedCode = detected?.countryCode ?? null;
    const detectedValid = COUNTRY_SAFETY.some((c) => c.code === detectedCode);
    const currentValid = currentCode ? COUNTRY_SAFETY.some((c) => c.code === currentCode) : false;
    // 手动切换优先保留当前目的地；仅首次启动（无当前选择）时预选 GPS 检测国家
    setSelected(currentValid ? currentCode! : detectedValid ? detectedCode! : COUNTRY_SAFETY[0].code);
    setShowAll(false);
    setExpandedCell(null);
    if (profile) {
      setNationality(profile.nationality);
      setLanguage(profile.language);
    } else {
      const natValid = NATIONALITY_OPTIONS.some((n) => n.code === detectedCode);
      setNationality(natValid ? detectedCode! : 'CN');
      setLanguage('zh-CN');
    }
  }, [visible, detected, currentCode, profile]);

  const gridCountries = showAll ? COUNTRY_SAFETY : COUNTRY_SAFETY.slice(0, GRID_FIRST);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ScrollView style={styles.cardScroll} contentContainerStyle={styles.card} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>设置目的地国家 / 地区</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.headerClose}
              accessibilityRole="button"
              accessibilityLabel="关闭"
            >
              <Text style={styles.headerCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* GPS 检测横幅 */}
          {detected && (
            <View style={styles.gpsBanner}>
              <View style={[styles.gpsDot, styles.dotGreen]} />
              <Text style={styles.gpsText}>
                检测到当前位置：{detected.country ?? `${detected.lat.toFixed(3)}, ${detected.lng.toFixed(3)}`}
                {detected.city ? `（${detected.city}）` : ''}
              </Text>
            </View>
          )}

          {/* 目的地国家网格 */}
          <Text style={styles.sectionLabel}>目的地</Text>
          <View style={styles.grid}>
            {gridCountries.map((c) => {
              const active = selected === c.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelected(c.code)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                    {c.nameZh}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {!showAll && (
              <TouchableOpacity
                style={styles.chip}
                onPress={() => setShowAll(true)}
                accessibilityRole="button"
              >
                <Text style={styles.chipText}>更多</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 用户档案 */}
          <Text style={styles.sectionLabel}>用户档案</Text>
          <View style={styles.profileRow}>
            <TouchableOpacity
              style={styles.profileCell}
              onPress={() => setExpandedCell(expandedCell === 'nationality' ? null : 'nationality')}
              accessibilityRole="button"
              accessibilityLabel="选择国籍"
            >
              <Text style={styles.profileLabel}>国籍</Text>
              <Text style={styles.profileValue}>
                {NATIONALITY_OPTIONS.find((n) => n.code === nationality)?.name ?? nationality}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileCell}
              onPress={() => setExpandedCell(expandedCell === 'language' ? null : 'language')}
              accessibilityRole="button"
              accessibilityLabel="选择语言"
            >
              <Text style={styles.profileLabel}>语言</Text>
              <Text style={styles.profileValue}>
                {LANGUAGE_OPTIONS.find((l) => l.code === language)?.name ?? language}
              </Text>
            </TouchableOpacity>
          </View>
          {expandedCell === 'nationality' && (
            <View style={styles.expandWrap}>
              {NATIONALITY_OPTIONS.map((n) => (
                <TouchableOpacity
                  key={n.code}
                  style={[styles.miniChip, nationality === n.code && styles.miniChipActive]}
                  onPress={() => {
                    setNationality(n.code);
                    setExpandedCell(null);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: nationality === n.code }}
                >
                  <Text style={[styles.miniChipText, nationality === n.code && styles.miniChipTextActive]}>{n.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {expandedCell === 'language' && (
            <View style={styles.expandWrap}>
              {LANGUAGE_OPTIONS.map((l) => (
                <TouchableOpacity
                  key={l.code}
                  style={[styles.miniChip, language === l.code && styles.miniChipActive]}
                  onPress={() => {
                    setLanguage(l.code);
                    setExpandedCell(null);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: language === l.code }}
                >
                  <Text style={[styles.miniChipText, language === l.code && styles.miniChipTextActive]}>{l.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 确认 */}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => selected && onConfirm(selected, { nationality, language })}
            accessibilityRole="button"
          >
            <Text style={styles.confirmBtnText}>确认并生成安全卡</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 28,
  },
  cardScroll: { flexGrow: 0 },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontFamily: FONT.bold, color: '#ffffff', fontSize: 16 },
  headerClose: { padding: 4 },
  headerCloseText: { color: COLORS.textSecondary, fontSize: 16 },
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.12)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  gpsDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  dotGreen: { backgroundColor: '#10b981' },
  gpsText: { fontFamily: FONT.regular, color: '#34d399', fontSize: 12, flex: 1 },
  sectionLabel: {
    fontFamily: FONT.bold,
    color: COLORS.textTertiary,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    flexBasis: '31%',
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: 'rgba(79,195,247,0.18)',
    borderColor: COLORS.accentBlue,
  },
  chipText: { fontFamily: FONT.semibold, color: COLORS.textTertiary, fontSize: 12 },
  chipTextActive: { color: COLORS.accentBlue },
  profileRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  profileCell: {
    flex: 1,
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  profileLabel: { fontFamily: FONT.regular, color: COLORS.textTertiary, fontSize: 10 },
  profileValue: { fontFamily: FONT.semibold, color: COLORS.textPrimary, fontSize: 13, marginTop: 2 },
  expandWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  miniChip: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  miniChipActive: { backgroundColor: 'rgba(79,195,247,0.18)' },
  miniChipText: { fontFamily: FONT.regular, color: COLORS.textTertiary, fontSize: 11 },
  miniChipTextActive: { color: COLORS.accentBlue },
  confirmBtn: {
    backgroundColor: COLORS.accentBlue,
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  confirmBtnText: { fontFamily: FONT.bold, color: '#0a0a1e', fontSize: 14 },
});
