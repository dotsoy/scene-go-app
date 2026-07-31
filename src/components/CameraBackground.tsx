import React from 'react';
import { View, StyleSheet, ImageBackground, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface CameraBackgroundProps {
  isCameraActive: boolean;
  capturedImageUri?: string | null;
  cameraRef?: React.RefObject<any>;
  children?: React.ReactNode;
}

export const CameraBackground: React.FC<CameraBackgroundProps> = ({
  isCameraActive,
  capturedImageUri,
  cameraRef,
  children,
}) => {
  const [permission, requestPermission] = useCameraPermissions();

  if (isCameraActive) {
    if (!permission?.granted) {
      requestPermission();
    }
    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back">
          <View style={styles.cameraOverlay} />
        </CameraView>
        <View style={styles.contentLayer}>{children}</View>
      </View>
    );
  }

  // 如果有捕获的截图帧，渲染冻结帧画面作为背景
  if (capturedImageUri) {
    return (
      <View style={styles.container}>
        <ImageBackground source={{ uri: capturedImageUri }} style={StyleSheet.absoluteFillObject}>
          <View style={styles.snapshotOverlay} />
        </ImageBackground>
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
    backgroundColor: 'rgba(9, 9, 11, 0.45)',
  },
  snapshotOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 9, 11, 0.65)', // 截图冻结帧 65% 暗化
  },
  contentLayer: {
    flex: 1,
    zIndex: 10,
  },
});
