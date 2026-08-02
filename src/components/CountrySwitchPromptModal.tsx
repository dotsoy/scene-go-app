import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface CountrySwitchPromptModalProps {
  visible: boolean;
  /** GPS 检测到的国家中文名 */
  detectedName: string;
  /** 当前缓存的国家中文名 */
  currentName: string;
  onSwitch: () => void;
  onKeep: () => void;
}

/** 再次打开 App：GPS 国家与缓存不一致时询问是否切换 */
export const CountrySwitchPromptModal: React.FC<CountrySwitchPromptModalProps> = ({
  visible,
  detectedName,
  currentName,
  onSwitch,
  onKeep,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onKeep}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>检测到位置变化</Text>
          <Text style={styles.body}>
            您当前在 <Text style={styles.highlight}>{detectedName}</Text>
            ，而设置的国家/地区为 {currentName}。
            是否切换并生成对应的安全信息卡片？
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.switchBtn} onPress={onSwitch}>
              <Text style={styles.switchBtnText}>切换</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keepBtn} onPress={onKeep}>
              <Text style={styles.keepBtnText}>保持</Text>
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
  },
  title: { color: '#ffffff', fontSize: 17, fontWeight: '800', marginBottom: 10 },
  body: { color: '#d4d4d8', fontSize: 14, lineHeight: 21 },
  highlight: { color: '#38bdf8', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  switchBtn: {
    flex: 1,
    backgroundColor: '#38bdf8',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchBtnText: { color: '#0c0c0e', fontSize: 15, fontWeight: '800' },
  keepBtn: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  keepBtnText: { color: '#a1a1aa', fontSize: 15, fontWeight: '700' },
});
