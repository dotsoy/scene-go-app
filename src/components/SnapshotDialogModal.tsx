import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface SnapshotDialogModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onSubmit: (prompt: string, imageUri: string) => void;
}

export const SnapshotDialogModal: React.FC<SnapshotDialogModalProps> = ({
  visible,
  imageUri,
  onClose,
  onSubmit,
}) => {
  const [userPrompt, setUserPrompt] = useState('');

  const quickPrompts = [
    '翻译菜单并看下含过敏原吗',
    '确认出租车按表计费说明',
    '翻译此指示牌/单号',
    '帮忙沟通询问退税细节',
  ];

  const handleSend = () => {
    if (!imageUri) return;
    onSubmit(userPrompt.trim(), imageUri);
    setUserPrompt('');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.dialogContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI VISION INTERACTION</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>CANCEL</Text>
            </TouchableOpacity>
          </View>

          {/* 快照预览缩略图 */}
          {imageUri && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.thumbnailImage} />
              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>SNAPSHOT CAPTURED</Text>
              </View>
            </View>
          )}

          {/* 用户自定义输入框 */}
          <Text style={styles.inputLabel}>PROMPT / INSTRUCTION FOR AI</Text>
          <TextInput
            style={styles.promptInput}
            placeholder="如：帮看下菜单含不含花生过敏原..."
            placeholderTextColor="#52525b"
            value={userPrompt}
            onChangeText={setUserPrompt}
            multiline
          />

          {/* 快捷 Prompt 标签 */}
          <View style={styles.quickRow}>
            {quickPrompts.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.quickPill}
                onPress={() => setUserPrompt(item)}
              >
                <Text style={styles.quickPillText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 发送给 AI 按钮 */}
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.8}>
            <Text style={styles.sendBtnText}>SEND SNAPSHOT & PROMPT TO AI</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dialogContent: {
    backgroundColor: '#121214',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  closeBtnText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  previewContainer: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  previewBadgeText: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  inputLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  promptInput: {
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  quickPill: {
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  quickPillText: {
    color: '#d4d4d8',
    fontSize: 11,
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
