import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder } from 'react-native';

interface ControlBarProps {
  isCameraActive: boolean;
  isMicActive: boolean;
  isCardVisible: boolean;
  onToggleCamera: () => void;
  onCaptureFrame: () => void;
  /** 相机开启时取消：退出取景但不触发云端分析 */
  onCancelCamera: () => void;
  onToggleMic: () => void;
  onToggleCard: () => void;
  onOpenNotes: () => void;
  /** 打开工具箱抽屉（收纳 LOG/对话记录/设置） */
  onOpenTools: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isCameraActive,
  isMicActive,
  isCardVisible,
  onToggleCamera,
  onCaptureFrame,
  onCancelCamera,
  onToggleMic,
  onToggleCard,
  onOpenNotes,
  onOpenTools,
}) => {
  // SNAP 长按上滑取消：点按 = 拍照分析；长按 450ms 后上滑 = 退出取景不分析
  const LONG_PRESS_MS = 450;
  const SWIPE_UP_THRESHOLD = -40;
  const cancelArmedRef = useRef(false);
  const longPressFiredRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cancelArmed, setCancelArmed] = useState(false);

  const cleanupHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    cancelArmedRef.current = false;
    setCancelArmed(false);
  };

  const snapPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          longPressFiredRef.current = false;
          cancelArmedRef.current = false;
          holdTimerRef.current = setTimeout(() => {
            longPressFiredRef.current = true;
            cancelArmedRef.current = true;
            setCancelArmed(true);
          }, LONG_PRESS_MS);
        },
        onPanResponderMove: (_evt, gesture) => {
          if (cancelArmedRef.current && gesture.dy < SWIPE_UP_THRESHOLD) {
            // 长按达标 + 上滑：退出取景，不触发云端分析
            cleanupHold();
            onCancelCamera();
          }
        },
        onPanResponderRelease: (_evt, gesture) => {
          const wasTap =
            !longPressFiredRef.current &&
            Math.abs(gesture.dx) < 12 &&
            Math.abs(gesture.dy) < 12;
          cleanupHold();
          if (wasTap) {
            onCaptureFrame();
          }
        },
        onPanResponderTerminate: cleanupHold,
      }),
    [onCaptureFrame, onCancelCamera],
  );
  return (
    <View style={styles.barContainer}>
      {/* 摄像头开关与实时截图按键：点按 = 拍照分析；长按后上滑 = 取消不分析 */}
      {isCameraActive ? (
        <TouchableOpacity
          style={[
            styles.btn,
            cancelArmed ? styles.btnCancelArmed : styles.btnActiveSnap,
          ]}
          {...snapPanResponder.panHandlers}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.btnTextSnap,
              cancelArmed && styles.btnTextCancelArmed,
            ]}
            numberOfLines={1}
          >
            {cancelArmed ? '上滑取消' : 'SNAP & OFF'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.btn, styles.btnMuted]} onPress={onToggleCamera} activeOpacity={0.75}>
          <Text style={styles.btnText} numberOfLines={1}>CAM OFF</Text>
        </TouchableOpacity>
      )}

      {/* 麦克风开关 */}
      <TouchableOpacity
        style={[styles.btn, isMicActive ? styles.btnActive : styles.btnMuted]}
        onPress={onToggleMic}
        activeOpacity={0.75}
      >
        <Text style={[styles.btnText, isMicActive && styles.btnTextActive]} numberOfLines={1}>
          {isMicActive ? 'MIC ON' : 'MIC OFF'}
        </Text>
      </TouchableOpacity>

      {/* FlashCard 开关 */}
      <TouchableOpacity
        style={[styles.btn, isCardVisible ? styles.btnActive : styles.btnMuted]}
        onPress={onToggleCard}
        activeOpacity={0.75}
      >
        <Text style={[styles.btnText, isCardVisible && styles.btnTextActive]} numberOfLines={1}>
          {isCardVisible ? 'CARD ON' : 'CARD OFF'}
        </Text>
      </TouchableOpacity>

      {/* Notes 检索与纪录 */}
      <TouchableOpacity style={[styles.btn, styles.btnMuted]} onPress={onOpenNotes} activeOpacity={0.75}>
        <Text style={styles.btnText} numberOfLines={1}>NOTES</Text>
      </TouchableOpacity>

      {/* 工具箱入口 */}
      <TouchableOpacity style={[styles.btn, styles.btnMuted]} onPress={onOpenTools} activeOpacity={0.75}>
        <Text style={styles.btnText} numberOfLines={1}>MORE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(10,10,30,0.85)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    minWidth: 46,
    alignItems: 'center',
  },
  btnMuted: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  btnActive: {
    backgroundColor: 'rgba(76,175,80,0.25)',
  },
  btnActiveSnap: {
    backgroundColor: 'rgba(244,67,54,0.35)',
  },
  btnCancelArmed: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  btnText: {
    color: '#777',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnTextActive: {
    color: '#81C784',
  },
  btnTextSnap: {
    color: '#ef5350',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnTextCancelArmed: {
    color: '#ffffff',
  },
});
