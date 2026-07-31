import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';

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
