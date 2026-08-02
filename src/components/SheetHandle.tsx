import React from 'react';
import { View, StyleSheet } from 'react-native';

/** 底部抽屉拖拽把手 + Home Indicator 安全区（spec §7.2） */
export const SheetHandle: React.FC = () => (
  <View style={styles.handleWrap}>
    <View style={styles.handle} />
  </View>
);

const styles = StyleSheet.create({
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
});

/** 底部抽屉安全区高度（Home Indicator，spec §7.2） */
export const SHEET_SAFE_BOTTOM = 34;
