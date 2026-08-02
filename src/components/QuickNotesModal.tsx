import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NoteItem } from '../utils/NoteStore';
import * as Clipboard from 'expo-clipboard';

interface QuickNotesModalProps {
  visible: boolean;
  onClose: () => void;
  notes: NoteItem[];
  onAddNote: (content: string, category: string) => void;
  onDeleteNote: (id: string) => void;
}

export const QuickNotesModal: React.FC<QuickNotesModalProps> = ({
  visible,
  onClose,
  notes,
  onAddNote,
  onDeleteNote,
}) => {
  const [newNote, setNewNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('VOUCHER');
  const [searchQuery, setSearchQuery] = useState('');
  // 全屏大字展示的笔记
  const [displayNote, setDisplayNote] = useState<NoteItem | null>(null);
  // 列表分类过滤 tab（'ALL' 或分类名）
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const categories = ['VOUCHER', 'VOICE', 'CARD', 'BILL'];

  const filteredNotes = notes.filter(
    (item) =>
      (categoryFilter === 'ALL' || item.category === categoryFilter) &&
      (item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSave = () => {
    if (!newNote.trim()) return;
    onAddNote(newNote.trim(), selectedCategory);
    setNewNote('');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      {displayNote ? (
        /* 全屏大字展示：适合递给司机/前台/店员查看 */
        <View style={styles.displayOverlay}>
          <TouchableOpacity
            style={styles.displayBackdrop}
            activeOpacity={1}
            onPress={() => setDisplayNote(null)}
          />
          <View style={styles.displayCard}>
            <Text style={styles.displayMeta}>
              {displayNote.category} · {displayNote.timestamp}
            </Text>
            <Text style={styles.displayText} selectable>
              {displayNote.content}
            </Text>
            <View style={styles.displayActions}>
              <TouchableOpacity
                style={styles.displayBtn}
                onPress={() => Clipboard.setStringAsync(displayNote.content)}
              >
                <Text style={styles.displayBtnText}>复制</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.displayBtn}
                onPress={() => setDisplayNote(null)}
              >
                <Text style={styles.displayBtnText}>关闭</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>QUICK NOTES</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>

          {/* 搜索框 */}
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search notes, bills, codes..."
              placeholderTextColor="#52525b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* 记录区 */}
          <View style={styles.inputArea}>
            <TextInput
              style={styles.noteInput}
              placeholder="Write note or memo..."
              placeholderTextColor="#52525b"
              value={newNote}
              onChangeText={setNewNote}
              multiline
            />
            {/* 分类 PILS */}
            <View style={styles.tagRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.tag, selectedCategory === cat && styles.activeTag]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.tagText, selectedCategory === cat && styles.activeTagText]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
              <Text style={styles.submitBtnText}>SAVE NOTE</Text>
            </TouchableOpacity>
          </View>

          {/* 分类过滤 tab */}
          <View style={styles.filterRow}>
            {['ALL', ...categories].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterTag, categoryFilter === cat && styles.filterTagActive]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text
                  style={[
                    styles.filterTagText,
                    categoryFilter === cat && styles.filterTagTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 列表 */}
          <Text style={styles.sectionTitle}>
            RECENT ({filteredNotes.length})
          </Text>
          <FlatList
            data={filteredNotes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.noteCard}
                activeOpacity={0.85}
                onPress={() => setDisplayNote(item)}
              >
                <View style={styles.noteHeader}>
                  <Text style={styles.noteCategory}>{item.category}</Text>
                  <View style={styles.noteHeaderRight}>
                    <TouchableOpacity
                      onPress={() => Clipboard.setStringAsync(item.content)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.copyText}>复制</Text>
                    </TouchableOpacity>
                    <Text style={styles.noteTime}>{item.timestamp}</Text>
                    <TouchableOpacity
                      onPress={() => onDeleteNote(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.deleteText}>删除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.noteText}>{item.content}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {notes.length === 0
                  ? '暂无笔记，输入文字或使用语音听写后自动归档'
                  : '无匹配记录'}
              </Text>
            }
            contentContainerStyle={styles.listContent}
          />
        </View>
      </KeyboardAvoidingView>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121214',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  displayOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  displayCard: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    maxWidth: 480,
    width: '100%',
  },
  displayMeta: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  displayText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: 0.5,
  },
  displayActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  displayBtn: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  displayBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  closeBtnText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  searchBox: {
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchInput: {
    height: 40,
    color: '#ffffff',
    fontSize: 13,
  },
  inputArea: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  noteInput: {
    color: '#ffffff',
    fontSize: 13,
    minHeight: 44,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  activeTag: {
    backgroundColor: '#ffffff',
  },
  tagText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
  },
  activeTagText: {
    color: '#000000',
  },
  submitBtn: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    color: '#52525b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  filterTag: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterTagActive: {
    backgroundColor: '#ffffff',
  },
  filterTagText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
  },
  filterTagTextActive: {
    color: '#000000',
  },
  listContent: {
    paddingBottom: 20,
  },
  noteCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  copyText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '600',
  },
  noteCategory: {
    color: '#e4e4e7',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  noteTime: {
    color: '#52525b',
    fontSize: 10,
  },
  noteText: {
    color: '#d4d4d8',
    fontSize: 13,
    lineHeight: 18,
  },
  emptyText: {
    color: '#52525b',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 12,
  },
});
