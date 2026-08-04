import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
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

  // 权限请求移入 effect：渲染期直接调用会在拒绝后每次渲染空转重试（iOS「不再次询问」后无意义）
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    // 仅模拟器启用就绪保底：模拟器无物理摄像头，onCameraReady 可能永不触发；真机必须等原生回调
    if (!Device.isDevice) {
      const timer = setTimeout(() => onCameraReady?.(), 500);
      return () => clearTimeout(timer);
    }
  }, [onCameraReady]);

  // 权限状态未就绪：保持黑底加载
  if (!permission) {
    return (
      <View style={styles.box}>
        <ActivityIndicator size="large" color={COLORS.textMuted} style={StyleSheet.absoluteFill} />
      </View>
    );
  }

  // 权限被拒：给出明确引导（可再次询问 → 重试；否则 → 系统设置）
  if (!permission.granted) {
    return (
      <View style={styles.box}>
        <View style={styles.deniedLayer}>
          <Text style={styles.deniedTitle}>需要相机权限</Text>
          <Text style={styles.deniedHint}>
            {permission.canAskAgain
              ? '授权相机权限后即可对准菜单 / 标牌 / 售票机拍照'
              : '相机权限已被拒绝，请前往系统设置开启后重试'}
          </Text>
          <TouchableOpacity
            style={styles.deniedBtn}
            onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
            accessibilityRole="button"
            accessibilityLabel={permission.canAskAgain ? '重新授权相机权限' : '前往系统设置开启相机权限'}
          >
            <Text style={styles.deniedBtnText}>
              {permission.canAskAgain ? '重新授权' : '前往系统设置'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={styles.box}
      accessible
      accessibilityLabel="相机取景预览：对准菜单、标牌或售票机中的文字区域，单击 SNAP 按钮拍照发送"
    >
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onCameraReady={onCameraReady}
      >
        <View style={styles.dim} />
        {/* 取景引导 */}
        <View style={styles.guideLayer} pointerEvents="none">
          <Text style={styles.guideText}>将菜单 / 标牌文本置于框内</Text>
          <View style={styles.guideFrame} />
          <Text style={styles.subHint}>自动识别本地语言并生成表达卡</Text>
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
  deniedLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  deniedTitle: {
    fontFamily: FONT.semibold,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  deniedHint: {
    fontFamily: FONT.regular,
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  deniedBtn: {
    marginTop: 8,
    backgroundColor: COLORS.accentBlue,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  deniedBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 9, 11, 0.45)',
  },
  guideLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  guideText: {
    fontFamily: FONT.regular,
    color: '#a1a1aa',
    fontSize: 13,
  },
  guideFrame: {
    width: 280,
    height: 200,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 16,
  },
  subHint: {
    fontFamily: FONT.regular,
    color: '#52525b',
    fontSize: 11,
  },
});
