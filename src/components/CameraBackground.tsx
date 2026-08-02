import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import { COLORS, FONT } from '../theme/tokens';
interface CameraBackgroundProps {
  isCameraActive: boolean;
  cameraRef?: React.RefObject<any>;
  onCameraReady?: () => void;
  children?: React.ReactNode;
}

export const CameraBackground: React.FC<CameraBackgroundProps> = ({
  isCameraActive,
  cameraRef,
  onCameraReady,
  children,
}) => {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    // 仅模拟器启用就绪保底：模拟器无物理摄像头，onCameraReady 可能永不触发；真机必须等原生回调
    if (isCameraActive && !Device.isDevice) {
      const timer = setTimeout(() => {
        onCameraReady?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isCameraActive, onCameraReady]);
  if (isCameraActive) {
    if (!permission?.granted) {
      requestPermission();
    }
    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onCameraReady={onCameraReady}
        >
          <View style={styles.cameraOverlay} />
          {/* 取景引导：居中提示 + 取景框（spec §4 02） */}
          <View style={styles.guideLayer} pointerEvents="none">
            <Text style={styles.guideCenterHint}>
              {'[ 相机取景画面 ]\n对准菜单 / 标牌 / 售票机\n双击 SNAP 拍照分析'}
            </Text>
            <View style={styles.guideFrame}>
              <Text style={styles.guideFrameText}>对齐画面中的文字区域</Text>
            </View>
          </View>
        </CameraView>
        <View style={styles.contentLayer}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#09090b', '#18181b', '#09090b']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.contentLayer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 9, 11, 0.45)',
  },
  guideLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideCenterHint: {
    fontFamily: FONT.regular,
    color: '#4a4a52',
    fontSize: 14,
    lineHeight: 25,
    textAlign: 'center',
    marginBottom: 18,
  },
  guideFrame: {
    width: 340,
    height: 300,
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
  contentLayer: {
    flex: 1,
    zIndex: 10,
  },
});
