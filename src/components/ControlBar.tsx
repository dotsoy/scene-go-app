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
  /** 打开工具箱抽屉（收纳 LOG/对话记录/设置） */
  onOpenTools: () => void;
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
  onOpenTools,
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

      {/* 工具箱入口 */}
      <TouchableOpacity style={[styles.btn, styles.btnMuted]} onPress={onOpenTools} activeOpacity={0.75}>
        <Text style={styles.btnText} numberOfLines={1}>🧰</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(10,10,30,0.85)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    minWidth: 46,
    alignItems: 'center',
  },
  btnMuted: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  btnActive: {
    backgroundColor: 'rgba(76,175,80,0.25)',
  },
  btnActiveSnap: {
    backgroundColor: 'rgba(244,67,54,0.35)',
  },
  btnText: {
    color: '#777',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnTextActive: {
    color: '#81C784',
  },
  btnTextSnap: {
    color: '#ef5350',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
