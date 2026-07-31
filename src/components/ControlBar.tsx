import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ControlBarProps {
  isCameraActive: boolean;
  isMicActive: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onOpenNotes: () => void;
  onNextScenario: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isCameraActive,
  isMicActive,
  onToggleCamera,
  onToggleMic,
  onOpenNotes,
  onNextScenario,
}) => {
  return (
    <View style={styles.barContainer}>
      {/* 摄像头开关按键 */}
      <TouchableOpacity
        style={[styles.actionBtn, isCameraActive ? styles.activeCameraBtn : styles.inactiveBtn]}
        onPress={onToggleCamera}
        activeOpacity={0.7}
      >
        <Text style={styles.btnIcon}>{isCameraActive ? '📷' : '📷'}</Text>
        <Text style={styles.btnLabel}>{isCameraActive ? '实景开' : '实景关'}</Text>
      </TouchableOpacity>

      {/* 麦克风开关按键 */}
      <TouchableOpacity
        style={[styles.actionBtn, isMicActive ? styles.activeMicBtn : styles.inactiveBtn]}
        onPress={onToggleMic}
        activeOpacity={0.7}
      >
        <Text style={styles.btnIcon}>{isMicActive ? '🎙️' : '🔇'}</Text>
        <Text style={styles.btnLabel}>{isMicActive ? '同传开' : '同传静音'}</Text>
      </TouchableOpacity>

      {/* Notes 快捷记录与检索按键 */}
      <TouchableOpacity style={[styles.actionBtn, styles.notesBtn]} onPress={onOpenNotes} activeOpacity={0.7}>
        <Text style={styles.btnIcon}>📝</Text>
        <Text style={styles.btnLabel}>Notes 记录</Text>
      </TouchableOpacity>

      {/* 模拟切卡快捷入口 */}
      <TouchableOpacity style={[styles.actionBtn, styles.switchBtn]} onPress={onNextScenario} activeOpacity={0.7}>
        <Text style={styles.btnIcon}>🔄</Text>
        <Text style={styles.btnLabel}>切场景</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 20, 0.95)',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    minWidth: 72,
  },
  inactiveBtn: {
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
  },
  activeCameraBtn: {
    backgroundColor: '#059669', // 翡翠绿
  },
  activeMicBtn: {
    backgroundColor: '#dc2626', // 亮红
  },
  notesBtn: {
    backgroundColor: '#7c3aed', // 优雅紫
  },
  switchBtn: {
    backgroundColor: 'rgba(63, 63, 70, 0.9)',
  },
  btnIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  btnLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
