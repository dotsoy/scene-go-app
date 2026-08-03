/**
 * V2 对话页（01）：对话流渲染 + 语音转录横幅（实施稿 §3.1）。
 * 消息按 kind 分发：user 右气泡 / assistant 左气泡（解读带照片缩略）/ card 表达卡 / system 提示。
 * FlatList 反向滚动（最新在底部）。
 */
import React from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { COLORS, FONT } from '../theme/tokens';
import { ChatMessage } from '../core/types';
import { ExprCard } from './ExprCard';

interface ChatPageProps {
  messages: ChatMessage[];
  /** 录音态转录横幅 */
  isRecording: boolean;
  liveTranscript: string;
  onCardPress: (card: ChatMessage & { kind: 'card' }) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  messages,
  isRecording,
  liveTranscript,
  onCardPress,
}) => {
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    switch (item.kind) {
      case 'user':
        return (
          <View style={[styles.bubble, styles.userBubble]}>
            <Text style={styles.userLabel}>你</Text>
            <Text style={styles.userText}>{item.content}</Text>
          </View>
        );
      case 'assistant':
        return (
          <View style={[styles.bubble, styles.aiBubble]}>
            <Text style={styles.aiLabel}>{item.imageUri ? 'AI 解读' : 'AI 回复'}</Text>
            {item.imageUri ? (
              <Image source={{ uri: item.imageUri }} style={styles.thumbnail} resizeMode="cover" />
            ) : null}
            <Text style={styles.aiText}>{item.content}</Text>
          </View>
        );
      case 'card':
        return item.card ? (
          <ExprCard
            card={item.card}
            variant="chat"
            onPress={() => onCardPress(item as ChatMessage & { kind: 'card' })}
          />
        ) : null;
      case 'system':
        return <Text style={styles.systemText}>{item.content}</Text>;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={[...messages].reverse()}
        inverted
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
      {isRecording ? (
        <View style={styles.transcriptBar}>
          <View style={styles.transcriptTitleRow}>
            <Text style={styles.transcriptTitle}>实时语音转录中</Text>
            <Text style={styles.transcriptRec}>REC</Text>
          </View>
          <Text style={styles.transcriptText} numberOfLines={2}>
            {liveTranscript || '请说话，系统正在进行原生 0 延迟实时语音听写...'}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  bubble: {
    borderRadius: 12,
    padding: 10,
    maxWidth: '85%',
    gap: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.userBubble,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bgCardLight,
  },
  userLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentCyan,
    fontFamily: FONT.regular,
  },
  aiLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.accentBlue,
    fontFamily: FONT.regular,
  },
  userText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontFamily: FONT.regular,
  },
  aiText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19.5,
    fontFamily: FONT.regular,
  },
  thumbnail: {
    height: 96,
    borderRadius: 8,
    backgroundColor: COLORS.bgCard,
  },
  systemText: {
    alignSelf: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontFamily: FONT.regular,
  },
  transcriptBar: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: COLORS.bgOverlay,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    padding: 12,
    gap: 6,
  },
  transcriptTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transcriptTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accentCyan,
    fontFamily: FONT.regular,
  },
  transcriptRec: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentRed,
    letterSpacing: 1,
    fontFamily: FONT.monoBold,
  },
  transcriptText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: FONT.regular,
  },
});
