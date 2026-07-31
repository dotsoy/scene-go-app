import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ControlBarProps {
  isCameraActive: boolean;
  isMicActive: boolean;
  isCardVisible: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleCard: () => void;
  onOpenNotes: () => void;
  onNextScenario: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isCameraActive,
  isMicActive,
  isCardVisible,
  onToggleCamera,
  onToggleMic,
  onToggleCard,
  onOpenNotes,
  onNextScenario,
}) => {
  return (
    <View style={styles.barContainer}>
      {/* 摄像头开关 */}
      <TouchableOpacity
        style={[styles.btn, isCameraActive ? styles.btnActive : styles.btnMuted]}
        onPress={onToggleCamera}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnText, isCameraActive && styles.btnTextActive]}>
          {isCameraActive ? 'CAM ON' : 'CAM OFF'}
        </Text>
      </TouchableOpacity>

      {/* 麦克风开关 */}
      <TouchableOpacity
        style={[styles.btn, isMicActive ? styles.btnActive : styles.btnMuted]}
        onPress={onToggleMic}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnText, isMicActive && styles.btnTextActive]}>
          {isMicActive ? 'MIC ON' : 'MIC OFF'}
        </Text>
      </TouchableOpacity>

      {/* FlashCard 开关 */}
      <TouchableOpacity
        style={[styles.btn, isCardVisible ? styles.btnActive : styles.btnMuted]}
        onPress={onToggleCard}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnText, isCardVisible && styles.btnTextActive]}>
          {isCardVisible ? 'CARD ON' : 'CARD OFF'}
        </Text>
      </TouchableOpacity>

      {/* Notes 检索与纪录 */}
      <TouchableOpacity style={[styles.btn, styles.btnMuted]} onPress={onOpenNotes} activeOpacity={0.7}>
        <Text style={styles.btnText}>NOTES</Text>
      </TouchableOpacity>

      {/* 模拟切卡模式 */}
      <TouchableOpacity style={[styles.btn, styles.btnMuted]} onPress={onNextScenario} activeOpacity={0.7}>
        <Text style={styles.btnText}>NEXT</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#121214',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 12,
    marginBottom: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 62,
  },
  btnMuted: {
    backgroundColor: '#1c1c1e',
  },
  btnActive: {
    backgroundColor: '#ffffff',
  },
  btnText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnTextActive: {
    color: '#000000',
  },
});
