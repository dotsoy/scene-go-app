/**
 * 02 表达卡 · 成卡结果 屏。
 * 数据源：cardStackStore 当前卡（cards[index]）。我方表达 = 当前卡内容；
 * 建议回复取 card.reply.options（成卡时预生成），Phase 1 用 .pen 定稿的两条文案占位。
 * 点回复块「直出 replyCard」：cardStackStore.add(opt.replyCard)（SCN-27 决策）。
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from 'zustand';
import { cardStackStore, TAP_TALK_CARD } from '../core/cardStackStore';
import { ExpressionCard, BubbleProps } from '../components/ExpressionCard';
import { ReplyRow } from '../components/ReplyRow';
import { colors, fonts, radii } from '../theme/tokens';
import { ReplyOption } from '../core/types';

/** Phase 1 占位回复选项：.pen ReplyRow 定稿文案；后续由成卡时预生成替换 */
const FALLBACK_REPLY_OPTIONS: ReplyOption[] = [
  {
    label: '好的，谢谢',
    replyCard: {
      id: 'rep-thanks',
      categoryTag: 'REPLY',
      locationName: '当前位置',
      title: '致谢',
      targetText: 'ขอบคุณครับ',
      phonetic: 'kòp-kun kráp',
      subText: '',
      localTip: '礼貌致谢',
      languageCode: 'th-TH',
    },
  },
  {
    label: '太贵了，能便宜点吗',
    replyCard: {
      id: 'rep-price',
      categoryTag: 'REPLY',
      locationName: '当前位置',
      title: '议价',
      targetText: 'แพงไป ขอถูกลงหน่อยได้ไหม',
      phonetic: 'paeng pai kǒ tǔuk long nòi dâi mái',
      subText: '',
      localTip: '议价常用语',
      languageCode: 'th-TH',
    },
  },
];

export default function CardResultScreen() {
  const cards = useStore(cardStackStore, (s) => s.cards);
  const index = useStore(cardStackStore, (s) => s.index);
  const add = useStore(cardStackStore, (s) => s.add);

  const card = cards[index] ?? TAP_TALK_CARD;
  const replyOptions = card.reply?.options?.length ? card.reply.options : FALLBACK_REPLY_OPTIONS;

  const mine: BubbleProps = {
    who: '我的表达',
    whoColor: colors.accentBlue,
    foreign: card.targetText,
    phonetic: card.phonetic || undefined,
    zh: card.subText || card.title,
  };

  return (
    <View style={styles.screen}>
      {/* Head */}
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <Pressable style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.headTitle}>表达卡</Text>
            <Text style={styles.headLoc}>{card.locationName}</Text>
          </View>
        </View>
      </View>

      {/* 双气泡 + 建议回复 */}
      <View style={styles.content}>
        <ExpressionCard mine={mine} />
        <ReplyRow
          label="你可以这样接 · 点一下说给对方听"
          options={replyOptions}
          onSelect={(opt) => add(opt.replyCard)}
        />
      </View>

      {/* SafetyLink 占位 */}
      <Pressable style={styles.safetyLink}>
        <Text style={styles.safetyText}>查看 安全信息</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: 20,
  },
  head: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.textPrimary, fontSize: 26, lineHeight: 30, marginTop: -2 },
  headTitle: { fontFamily: fonts.body, fontSize: 16, color: colors.textPrimary },
  headLoc: { fontFamily: fonts.body, fontSize: 12, color: colors.textTertiary },
  content: { flex: 1, gap: 16, paddingVertical: 16 },
  safetyLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  safetyText: { fontFamily: fonts.body, fontSize: 12, color: colors.accentGreen },
});
