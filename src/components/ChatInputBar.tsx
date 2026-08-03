/**
 * V2 常驻输入栏（72pt）：[📷 CAM] [🎙️ MIC] [输入框] [⬆️ 发送]。
 * 三模态输入统一入口；🎙️ 录音态变红；发送触发打字/追问链路。
 */
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT, LAYOUT } from '../theme/tokens';

interface ChatInputBarProps {
  /** 录音态（🎙️ 变红） */
  isRecording: boolean;
  onCamera: () => void;
  onMicToggle: () => void;
  onSend: (text: string) => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  isRecording,
  onCamera,
  onMicToggle,
  onSend,
}) => {
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft('');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={onCamera} activeOpacity={0.7}>
        <Text style={styles.btnIcon}>📷</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, isRecording && styles.btnRecording]}
        onPress={onMicToggle}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnIcon, isRecording && styles.btnIconRecording]}>🎙️</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="说出需求 / 打字 / 拍照..."
        placeholderTextColor={COLORS.textTertiary}
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={handleSend}
        returnKeyType="send"
        multiline={false}
      />
      <TouchableOpacity style={[styles.btn, styles.btnSend]} onPress={handleSend} activeOpacity={0.7}>
        <Text style={styles.btnSendIcon}>↑</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: LAYOUT.inputBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.bgBar,
    borderRadius: 16,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.bgCardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRecording: {
    backgroundColor: COLORS.redBg,
  },
  btnIcon: {
    fontSize: 18,
  },
  btnIconRecording: {
    // 录音态图标视觉：由背景色区分
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.bgCardLight,
    paddingHorizontal: 12,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: FONT.regular,
  },
  btnSend: {
    backgroundColor: COLORS.accentBlue,
  },
  btnSendIcon: {
    fontSize: 18,
    color: '#0a0a1e',
    fontWeight: '700',
  },
});
