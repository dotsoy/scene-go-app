import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SavedSession } from '../utils/SessionStore';
import { COLORS, FONT } from '../theme/tokens';
import { SheetHandle, SHEET_SAFE_BOTTOM } from './SheetHandle';

interface SessionHistoryModalProps {
  visible: boolean;
  sessions: SavedSession[];
  onClose: () => void;
  onSelect: (session: SavedSession) => void;
  onDelete: (id: string) => void;
}

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
  visible,
  sessions,
  onClose,
  onSelect,
  onDelete,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <SheetHandle />
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>对话记录</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="关闭"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.sessionCard}
                onPress={() => onSelect(item)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`恢复对话：${item.title}`}
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onDelete(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="删除此对话"
                  >
                    <Text style={styles.deleteText}>删除</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.sessionMeta}>
                  {item.timestamp} · {item.turns.length} 轮对话
                  {item.imageUri ? ' · 含图片' : ''}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>暂无历史对话</Text>
                <Text style={styles.emptySubText}>
                  拍摄快照并与 AI 追问后，会话将自动保存于此。
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    padding: 16,
  
      paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontFamily: FONT.bold,
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#64748b',
    fontSize: 18,
  },
  listContent: {
    paddingBottom: 20,
  },
  sessionCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sessionTitle: {
    fontFamily: FONT.semibold,
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  deleteText: {
    fontFamily: FONT.semibold,
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionMeta: {
    color: '#94a3b8',
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: FONT.semibold,
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubText: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
