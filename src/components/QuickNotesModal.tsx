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

export interface NoteItem {
  id: string;
  content: string;
  category: string;
  timestamp: string;
}

interface QuickNotesModalProps {
  visible: boolean;
  onClose: () => void;
  notes: NoteItem[];
  onAddNote: (content: string, category: string) => void;
}

export const QuickNotesModal: React.FC<QuickNotesModalProps> = ({ visible, onClose, notes, onAddNote }) => {
  const [newNote, setNewNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('出行备忘');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['出行备忘', '酒店账单', '退税单号', '本地防坑'];

  const filteredNotes = notes.filter(
    (item) =>
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = () => {
    if (!newNote.trim()) return;
    onAddNote(newNote.trim(), selectedCategory);
    setNewNote('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📝 异国随手记 Notes</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 实时模糊检索框 */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="搜索随手记、单号、备忘内容..."
              placeholderTextColor="#71717a"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 新增记录输入框 */}
          <View style={styles.inputArea}>
            <TextInput
              style={styles.noteInput}
              placeholder="输入临时单号、门牌号、小费备注..."
              placeholderTextColor="#71717a"
              value={newNote}
              onChangeText={setNewNote}
              multiline
            />
            {/* 分类标签选择 */}
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
              <Text style={styles.submitBtnText}>+ 快速保存记录</Text>
            </TouchableOpacity>
          </View>

          {/* 记录列表 */}
          <Text style={styles.sectionTitle}>
            历史记录 ({filteredNotes.length})
          </Text>
          <FlatList
            data={filteredNotes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <Text style={styles.noteCategory}>[{item.category}]</Text>
                  <Text style={styles.noteTime}>{item.timestamp}</Text>
                </View>
                <Text style={styles.noteText}>{item.content}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>暂无符合要求的记录</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#a1a1aa',
    fontSize: 20,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#ffffff',
    fontSize: 14,
  },
  clearIcon: {
    color: '#a1a1aa',
    fontSize: 16,
    padding: 4,
  },
  inputArea: {
    backgroundColor: '#27272a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  noteInput: {
    color: '#ffffff',
    fontSize: 14,
    minHeight: 50,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#3f3f46',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  activeTag: {
    backgroundColor: '#7c3aed',
  },
  tagText: {
    color: '#d4d4d8',
    fontSize: 12,
  },
  activeTagText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  noteCard: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteCategory: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '700',
  },
  noteTime: {
    color: '#71717a',
    fontSize: 11,
  },
  noteText: {
    color: '#f4f4f5',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    color: '#71717a',
    textAlign: 'center',
    marginVertical: 20,
  },
});
