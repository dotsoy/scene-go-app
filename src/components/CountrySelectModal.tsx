import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COUNTRY_SAFETY } from '../data/countrySafety';
import { PlaceContext } from '../utils/locationContext';
import {
  UserProfile,
  NATIONALITY_OPTIONS,
  LANGUAGE_OPTIONS,
} from '../utils/userProfile';

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

/** 首次启动/手动切换：设置用户档案（国籍+语言）+ 当前国家/地区 */
export const CountrySelectModal: React.FC<CountrySelectModalProps> = ({
  visible,
  detected,
  currentCode,
  profile,
  onClose,
  onConfirm,
}) => {
  const [selected, setSelected] = useState<string>(currentCode ?? '');
  const [nationality, setNationality] = useState<string>('CN');
  const [language, setLanguage] = useState<string>('zh-CN');

  useEffect(() => {
    if (!visible) return;
    // 国家预选：检测结果优先（若在支持列表内），否则当前选择，否则第一个
    const detectedCode = detected?.countryCode ?? null;
    const valid = COUNTRY_SAFETY.some((c) => c.code === detectedCode);
    setSelected(valid ? detectedCode! : (currentCode ?? COUNTRY_SAFETY[0].code));
    // 档案预选：已存档案优先；国籍缺省用检测结果或中国
    if (profile) {
      setNationality(profile.nationality);
      setLanguage(profile.language);
    } else {
      const natValid = NATIONALITY_OPTIONS.some((n) => n.code === detectedCode);
      setNationality(natValid ? detectedCode! : 'CN');
      setLanguage('zh-CN');
    }
  }, [visible, detected, currentCode, profile]);

  const detectedSupported = detected?.countryCode
    ? COUNTRY_SAFETY.some((c) => c.code === detected.countryCode)
    : false;

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected, { nationality, language });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>设置您的档案</Text>
          <Text style={styles.subtitle}>SceneGo 面向各国人士，请选择您的国籍与语言</Text>

          {/* 档案：国籍 */}
          <Text style={styles.sectionLabel}>您的国籍</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {NATIONALITY_OPTIONS.map((n) => {
              const active = nationality === n.code;
              return (
                <TouchableOpacity
                  key={n.code}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setNationality(n.code)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{n.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 档案：语言 */}
          <Text style={styles.sectionLabel}>您的语言</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {LANGUAGE_OPTIONS.map((l) => {
              const active = language === l.code;
              return (
                <TouchableOpacity
                  key={l.code}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setLanguage(l.code)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{l.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.sectionLabel, styles.countryLabel]}>当前国家/地区（生成安全信息卡片）</Text>

          {detected && (
            <View style={styles.detectedBox}>
              <Text style={styles.detectedLabel}>检测到您当前所在</Text>
              <Text style={styles.detectedName}>
                {detected.country ?? `${detected.lat.toFixed(3)}, ${detected.lng.toFixed(3)}`}
              </Text>
              {detectedSupported ? (
                <TouchableOpacity
                  style={styles.detectedUseBtn}
                  onPress={() => setSelected(detected.countryCode!)}
                >
                  <Text style={styles.detectedUseText}>使用检测结果</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.detectedUnsupported}>
                  当前国家暂未收录，请从下方列表选择
                </Text>
              )}
            </View>
          )}

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {COUNTRY_SAFETY.map((c) => {
              const isSelected = selected === c.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.row, isSelected && styles.rowSelected]}
                  onPress={() => setSelected(c.code)}
                >
                  <View style={styles.rowTextWrap}>
                    <Text style={[styles.rowName, isSelected && styles.rowNameSelected]}>
                      {c.nameZh} · {c.nameEn}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {c.currency} · {c.voltage.split(' · ')[0]}
                    </Text>
                  </View>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>确认</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  title: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#a1a1aa', fontSize: 12, marginTop: 4, marginBottom: 12 },
  sectionLabel: { color: '#38bdf8', fontSize: 12, fontWeight: '800', marginTop: 10, marginBottom: 8 },
  countryLabel: { marginTop: 16 },
  chipRow: { flexGrow: 0 },
  chip: {
    backgroundColor: '#27272a',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
  },
  chipActive: { backgroundColor: 'rgba(56,189,248,0.2)' },
  chipText: { color: '#a1a1aa', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#38bdf8' },
  detectedBox: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.35)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  detectedLabel: { color: '#a1a1aa', fontSize: 11 },
  detectedName: { color: '#34d399', fontSize: 16, fontWeight: '700', marginTop: 2, marginBottom: 8 },
  detectedUseBtn: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  detectedUseText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  detectedUnsupported: { color: '#f59e0b', fontSize: 12 },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  rowSelected: { backgroundColor: 'rgba(56,189,248,0.12)' },
  rowTextWrap: { flex: 1 },
  rowName: { color: '#d4d4d8', fontSize: 14, fontWeight: '600' },
  rowNameSelected: { color: '#38bdf8' },
  rowMeta: { color: '#71717a', fontSize: 11, marginTop: 2 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: '#38bdf8' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#38bdf8' },
  footer: { flexDirection: 'row', gap: 10, marginTop: 14 },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#38bdf8',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#0c0c0e', fontSize: 15, fontWeight: '800' },
  closeBtn: {
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  closeBtnText: { color: '#a1a1aa', fontSize: 14, fontWeight: '600' },
});
