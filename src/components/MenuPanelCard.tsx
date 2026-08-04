/**
 * 菜单解读助手面板（DESIGN-v2.1 §18）：VLM 结构化菜单的对话流展示。
 * 招牌必点 → 避坑预警 → 菜品清单（含 出卡 按钮）。
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT } from '../theme/tokens';
import { MenuData, MenuDish } from '../core/types';

interface MenuPanelCardProps {
  menu: MenuData;
  onOrder: (dish: MenuDish) => void;
}

export const MenuPanelCard: React.FC<MenuPanelCardProps> = ({ menu, onOrder }) => (
  <View style={styles.panel}>
    {/* 面板头 */}
    <View style={styles.panelHead}>
      <Text style={styles.panelEmoji}>🍲</Text>
      <Text style={styles.panelTitle}>菜单解读助手</Text>
    </View>

    {/* 招牌必点 */}
    {menu.signature.length > 0 ? (
      <View style={styles.section}>
        <Text style={styles.sectionHead}>🌟 招牌必点</Text>
        {menu.signature.map((d, i) => (
          <View key={i} style={styles.sigRow}>
            <Text style={styles.star}>⭐</Text>
            <Text style={styles.dishName}>{d.zh}</Text>
            <Text style={styles.dishEn} numberOfLines={1}>
              {d.en}
            </Text>
            <Text style={styles.price}>{d.price}</Text>
          </View>
        ))}
      </View>
    ) : null}

    {/* 避坑预警 */}
    {menu.allergenWarn ? (
      <View style={styles.warnBox}>
        <Text style={styles.warnText}>⚠️ {menu.allergenWarn}</Text>
      </View>
    ) : null}

    {/* 菜品清单 */}
    {menu.dishes.length > 0 ? (
      <View style={styles.section}>
        <Text style={styles.sectionHead}>🌶️ 菜品清单 · 辣度与价格</Text>
        {menu.dishes.map((d, i) => (
          <View key={i} style={styles.dishRow}>
            <Text style={styles.dishName} numberOfLines={1}>
              {d.zh}
            </Text>
            <Text style={[styles.spice, d.spice.includes('🌶️') ? styles.spiceHot : styles.spiceMild]}>
              {d.spice}
            </Text>
            <Text style={styles.price}>{d.price}</Text>
            <TouchableOpacity
              style={styles.orderBtn}
              onPress={() => onOrder(d)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`为${d.zh}生成点餐卡`}
            >
              <Text style={styles.orderBtnText}>出卡</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 14,
    gap: 8,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  panelEmoji: {
    fontSize: 15,
  },
  panelTitle: {
    fontFamily: FONT.bold,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  section: {
    gap: 8,
  },
  sectionHead: {
    fontFamily: FONT.bold,
    color: COLORS.accentYellow,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  sigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  star: {
    fontSize: 12,
    color: COLORS.accentYellow,
  },
  dishName: {
    fontFamily: FONT.semibold,
    color: COLORS.textPrimary,
    fontSize: 13,
    flexShrink: 1,
  },
  dishEn: {
    fontFamily: FONT.regular,
    color: COLORS.textTertiary,
    fontSize: 11,
    flex: 1,
  },
  price: {
    fontFamily: FONT.regular,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  warnBox: {
    backgroundColor: COLORS.redBg,
    borderRadius: 10,
    padding: 10,
  },
  warnText: {
    fontFamily: FONT.semibold,
    color: COLORS.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 8,
    padding: 8,
  },
  spice: {
    fontFamily: FONT.regular,
    fontSize: 12,
  },
  spiceHot: {
    color: COLORS.accentRed,
  },
  spiceMild: {
    color: COLORS.textMuted,
  },
  orderBtn: {
    backgroundColor: COLORS.accentBlue,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  orderBtnText: {
    fontFamily: FONT.bold,
    color: '#0a0a1e',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
