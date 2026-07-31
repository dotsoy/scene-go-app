import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface CameraBackgroundProps {
  isCameraActive: boolean;
  children?: React.ReactNode;
}

export const CameraBackground: React.FC<CameraBackgroundProps> = ({ isCameraActive, children }) => {
  const [permission, requestPermission] = useCameraPermissions();

  if (isCameraActive) {
    if (!permission?.granted) {
      requestPermission();
    }
    return (
      <View style={styles.container}>
        <CameraView style={StyleSheet.absoluteFillObject} facing="back">
          {/* 半透明遮罩层提升前景 UI 可读性 */}
          <View style={styles.cameraOverlay} />
        </CameraView>
        <View style={styles.contentLayer}>{children}</View>
      </View>
    );
  }

  // 关闭摄像头后的默认高质感深色渐变背景
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
    backgroundColor: 'rgba(9, 9, 11, 0.45)', // 45% 暗化网格，确保大字卡对比度
  },
  contentLayer: {
    flex: 1,
    zIndex: 10,
  },
});
