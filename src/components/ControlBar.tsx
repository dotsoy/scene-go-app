import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDoubleTap } from '../utils/useDoubleTap';

interface ControlBarProps {
  isCameraActive: boolean;
  isMicActive: boolean;
  isCardVisible: boolean;
  onToggleCamera: () => void;
  onCaptureFrame: () => void;
  /** 相机开启时取消：退出取景但不触发云端分析 */
  onCancelCamera: () => void;
  /** 麦克风启动（MIC OFF 态点按） */
  onStartMic: () => void;
  /** 麦克风单击：停止转录，不做任何操作 */
  onMicSingleTap: () => void;
  /** 麦克风双击：停止转录，理解意图生成表达卡 */
  onMicDoubleTap: () => void;
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
  onCancelCamera,
  onStartMic,
  onMicSingleTap,
  onMicDoubleTap,
  onToggleCard,
  onOpenNotes,
  onOpenTools,
}) => {
  const handleSnapPress = useDoubleTap(onCancelCamera, onCaptureFrame);
  const handleMicPress = useDoubleTap(onMicSingleTap, onMicDoubleTap);
  return (
    <View style={styles.barContainer}>
      {/* 摄像头开关：双击 = 拍照+分析+关相机；单击 = 仅关闭不分析 */}
      {isCameraActive ? (
        <TouchableOpacity
          style={[styles.btn, styles.btnActiveSnap]}
          onPress={handleSnapPress}
          activeOpacity={0.75}
        >
          <Text style={styles.btnTextSnap} numberOfLines={1}>SNAP</Text>
          <Text style={styles.btnHint} numberOfLines={1}>双击分析 · 单击关闭</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.btn, styles.btnMuted]} onPress={onToggleCamera} activeOpacity={0.75}>
          <Text style={styles.btnText} numberOfLines={1}>CAM OFF</Text>
        </TouchableOpacity>
      )}

      {/* 麦克风开关：双击 = 停止+理解意图生成卡；单击 = 仅关闭不操作 */}
      {isMicActive ? (
        <TouchableOpacity
          style={[styles.btn, styles.btnActive]}
          onPress={handleMicPress}
          activeOpacity={0.75}
        >
          <Text style={[styles.btnText, styles.btnTextActive]} numberOfLines={1}>MIC</Text>
          <Text style={styles.btnHint} numberOfLines={1}>双击生成卡 · 单击关闭</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.btn, styles.btnMuted]}
          onPress={onStartMic}
          activeOpacity={0.75}
        >
          <Text style={styles.btnText} numberOfLines={1}>MIC OFF</Text>
        </TouchableOpacity>
      )}

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
        <Text style={styles.btnText} numberOfLines={1}>MORE</Text>
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
  btnHint: {
    color: '#9ca3af',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
});
