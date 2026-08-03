import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, FONT } from '../theme/tokens';
import { SheetHandle, SHEET_SAFE_BOTTOM } from './SheetHandle';
import { PRIVACY_POLICY, TERMS_OF_SERVICE, DATA_SHEET, ComplianceDoc } from '../data/compliance';

interface ComplianceModalProps {
  visible: boolean;
  onClose: () => void;
}

const DOCS: ComplianceDoc[] = [PRIVACY_POLICY, TERMS_OF_SERVICE, DATA_SHEET];

/** 合规文档查看：隐私政策 / 用户协议 / 数据清单（上架审核与用户知情） */
export const ComplianceModal: React.FC<ComplianceModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const activeDoc = DOCS[activeTab];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <SheetHandle />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>隐私 · 协议 · 数据</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabRow}>
            {DOCS.map((doc, idx) => (
              <TouchableOpacity
                key={doc.title}
                style={[styles.tab, idx === activeTab && styles.tabActive]}
                onPress={() => setActiveTab(idx)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, idx === activeTab && styles.tabTextActive]}>{doc.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.updatedAt}>更新日期：{activeDoc.updatedAt}</Text>

          <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
            {activeDoc.sections.map((sec) => (
              <View key={sec.heading} style={styles.section}>
                <Text style={styles.sectionHeading}>{sec.heading}</Text>
                <Text style={styles.sectionBody}>{sec.body}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: SHEET_SAFE_BOTTOM,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 12,
  },
  headerTitle: {
    fontFamily: FONT.bold,
    color: COLORS.textPrimary,
    fontSize: 17,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: COLORS.textTertiary,
    fontSize: 18,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.bgCardLight,
    borderColor: COLORS.borderLight,
  },
  tabText: {
    fontFamily: FONT.semibold,
    color: COLORS.textTertiary,
    fontSize: 12,
  },
  tabTextActive: {
    color: COLORS.accentYellow,
  },
  updatedAt: {
    fontFamily: FONT.regular,
    color: COLORS.textTertiary,
    fontSize: 11,
    marginBottom: 8,
  },
  bodyScroll: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingBottom: 24,
  },
  section: {
    marginBottom: 14,
  },
  sectionHeading: {
    fontFamily: FONT.semibold,
    color: COLORS.textPrimary,
    fontSize: 14,
    marginBottom: 6,
  },
  sectionBody: {
    fontFamily: FONT.regular,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});
