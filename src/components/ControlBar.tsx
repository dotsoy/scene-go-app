import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ControlBarBtn } from './ControlBarBtn';
import { useDoubleTap } from '../utils/useDoubleTap';
import { COLORS, LAYOUT } from '../theme/tokens';

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

/**
 * 底部控制栏（spec §4 01/02）：
 * - 主界面：72pt，5 按钮 space-between
 * - 相机态：100pt，SNAP 大按钮 + MIC/CARD，隐藏 NOTES/MORE
 */
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
  // SNAP：双击 = 拍照+云端分析+关闭相机；单击 = 仅关闭相机
  const handleSnapPress = useDoubleTap(onCancelCamera, onCaptureFrame);
  // MIC：双击 = 停止+生成卡；单击 = 仅停止
  const handleMicPress = useDoubleTap(onMicSingleTap, onMicDoubleTap);
  const micPress = isMicActive ? handleMicPress : onStartMic;

  // 相机态：SNAP 大按钮 + 右侧 MIC/CARD，取景时隐藏 NOTES/MORE
  if (isCameraActive) {
    return (
      <View style={[styles.bar, styles.barCamera]}>
        <ControlBarBtn
          large
          danger
          label="SNAP"
          hint="双击分析 · 单击关闭"
          onPress={handleSnapPress}
        />
        <View style={styles.cameraSide}>
          <ControlBarBtn
            label={isMicActive ? 'MIC ON' : 'MIC OFF'}
            active={isMicActive}
            onPress={micPress}
          />
          <ControlBarBtn
            label={isCardVisible ? 'CARD ON' : 'CARD OFF'}
            active={isCardVisible}
            onPress={onToggleCard}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bar}>
      <ControlBarBtn label="CAM OFF" onPress={onToggleCamera} />
      <ControlBarBtn
        label={isMicActive ? 'MIC ON' : 'MIC OFF'}
        active={isMicActive}
        hint={isMicActive ? '双击生成卡 · 单击关闭' : undefined}
        onPress={micPress}
      />
      <ControlBarBtn
        label={isCardVisible ? 'CARD ON' : 'CARD OFF'}
        active={isCardVisible}
        onPress={onToggleCard}
      />
      <ControlBarBtn label="NOTES" onPress={onOpenNotes} />
      <ControlBarBtn label="MORE" onPress={onOpenTools} />
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: LAYOUT.mainBarHeight,
    // 中性炭灰（贴近 bgCard），比纯黑更有层次，且不带蓝调
    backgroundColor: 'rgba(18,18,20,0.92)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  barCamera: {
    height: LAYOUT.cameraBarHeight,
  },
  cameraSide: {
    flexDirection: 'row',
    gap: 10,
  },
});
