/**
 * V2 底部 Tab 栏（56pt）：卡栈｜对话｜笔记｜更多。
 * 选中态：顶部 2pt 指示条 + 图标/标签 accentBlue 700；未选中 textTertiary 600。
 * 图标暂用文本符号（与 V1 控制栏一致，未引入图标库）。
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT, LAYOUT } from '../theme/tokens';
import { AppIcon, AppIconName } from './AppIcon';

export type TabKey = 'stack' | 'chat' | 'notes' | 'more';

const TABS: { key: TabKey; label: string; icon: AppIconName; activeIcon: AppIconName }[] = [
  { key: 'stack', label: '卡栈', icon: 'tabStack', activeIcon: 'tabStackActive' },
  { key: 'chat', label: '对话', icon: 'tabChat', activeIcon: 'tabChatActive' },
  { key: 'notes', label: '笔记', icon: 'tabNotes', activeIcon: 'tabNotesActive' },
  { key: 'more', label: '更多', icon: 'tabMore', activeIcon: 'tabMoreActive' },
];

interface TabBarProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ active, onChange }) => (
  <View style={styles.container}>
    <View style={styles.row}>
      {TABS.map((t) => {
        const selected = t.key === active;
        return (
          <TouchableOpacity
            key={t.key}
            style={styles.tab}
            onPress={() => onChange(t.key)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t.label}
            accessibilityState={{ selected }}
          >
            <View style={[styles.indicator, selected && styles.indicatorActive]} />
            <AppIcon name={selected ? t.activeIcon : t.icon} size={20} />
            <Text style={[styles.label, selected && styles.labelActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    height: LAYOUT.tabBarHeight,
    backgroundColor: COLORS.bgBar,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    gap: 2,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: COLORS.accentBlue,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
    fontFamily: FONT.regular,
  },
  labelActive: {
    color: COLORS.accentBlue,
    fontWeight: '700',
  },
});
