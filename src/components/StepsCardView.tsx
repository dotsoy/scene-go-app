/**
 * 一卡全览 + 单步全屏大字（DESIGN-v2.1 §15/§16）。
 * 全览：多步骤收敛为一张卡，点步骤放大为全屏大字；
 * 单步：44pt 大字 + 播放/听对方说话/下一段。
 * 全组件只读 CardData，不订阅任何 store。
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Speech from 'expo-speech';
import { COLORS, FONT } from '../theme/tokens';
import { CardData, CardStep, ReplyOption } from '../core/types';

interface StepsCardViewProps {
  card: CardData;
  locationName: string;
  onClose: () => void;
  onListen: () => void;
  onReplyPick: (option: ReplyOption) => void;
}

type Mode = 'overview' | { step: number };

const speak = (text: string, languageCode: string) => {
  Speech.speak(text, { language: languageCode, pitch: 1.0, rate: 0.85 });
};

/** 步骤标签去装饰：去掉「①」前缀与「 · 点此放大」后缀 */
const cleanTag = (tag: string) =>
  tag.replace(/^[①②③④⑤]\s*/, '').replace(/·\s*点此放大$/, '').trim();

export const StepsCardView: React.FC<StepsCardViewProps> = ({
  card,
  locationName,
  onClose,
  onListen,
  onReplyPick,
}) => {
  const [mode, setMode] = useState<Mode>('overview');
  const steps: CardStep[] = card.steps ?? [];
  if (steps.length === 0) return null;

  const accentColor = steps[0].tagColor;
  const isOverview = mode === 'overview';
  const stepIndex = isOverview ? -1 : mode.step;
  const current = isOverview ? null : steps[stepIndex];

  const playAll = () => {
    steps.forEach((s) => speak(s.targetText, card.languageCode));
  };

  const renderStepBlock = (step: CardStep, idx: number, emphasized: boolean) => (
    <View key={idx} style={emphasized ? styles.stepHero : styles.stepPlain}>
      <Text style={[styles.stepTag, { color: step.tagColor }]}>{step.tag}</Text>
      <Text style={emphasized ? styles.stepHeroText : styles.stepPlainText}>{step.targetText}</Text>
      {step.phonetic ? (
        <Text style={emphasized ? styles.stepHeroPhonetic : styles.stepPlainMeta}>{step.phonetic}</Text>
      ) : null}
      {step.supplement ? (
        <Text style={emphasized ? styles.stepHeroSupplement : styles.stepPlainMeta}>
          {step.supplement}
        </Text>
      ) : null}
      {step.chips && step.chips.length > 0 ? (
        <View style={styles.chipRow}>
          {step.chips.map((c, i) => (
            <View key={i} style={styles.chip}>
              <Text style={styles.chipEmoji}>{c.emoji}</Text>
              <Text style={styles.chipLabel}>{c.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );

  const renderActionRow = (playLabel: string) => (
    <View style={styles.actionRow}>
      <TouchableOpacity
        style={styles.playBtn}
        onPress={playAll}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="播放全部"
      >
        <Text style={styles.playBtnText}>{playLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.listenBtn}
        onPress={onListen}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="听对方说话"
      >
        <Text style={styles.listenBtnText}>🎙️ 听对方说话</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLocalTip = () => (
    <View style={styles.protoWrap}>
      <Text style={styles.protoHead}>当地提示</Text>
      <View style={styles.protoBox}>
        <Text style={styles.protoBody}>{card.localTip}</Text>
      </View>
    </View>
  );

  if (isOverview) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 顶行：关闭 + 分类 + 位置 + 一卡全览胶囊 */}
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
            {locationName}
          </Text>
          <View style={styles.topSpacer} />
          <View style={styles.allPill}>
            <Text style={styles.allPillText}>{card.allPillText ?? '一卡全览'}</Text>
          </View>
        </View>

        {/* 引导语 */}
        {card.stepsLead ? <Text style={styles.lead}>{card.stepsLead}</Text> : null}

        {/* 一卡全览 */}
        <View style={styles.overviewCard}>
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 ? <View style={styles.divider} /> : null}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setMode({ step: idx })}
                accessibilityRole="button"
                accessibilityLabel={`第 ${idx + 1} 步，放大`}
              >
                {renderStepBlock(step, idx, idx === 0)}
              </TouchableOpacity>
            </React.Fragment>
          ))}
          {card.reply ? (
            <>
              <View style={styles.divider} />
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
            </>
          ) : null}
        </View>

        {renderActionRow('🔊 播放全部')}
        {renderLocalTip()}
        <Text style={styles.swipeHint}>主卡：全览 → 点步骤 → 全屏大字 → 听对方说话可随时进入</Text>
      </ScrollView>
    );
  }

  // 单步全屏
  const cur = current as CardStep;
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 顶行：关闭 + 分类 + 位置 + 返回一卡全览 */}
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
          {locationName}
        </Text>
        <View style={styles.topSpacer} />
        <TouchableOpacity
          style={styles.backPill}
          onPress={() => setMode('overview')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="返回一卡全览"
        >
          <Text style={styles.backPillText}>返回一卡全览</Text>
        </TouchableOpacity>
      </View>

      {/* 步骤标签 + 提示 */}
      <View style={styles.stepWrap}>
        <Text style={[styles.stepLabel, { color: cur.tagColor }]}>
          第 {stepIndex + 1} 步 / 共 {steps.length} 步 · {cleanTag(cur.tag)}
        </Text>
        <Text style={styles.stepHint}>点击全屏 · 单独强调</Text>
      </View>

      {/* 44pt 大字区 */}
      <View style={styles.bigArea}>
        <Text style={styles.bigText}>{cur.targetText}</Text>
        {cur.phonetic ? <Text style={styles.bigPhonetic}>{cur.phonetic}</Text> : null}
        {cur.supplement ? <Text style={styles.bigSupplement}>{cur.supplement}</Text> : null}
        {cur.chips && cur.chips.length > 0 ? (
          <View style={styles.chipRow}>
            {cur.chips.map((c, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipEmoji}>{c.emoji}</Text>
                <Text style={styles.chipLabel}>{c.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {renderActionRow('🔊 播放')}

      {/* 下一段（末步不显示） */}
      {stepIndex < steps.length - 1 ? (
        <TouchableOpacity
          style={styles.nextStep}
          onPress={() => setMode({ step: stepIndex + 1 })}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="下一段"
        >
          <Text style={styles.nextStepText}>下一段 →</Text>
        </TouchableOpacity>
      ) : null}

      {renderLocalTip()}
      <Text style={styles.swipeHint}>交付终端：单步全屏大字 → 返回一卡全览</Text>
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
  allPill: {
    backgroundColor: COLORS.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  allPillText: {
    fontFamily: FONT.bold,
    color: COLORS.accentGreen,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  backPill: {
    backgroundColor: COLORS.bgCardLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  backPillText: {
    fontFamily: FONT.bold,
    color: COLORS.textSecondary,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  lead: {
    fontFamily: FONT.regular,
    color: COLORS.textMuted,
    fontSize: 11,
    paddingTop: 2,
  },
  overviewCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
  },
  stepHero: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  stepHeroText: {
    fontFamily: FONT.extrabold,
    color: '#ffffff',
    fontSize: 26,
    lineHeight: 34,
  },
  stepHeroPhonetic: {
    fontFamily: FONT.regular,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  stepHeroSupplement: {
    fontFamily: FONT.regular,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  stepPlain: {
    gap: 3,
    paddingVertical: 2,
  },
  stepPlainText: {
    fontFamily: FONT.bold,
    color: COLORS.textPrimary,
    fontSize: 20,
    lineHeight: 28,
  },
  stepPlainMeta: {
    fontFamily: FONT.regular,
    color: COLORS.textTertiary,
    fontSize: 12,
  },
  stepTag: {
    fontFamily: FONT.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  chipEmoji: {
    fontSize: 11,
  },
  chipLabel: {
    fontFamily: FONT.semibold,
    color: COLORS.textPrimary,
    fontSize: 11,
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playBtn: {
    flex: 1,
    backgroundColor: COLORS.accentBlue,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  playBtnText: {
    fontFamily: FONT.bold,
    color: '#0a0a1e',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  listenBtn: {
    flex: 1,
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  listenBtnText: {
    fontFamily: FONT.regular,
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  stepWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepLabel: {
    fontFamily: FONT.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  stepHint: {
    fontFamily: FONT.regular,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  bigArea: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bigText: {
    fontFamily: FONT.extrabold,
    color: '#ffffff',
    fontSize: 44,
    lineHeight: 57,
    letterSpacing: 0.5,
  },
  bigPhonetic: {
    fontFamily: FONT.regular,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  bigSupplement: {
    fontFamily: FONT.regular,
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  nextStep: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  nextStepText: {
    fontFamily: FONT.semibold,
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 0.5,
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
