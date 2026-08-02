import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import * as Speech from 'expo-speech';
import { CountrySafety } from '../data/countrySafety';
import { PlaceContext } from '../utils/locationContext';
import { UserProfile } from '../utils/userProfile';

interface SafetyDetailModalProps {
  visible: boolean;
  safety?: CountrySafety | null;
  place?: PlaceContext | null;
  /** 用户档案：决定使领馆信息展示（各国人士） */
  profile?: UserProfile | null;
  onClose: () => void;
}

/** 本地安全信息详情：分节展示 + 一键拨打 + 求助句朗读 */
export const SafetyDetailModal: React.FC<SafetyDetailModalProps> = ({
  visible,
  safety,
  place,
  profile,
  onClose,
}) => {
  const [speaking, setSpeaking] = useState(false);

  // 当地时间 + GMT 偏移（时区来自逆地理编码）
  const localTime = useMemo(() => {
    if (!place?.timezone) return null;
    try {
      const now = new Date();
      const time = new Intl.DateTimeFormat('zh-CN', {
        timeZone: place.timezone,
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'short',
      }).format(now);
      // GMT 偏移：当前 UTC 时间在该时区的偏移
      const shifted = new Intl.DateTimeFormat('en-US', {
        timeZone: place.timezone,
        timeZoneName: 'longOffset',
      }).formatToParts(new Date());
      const offset = shifted.find((p) => p.type === 'timeZoneName')?.value ?? '';
      const cityLabel = place.city ? ` · ${place.city}` : '';
      return `${time}${cityLabel} ${offset}`;
    } catch {
      return null;
    }
  }, [place?.timezone, place?.city, visible]);

  const dial = (number: string) => {
    Linking.openURL(`tel:${number.replace(/[^+\d]/g, '')}`).catch(() => {});
  };

  const speakSos = () => {
    if (!safety) return;
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(safety.sos.local, {
      language: safety.langCode,
      pitch: 1.0,
      rate: 0.8,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  if (!safety) return null;

  const emergencyRows = [
    { label: '警察', number: safety.emergency.police },
    { label: '急救', number: safety.emergency.ambulance },
    { label: '火警', number: safety.emergency.fire },
    ...(safety.emergency.touristPolice
      ? [{ label: '旅游警察', number: safety.emergency.touristPolice }]
      : []),
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{safety.nameZh} · 安全与实用信息</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>关闭</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {localTime && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>当地时间</Text>
                <Text style={styles.sectionBody}>{localTime}</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>紧急电话（一键拨打）</Text>
              {emergencyRows.map((row) => (
                <TouchableOpacity
                  key={row.label}
                  style={styles.dialRow}
                  onPress={() => dial(row.number)}
                >
                  <Text style={styles.dialLabel}>{row.label}</Text>
                  <Text style={styles.dialNumber}>{row.number}</Text>
                  <Text style={styles.dialHint}>拨打 ›</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>求助句（朗读给当地人听）</Text>
              <TouchableOpacity style={styles.sosRow} onPress={speakSos}>
                <Text style={styles.sosLocal}>{safety.sos.local}</Text>
                <Text style={styles.sosPhonetic}>{safety.sos.phonetic}</Text>
                <Text style={styles.sosHint}>{speaking ? '停止朗读' : '朗读 ›'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>使领馆（领事保护）</Text>
              {profile?.nationality === 'CN' && safety.embassy ? (
                <TouchableOpacity style={styles.dialRow} onPress={() => dial(safety.embassy)}>
                  <Text style={styles.dialLabel}>中国驻当地领保热线</Text>
                  <Text style={styles.dialNumber}>{safety.embassy}</Text>
                  <Text style={styles.dialHint}>拨打 ›</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.sectionBody}>
                  请通过您本国驻当地使领馆求助（内置数据暂仅覆盖中国籍用户）。
                </Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>实用信息</Text>
              <Text style={styles.sectionBody}>货币：{safety.currency}</Text>
              <Text style={styles.sectionBody}>电压插座：{safety.voltage}</Text>
              <Text style={styles.sectionBody}>饮用水：{safety.water}</Text>
              <Text style={styles.sectionBody}>小费：{safety.tipping}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>常见骗局提示</Text>
              {safety.scams.map((scam, idx) => (
                <View key={idx} style={styles.scamRow}>
                  <Text style={styles.scamDot}>•</Text>
                  <Text style={styles.scamText}>{scam}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { color: '#ffffff', fontSize: 17, fontWeight: '800', flex: 1 },
  closeBtn: { padding: 6 },
  closeBtnText: { color: '#a1a1aa', fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 16 },
  sectionLabel: { color: '#38bdf8', fontSize: 12, fontWeight: '800', marginBottom: 6 },
  sectionBody: { color: '#d4d4d8', fontSize: 13, lineHeight: 20 },
  dialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  dialLabel: { color: '#a1a1aa', fontSize: 13, flex: 1 },
  dialNumber: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  dialHint: { color: '#38bdf8', fontSize: 12, marginLeft: 10 },
  sosRow: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.4)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  sosLocal: { color: '#34d399', fontSize: 15, fontWeight: '700' },
  sosPhonetic: { color: '#a1a1aa', fontSize: 12, marginTop: 4 },
  sosHint: { color: '#10b981', fontSize: 12, fontWeight: '700', marginTop: 8 },
  scamRow: { flexDirection: 'row', marginBottom: 4 },
  scamDot: { color: '#f59e0b', marginRight: 6 },
  scamText: { color: '#d4d4d8', fontSize: 13, lineHeight: 19, flex: 1 },
});
