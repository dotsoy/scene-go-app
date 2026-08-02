import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type ToolKind = 'logs' | 'history' | 'settings';

interface UtilityDrawerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (kind: ToolKind) => void;
  onDismiss?: () => void;
}

const TOOLS: Array<{ kind: ToolKind; title: string; desc: string }> = [
  { kind: 'logs', title: 'API 日志', desc: '查看接口请求与响应日志、网络耗时' },
  { kind: 'history', title: '对话记录', desc: '恢复历史快照的多轮追问会话' },
  { kind: 'settings', title: '识别引擎设置', desc: '切换识别引擎、配置 API Key' },
];

export const UtilityDrawerModal: React.FC<UtilityDrawerModalProps> = ({
  visible,
  onClose,
  onSelect,
  onDismiss,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>工具箱</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tool Rows */}
          {TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.kind}
              style={styles.toolRow}
              onPress={() => onSelect(tool.kind)}
              activeOpacity={0.75}
            >
              <View style={styles.toolInfo}>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolDesc}>{tool.desc}</Text>
              </View>
              <Text style={styles.toolArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#121214',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  title: {
    color: '#f4f4f5',
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#71717a',
    fontSize: 18,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  toolIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    color: '#f4f4f5',
    fontSize: 14,
    fontWeight: '600',
  },
  toolDesc: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 3,
  },
  toolArrow: {
    color: '#52525b',
    fontSize: 20,
    fontWeight: '700',
  },
});
