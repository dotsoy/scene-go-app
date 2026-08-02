import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { apiLogger, ApiLogEntry } from '../utils/ApiLogger';
import { COLORS, FONT } from '../theme/tokens';
import { SheetHandle, SHEET_SAFE_BOTTOM } from './SheetHandle';

interface ApiLogModalProps {
  visible: boolean;
  onClose: () => void;
  /** iOS dismiss 动画完成后的回调（用于串行化后续 modal present，避免 UIKit modal 队列冲突） */
  onDismiss?: () => void;
}

function truncateText(text?: string, maxLength: number = 2500): string {
  if (!text) return '无';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + `\n... [数据过长已自动截断 (${text.length} 字符)]`;
}

export const ApiLogModal: React.FC<ApiLogModalProps> = ({ visible, onClose, onDismiss }) => {
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLogs([...apiLogger.getLogs()]);
    const unsub = apiLogger.subscribe(() => {
      setLogs([...apiLogger.getLogs()]);
    });
    return () => {
      unsub();
    };
  }, [visible]);

  const handleClose = () => {
    setSelectedLogId(null);
    onClose();
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      onDismiss={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <SheetHandle />
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>API 请求/响应 日志监控</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => apiLogger.clear()} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>清空</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Log List */}
          <ScrollView style={styles.logList}>
            {logs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>尚无 API 请求纪录</Text>
                <Text style={styles.emptySubText}>
                  拍摄快照或追问细节后，接口发送与接收的数据将在此即时显示。
                </Text>
              </View>
            ) : (
              logs.map((log) => (
                <TouchableOpacity
                  key={log.id}
                  style={[
                    styles.logCard,
                    selectedLogId === log.id && styles.logCardSelected,
                  ]}
                  onPress={() =>
                    setSelectedLogId(selectedLogId === log.id ? null : log.id)
                  }
                >
                  <View style={styles.logHeaderRow}>
                    <Text style={styles.timestamp}>{log.timestamp}</Text>
                    <Text style={styles.modelTag}>{log.model}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        log.type === 'RESPONSE'
                          ? styles.statusSuccess
                          : log.type === 'ERROR'
                          ? styles.statusError
                          : styles.statusPending,
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {log.type === 'REQUEST'
                          ? '发送中...'
                          : log.status
                          ? `${log.status} (${log.durationMs}ms)`
                          : '错误'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.urlText} numberOfLines={1}>
                    {log.url}
                  </Text>

                  {/* Expanded Detail */}
                  {selectedLogId === log.id && (
                    <View style={styles.detailBox}>
                      <Text style={styles.detailLabel}>请求 Body:</Text>
                      <Text style={styles.detailCode}>
                        {truncateText(log.requestBody)}
                      </Text>

                      <Text style={[styles.detailLabel, { marginTop: 10 }]}>
                        响应 Body:
                      </Text>
                      <Text style={styles.detailCode}>
                        {truncateText(log.responseBody, 4000)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
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
    height: '80%',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearBtnText: {
    fontFamily: FONT.semibold,
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#64748b',
    fontSize: 18,
  },
  logList: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  logCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logCardSelected: {
    borderColor: '#38bdf8',
    backgroundColor: '#0f2942',
  },
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  timestamp: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: FONT.mono,
  },
  modelTag: {
    fontFamily: FONT.semibold,
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusPending: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  statusText: {
    fontFamily: FONT.semibold,
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
  },
  urlText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontFamily: FONT.mono,
  },
  detailBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  detailLabel: {
    fontFamily: FONT.semibold,
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailCode: {
    color: '#e2e8f0',
    fontSize: 11,
    fontFamily: FONT.mono,
    backgroundColor: '#090d16',
    padding: 8,
    borderRadius: 6,
  },
});
