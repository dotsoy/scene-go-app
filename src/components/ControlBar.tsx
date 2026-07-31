import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ControlBarProps {
  isCameraActive: boolean;
  isMicActive: boolean;
  isCardVisible: boolean;
  onToggleCamera: () => void;
  onCaptureFrame: () => void;
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
  onCaptureFrame,
  onToggleMic,
  onToggleCard,
  onOpenNotes,
  onNextScenario,
}) => {
  return (
    <View style={styles.barContainer}>
      {/* 摄像头开关与实时截图按键 */}
      {isCameraActive ? (
        <TouchableOpacity style={[styles.btn, styles.btnActiveSnap]} onPress={onCaptureFrame} activeOpacity={0.75}>
          <Text style={styles.btnTextSnap} numberOfLines={1}>SNAP & OFF</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.btn, styles.btnMuted]} onPress={onToggleCamera} activeOpacity={0.75}>
          <Text style={styles.btnText} numberOfLines={1}>CAM OFF</Text>
        </TouchableOpacity>
      )}

      {/* 麦克风开关 */}
      <TouchableOpacity
        style={[styles.btn, isMicActive ? styles.btnActive : styles.btnMuted]}
        onPress={onToggleMic}
        activeOpacity={0.75}
      >
        <Text style={[styles.btnText, isMicActive && styles.btnTextActive]} numberOfLines={1}>
          {isMicActive ? 'MIC ON' : 'MIC OFF'}
        </Text>
      </TouchableOpacity>

      {/* FlashCard 开关 */}
      <TouchableOpacity
        style={[styles.btn, isCardVisible ? styles.btnActive : styles.btnMuted]}
        onPress={onToggleCard}
        activeOpacity={0.75}
      >
        <Text style={[styles.btnText, isCardVisible && styles.btnTextActive]} numberOfLines={1}>
          {isCardVisible ? 'CARD ON' : 'CARD OFF'}
        </Text>
      </TouchableOpacity>

      {/* Notes 检索与纪录 */}
      <TouchableOpacity style={[styles.btn, styles.btnMuted]} onPress={onOpenNotes} activeOpacity={0.75}>
        <Text style={styles.btnText} numberOfLines={1}>NOTES</Text>
      </TouchableOpacity>

      {/* 动态切卡按键：仅在 CARD ON 模式下平滑并入动态布局 */}
      {isCardVisible && (
        <TouchableOpacity style={[styles.btn, styles.btnMuted]} onPress={onNextScenario} activeOpacity={0.75}>
          <Text style={styles.btnText} numberOfLines={1}>NEXT</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121214',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8, // 动态间距配比
  },
  btn: {
    flex: 1, // 动态权重自动自适应按键数量 (4个或5个按键均保持完全等宽居中)
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnMuted: {
    backgroundColor: '#1c1c1e',
  },
  btnActive: {
    backgroundColor: '#ffffff',
  },
  btnActiveSnap: {
    backgroundColor: '#2563eb', // 动态截图按钮高亮蓝
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
  btnTextSnap: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
