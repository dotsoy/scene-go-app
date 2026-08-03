/**
 * V2 笔记页（04，Tab「笔记」）：搜索 + 分类过滤 + 列表 + 添加栏。
 * 数据源 noteStore（notes prop 由 App 持有并刷新）。
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NoteItem } from '../utils/NoteStore';
import { COLORS, FONT } from '../theme/tokens';

const CATEGORIES = ['ALL', 'VOUCHER', 'VOICE', 'CARD', 'BILL'];
const CATEGORY_COLORS: Record<string, string> = {
  VOUCHER: COLORS.accentYellow,
  VOICE: COLORS.accentCyan,
  CARD: COLORS.accentGreen,
  BILL: COLORS.textSecondary,
};

interface NotesPageProps {
  notes: NoteItem[];
  onAddNote: (content: string, category: string) => void;
  onDeleteNote: (id: string) => void;
}

export const NotesPage: React.FC<NotesPageProps> = ({ notes, onAddNote, onDeleteNote }) => {
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newCategory, setNewCategory] = useState('VOUCHER');

  const visible = notes.filter(
    (n) =>
      (filter === 'ALL' || n.category === filter) &&
      n.content.toLowerCase().includes(query.toLowerCase()),
  );

  const handleSave = () => {
    if (!newNote.trim()) return;
    onAddNote(newNote.trim(), newCategory);
    setNewNote('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>QUICK NOTES</Text>
      </View>
      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索笔记"
          placeholderTextColor={COLORS.textTertiary}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {/* 分类标签 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
        {CATEGORIES.map((c) => {
          const selected = c === filter;
          return (
            <TouchableOpacity
              key={c}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setFilter(c)}
            >
              <Text
                style={[
                  styles.chipText,
                  selected ? styles.chipTextSelected : { color: CATEGORY_COLORS[c] ?? COLORS.textSecondary },
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {/* 列表 */}
      <FlatList
        data={visible}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => (
          <View style={styles.noteRow}>
            <View
              style={[styles.noteDot, { backgroundColor: CATEGORY_COLORS[item.category] ?? COLORS.textSecondary }]}
            />
            <Text style={styles.noteContent} numberOfLines={2}>
              {item.content}
            </Text>
            <Text style={styles.noteTime}>{item.timestamp}</Text>
            <TouchableOpacity onPress={() => onDeleteNote(item.id)} hitSlop={8}>
              <Text style={styles.noteDelete}>×</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
      {/* 添加栏 */}
      <View style={styles.addBar}>
        <TextInput
          style={styles.addInput}
          placeholder="语音自动归档 · 手动输入凭证号"
          placeholderTextColor={COLORS.textTertiary}
          value={newNote}
          onChangeText={setNewNote}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>保存</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, paddingTop: 12 },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.textPrimary,
    fontFamily: FONT.monoBold,
  },
  searchBar: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 13 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 13, fontFamily: FONT.regular },
  chipsScroll: {
    maxHeight: 44,
  },
  chips: { paddingHorizontal: 20, paddingVertical: 6, gap: 8, alignItems: 'center' },
  chip: {
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: 'rgba(79, 195, 247, 0.12)',
    borderColor: COLORS.accentBlue,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, fontFamily: FONT.regular },
  chipTextSelected: { color: COLORS.accentBlue, fontWeight: '700' },
  list: { padding: 20, paddingTop: 8, gap: 10 },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    padding: 12,
  },
  noteDot: { width: 10, height: 10, borderRadius: 5 },
  noteContent: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, fontFamily: FONT.regular },
  noteTime: { fontSize: 11, color: COLORS.textMuted, fontFamily: FONT.mono },
  noteDelete: { fontSize: 16, color: COLORS.accentRed, fontWeight: '700' },
  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 12,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: FONT.regular,
  },
  saveBtn: {
    backgroundColor: COLORS.accentBlue,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#0a0a1e', fontSize: 13, fontWeight: '700', fontFamily: FONT.regular },
});
