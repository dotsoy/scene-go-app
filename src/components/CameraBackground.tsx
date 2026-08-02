import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
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
  contentLayer: {
    flex: 1,
    zIndex: 10,
  },
});
