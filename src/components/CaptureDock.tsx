import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ControlBarBtn } from './ControlBarBtn';
import { useDoubleTap } from '../utils/useDoubleTap';

interface CaptureDockProps {
  /** 相机取景中（CAM 激活态） */
  isCameraActive: boolean;
  /** 麦克风录音中（MIC 激活态） */
  isMicActive: boolean;
  /** CAM：空闲点按=开启取景；取景中单击=关闭，双击=拍照分析成卡 */
  onCamTap: () => void;
  onCamDoubleTap: () => void;
  onCamSingleTap: () => void;
  /** MIC：空闲点按=开始录音；录音中单击=仅停止，双击=停止+生成卡 */
  onMicTap: () => void;
  onMicDoubleTap: () => void;
  onMicSingleTap: () => void;
}

/**
 * 卡片下方的输入双按钮（CAM 拍照 / MIC 说话）：
 * 空闲点按开启；激活后双击=提取信息直接生成卡，单击=仅关闭。
 */
export const CaptureDock: React.FC<CaptureDockProps> = ({
  isCameraActive,
  isMicActive,
  onCamTap,
  onCamDoubleTap,
  onCamSingleTap,
  onMicTap,
  onMicDoubleTap,
  onMicSingleTap,
}) => {
  const handleCamPress = useDoubleTap(onCamSingleTap, onCamDoubleTap);
  const handleMicPress = useDoubleTap(onMicSingleTap, onMicDoubleTap);

  return (
    <View style={styles.dock}>
      <ControlBarBtn
        tall
        danger={isCameraActive}
        label="CAM 拍照"
        hint={isCameraActive ? '双击拍照 · 单击关闭' : '拍摄场景生成表达卡'}
        onPress={isCameraActive ? handleCamPress : onCamTap}
      />
      <ControlBarBtn
        tall
        active={isMicActive}
        label="MIC 说话"
        hint={isMicActive ? '双击生成卡 · 单击关闭' : '说出需求生成表达卡'}
        onPress={isMicActive ? handleMicPress : onMicTap}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  dock: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
  },
});
