/**
 * 听对方说话（DESIGN-v2.1 §17）：一卡全览/单步的 🎙️ 入口。
 * 实时转写（DecodeBox）→ 停止后云端翻译 → 选择回应自动回卡。
 * 全组件只读 props，不订阅任何 store。
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, FONT } from '../theme/tokens';
import { CardData, ReplyOption } from '../core/types';

interface ListenReplyViewProps {
  card: CardData;
  isRecording: boolean;
  transcript: string;
  /** 停止后译文；null=未就绪 */
  translated: string | null;
  translateFailed: boolean;
  elapsedSec: number;
  onToggleMic: () => void;
  onRephrase: () => void;
  onBack: () => void;
  onReplyPick: (option: ReplyOption) => void;
  onClose: () => void;
}

const fmt = (sec: number) => {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const ListenReplyView: React.FC<ListenReplyViewProps> = ({
  card,
  isRecording,
  transcript,
  translated,
  translateFailed,
  elapsedSec,
  onToggleMic,
  onRephrase,
  onBack,
  onReplyPick,
  onClose,
}) => {
  const accentColor = card.steps?.[0]?.tagColor ?? COLORS.textSecondary;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 顶行：关闭 + 分类 + 位置 + 听对方说话胶囊 */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={8}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="关闭"
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <View style={styles.categoryPill}>
          <Text style={[styles.categoryText, { color: accentColor }]}>{card.categoryTag}</Text>
        </View>
        <Text style={styles.locationText} numberOfLines={1}>
          {card.locationName}
        </Text>
        <View style={styles.topSpacer} />
        <View style={styles.listenPill}>
          <Text style={styles.listenPillText}>🎙️ 听对方说话</Text>
        </View>
      </View>

      <Text style={styles.origin}>来自一卡全览 · 对方看完卡后回应</Text>

      {/* 听译卡 */}
      <View style={styles.listenCard}>
        <View style={styles.decodeBox}>
          <View style={styles.decodeTop}>
            <Text style={styles.decodeMic}>🎙️</Text>
            <Text style={styles.decodeTitle}>实时翻译</Text>
            <View style={styles.topSpacer} />
            <Text style={styles.decodeTimer}>{fmt(elapsedSec)}</Text>
          </View>
          <Text style={styles.thaiLine}>{transcript || '等待对方说话…'}</Text>
          <Text style={styles.cnLine}>
            {translated ?? (translateFailed ? '翻译暂不可用，可直接选择下方回应' : '翻译中…')}
          </Text>
        </View>

        {card.reply ? (
          <View style={styles.replyBlock}>
            <Text style={styles.replyLabel}>{card.reply.label}</Text>
            <View style={styles.replyRow}>
              {card.reply.options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.replyChip, opt.emoji === '✅' ? styles.replyChipOk : styles.replyChipNo]}
                  onPress={() => onReplyPick(opt)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                >
                  <Text style={styles.replyEmoji}>{opt.emoji}</Text>
                  <Text style={styles.replyText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.branchRow}>
          <TouchableOpacity
            style={styles.branchBtn}
            onPress={onBack}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="返回一卡全览"
          >
            <Text style={styles.branchBack}>‹ 返回一卡全览</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.branchBtn}
            onPress={onRephrase}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="换个说法"
          >
            <Text style={styles.branchRephrase}>换个说法</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 录音控制 */}
      <TouchableOpacity
        style={[styles.micToggle, isRecording ? styles.micToggleOn : styles.micToggleOff]}
        onPress={onToggleMic}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? '停止并翻译' : '开始听对方说话'}
      >
        <Text style={[styles.micToggleText, isRecording && styles.micToggleTextOn]}>
          {isRecording ? '⏹ 停止并翻译' : '🎙️ 开始听对方说话'}
        </Text>
      </TouchableOpacity>

      {/* 当地提示 */}
      <View style={styles.protoWrap}>
        <Text style={styles.protoHead}>当地提示</Text>
        <View style={styles.protoBox}>
          <Text style={styles.protoBody}>{card.localTip}</Text>
        </View>
      </View>

      <Text style={styles.swipeHint}>听对方说话：翻译 → 回应 → 返回全览继续</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgCardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  categoryPill: {
    backgroundColor: COLORS.bgCardLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontFamily: FONT.bold,
    fontSize: 11,
    letterSpacing: 1,
  },
  locationText: {
    fontFamily: FONT.regular,
    color: COLORS.textTertiary,
    fontSize: 12,
    flexShrink: 1,
  },
  topSpacer: {
    flex: 1,
  },
  listenPill: {
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listenPillText: {
    fontFamily: FONT.bold,
    color: '#0a0a1e',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  origin: {
    fontFamily: FONT.regular,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  listenCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  decodeBox: {
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  decodeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  decodeMic: {
    fontSize: 13,
  },
  decodeTitle: {
    fontFamily: FONT.bold,
    color: COLORS.accentCyan,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  decodeTimer: {
    fontFamily: FONT.mono,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  thaiLine: {
    fontFamily: FONT.regular,
    color: COLORS.textTertiary,
    fontSize: 12,
    lineHeight: 18,
  },
  cnLine: {
    fontFamily: FONT.semibold,
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  replyBlock: {
    gap: 6,
  },
  replyLabel: {
    fontFamily: FONT.regular,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  replyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  replyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  replyChipOk: {
    backgroundColor: COLORS.greenBg,
  },
  replyChipNo: {
    backgroundColor: COLORS.redBg,
  },
  replyEmoji: {
    fontSize: 13,
  },
  replyText: {
    fontFamily: FONT.bold,
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
  },
  branchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  branchBtn: {
    flex: 1,
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
  },
  branchBack: {
    fontFamily: FONT.bold,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  branchRephrase: {
    fontFamily: FONT.bold,
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  micToggle: {
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  micToggleOff: {
    backgroundColor: COLORS.accentCyan,
  },
  micToggleOn: {
    backgroundColor: COLORS.redBg,
  },
  micToggleText: {
    fontFamily: FONT.bold,
    color: '#0a0a1e',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  micToggleTextOn: {
    color: COLORS.accentRed,
  },
  protoWrap: {
    gap: 4,
  },
  protoHead: {
    fontFamily: FONT.mono,
    color: COLORS.textTertiary,
    fontSize: 10,
    letterSpacing: 1,
  },
  protoBox: {
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 10,
    padding: 12,
  },
  protoBody: {
    fontFamily: FONT.regular,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  swipeHint: {
    fontFamily: FONT.regular,
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});
