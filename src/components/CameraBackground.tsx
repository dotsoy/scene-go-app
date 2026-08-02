import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CameraBackgroundProps {
  children?: React.ReactNode;
}

/** 主屏背景：近黑渐变（相机取景已内嵌到卡片区域，见 CameraPreviewBox） */
export const CameraBackground: React.FC<CameraBackgroundProps> = ({ children }) => {
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
  contentLayer: {
    flex: 1,
  },
});
