import React, { useState, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import * as Speech from 'expo-speech';
import { ScenarioResult, ChatTurn } from '../plugins/types';

interface SnapshotDialogModalProps {
  visible: boolean;
  imageUri: string | null;
  scenarioResult?: ScenarioResult | null;
  /** 多轮对话流：首条为场景解读，其后为追问与回答 */
  turns: ChatTurn[];
  onClose: () => void;
  onSubmit: (prompt: string, imageUri: string) => void;
}

export const SnapshotDialogModal: React.FC<SnapshotDialogModalProps> = ({
  visible,
  imageUri,
  scenarioResult,
  turns,
  onClose,
  onSubmit,
}) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [isFullImageVisible, setIsFullImageVisible] = useState(false);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  // 恢复的旧会话图片可能已被系统清理（缓存失效），加载失败时降级为占位
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    setIsFullImageVisible(false);
  }, [visible, imageUri]);

  const handleSpeak = (textToSpeak: string) => {
    if (!textToSpeak) return;
    setIsPlayingSpeech(true);
    Speech.speak(textToSpeak, {
      language: 'zh-CN',
      onDone: () => setIsPlayingSpeech(false),
      onError: () => setIsPlayingSpeech(false),
    });
  };

  const handleSend = () => {
    const trimmed = userPrompt.trim();
    if (!trimmed || !imageUri) return;
    onSubmit(trimmed, imageUri);
    setUserPrompt('');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.dialogCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {scenarioResult?.category || 'SCENE'}
                </Text>
              </View>
              <Text style={styles.headerTitle}>
                {scenarioResult?.title || '快照与场景解读'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Image Preview */}
            {imageUri && !imageFailed && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setIsFullImageVisible(!isFullImageVisible)}
                style={styles.imageContainer}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={[styles.thumbnail, isFullImageVisible && styles.fullImage]}
                  resizeMode={isFullImageVisible ? 'contain' : 'cover'}
                  onError={() => setImageFailed(true)}
                />
                <Text style={styles.imageHint}>
                  {isFullImageVisible ? '点击缩小' : '点击查看大图'}
                </Text>
              </TouchableOpacity>
            )}
            {imageUri && imageFailed && (
              <View style={styles.imageFallback}>
                <Text style={styles.imageFallbackText}>
                  原始图片已过期，对话内容仍可查看与追问
                </Text>
              </View>
            )}

            {/* 多轮对话流：首条为场景解读，其后为追问问答 */}
            <View style={styles.chatSection}>
              <Text style={styles.sectionLabel}>场景解读与追问：</Text>
              {turns.length === 0 ? (
                <View style={[styles.bubbleRow, styles.aiRow]}>
                  <View style={[styles.bubble, styles.aiBubble]}>
                    <Text style={styles.aiBubbleText}>
                      {scenarioResult?.translatedText || '已为您分析快照信息。'}
                    </Text>
                  </View>
                </View>
              ) : (
                turns.map((turn, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.bubbleRow,
                      turn.role === 'user' ? styles.userRow : styles.aiRow,
                    ]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        turn.role === 'user' ? styles.userBubble : styles.aiBubble,
                      ]}
                    >
                      <Text
                        style={
                          turn.role === 'user' ? styles.userBubbleText : styles.aiBubbleText
                        }
                      >
                        {turn.content}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Safety Tips */}
            {scenarioResult?.tips && scenarioResult.tips.length > 0 && (
              <View style={styles.tipsContainer}>
                <Text style={styles.sectionLabel}>出行避坑与注意事项：</Text>
                {scenarioResult.tips.map((tip, idx) => (
                  <View key={idx} style={styles.tipRow}>
                    <Text style={styles.tipDot}>•</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommended Phrases */}
            {scenarioResult?.recommendedPhrases && scenarioResult.recommendedPhrases.length > 0 && (
              <View style={styles.phrasesContainer}>
                <Text style={styles.sectionLabel}>常用交流短语（点击朗读）：</Text>
                <View style={styles.phraseChipRow}>
                  {scenarioResult.recommendedPhrases.map((phrase, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.phraseChip}
                      onPress={() => handleSpeak(phrase)}
                    >
                      <Text style={styles.phraseText}>{phrase}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Input */}
          <View style={styles.footerInputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="追问细节 (如: 价格包含服务费吗?)"
              placeholderTextColor="#71717a"
              value={userPrompt}
              onChangeText={setUserPrompt}
            />

            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Text style={styles.sendBtnText}>发送</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  dialogCard: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#a1a1aa',
    fontSize: 18,
  },
  scrollBody: {
    marginBottom: 12,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#09090b',
  },
  thumbnail: {
    width: '100%',
    height: 140,
  },
  fullImage: {
    height: 280,
  },
  imageHint: {
    color: '#71717a',
    fontSize: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b',
    borderRadius: 12,
    paddingVertical: 28,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderStyle: 'dashed',
  },
  imageFallbackText: {
    color: '#71717a',
    fontSize: 12,
  },
  sectionLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  chatSection: {
    marginBottom: 12,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '88%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
  },
  userBubble: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#27272a',
    borderBottomLeftRadius: 4,
  },
  userBubbleText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  aiBubbleText: {
    color: '#e4e4e7',
    fontSize: 14,
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: '#27272a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  tipDot: {
    color: '#38bdf8',
    marginRight: 6,
    fontSize: 14,
  },
  tipText: {
    color: '#e4e4e7',
    fontSize: 12,
    flex: 1,
  },
  phrasesContainer: {
    marginBottom: 12,
  },
  phraseChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  phraseChip: {
    backgroundColor: '#3f3f46',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  phraseText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  footerInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#09090b',
    color: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
  },
  sendBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
