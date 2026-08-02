import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ControlBarBtn } from './ControlBarBtn';
import { LAYOUT } from '../theme/tokens';

interface ControlBarProps {
  isCardVisible: boolean;
  onToggleCard: () => void;
  onOpenNotes: () => void;
  /** 打开工具箱抽屉（收纳 LOG/对话记录/设置） */
  onOpenTools: () => void;
}

/**
 * 底部控制栏（卡片中心化后精简版）：CAM/MIC 已上移到卡片下方的 CaptureDock，
 * 此处仅保留状态开关与入口：CARD / NOTES / MORE。
 */
export const ControlBar: React.FC<ControlBarProps> = ({
  isCardVisible,
  onToggleCard,
  onOpenNotes,
  onOpenTools,
}) => {
  return (
    <View style={styles.bar}>
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
    // 无独立底色/描边：按钮直接浮在主背景（渐变全屏）上
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
});
