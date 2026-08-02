import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import { COLORS, FONT } from '../theme/tokens';

interface CameraPreviewBoxProps {
  cameraRef?: React.RefObject<any>;
  onCameraReady?: () => void;
}

/** 内嵌取景预览（卡片区域内）：相机预览 + 取景框引导（spec §4 02 缩略版） */
export const CameraPreviewBox: React.FC<CameraPreviewBoxProps> = ({
  cameraRef,
  onCameraReady,
}) => {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    // 仅模拟器启用就绪保底：模拟器无物理摄像头，onCameraReady 可能永不触发；真机必须等原生回调
    if (!Device.isDevice) {
      const timer = setTimeout(() => onCameraReady?.(), 500);
      return () => clearTimeout(timer);
    }
  }, [onCameraReady]);

  if (!permission?.granted) {
    requestPermission();
  }

  return (
    <View style={styles.box}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onCameraReady={onCameraReady}
      >
        <View style={styles.dim} />
        {/* 取景引导 */}
        <View style={styles.guideLayer} pointerEvents="none">
          <View style={styles.guideFrame}>
            <Text style={styles.guideFrameText}>对准画面中的文字区域</Text>
          </View>
          <Text style={styles.guideHint}>
            {'对准菜单 / 标牌 / 售票机\n双击 CAM 按钮拍照分析'}
          </Text>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#101014',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 9, 11, 0.45)',
  },
  guideLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideFrame: {
    width: 240,
    height: 180,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideFrameText: {
    fontFamily: FONT.regular,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  guideHint: {
    fontFamily: FONT.regular,
    color: '#4a4a52',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 14,
  },
});
