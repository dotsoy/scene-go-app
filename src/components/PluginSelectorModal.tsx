import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { pluginManager } from '../plugins';
import { ComplianceModal } from './ComplianceModal';
import {
  getOpenRouterApiKey,
  setOpenRouterApiKey,
  clearOpenRouterApiKey,
} from '../utils/SecureConfig';
import { COLORS, FONT } from '../theme/tokens';
import { SheetHandle, SHEET_SAFE_BOTTOM } from './SheetHandle';

interface PluginSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PluginSelectorModal: React.FC<PluginSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const [activeOcrId, setActiveOcrId] = useState(pluginManager.getActiveOcrId());
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setActiveOcrId(pluginManager.getActiveOcrId());
      getOpenRouterApiKey().then((key) => {
        setHasApiKey(!!key && key.trim().length > 0);
        if (key) setApiKeyInput(key.slice(0, 8) + '••••••••');
      });
    }
  }, [visible]);

  const handleSelectOcr = (id: string) => {
    pluginManager.setActiveOcr(id);
    setActiveOcrId(id);
  };

  const handleSaveApiKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed || trimmed.includes('••••')) {
      Alert.alert('提示', '请输入完整的 API Key');
      return;
    }
    await setOpenRouterApiKey(trimmed);
    setHasApiKey(true);
    Alert.alert('已保存', 'OpenRouter API Key 已保存');
  };

  const handleClearApiKey = async () => {
    await clearOpenRouterApiKey();
    setHasApiKey(false);
    setApiKeyInput('');
  };

  const ocrPlugins = pluginManager.getOcrPlugins();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <SheetHandle />
          {/* 标题栏 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>识别引擎设置</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="关闭"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* OCR 引擎选择：仅注册了多个引擎时才显示单选区，避免单一引擎时出现假选择 UI */}
          {ocrPlugins.length > 1 && (
            <>
              <Text style={styles.sectionTitle}>场景识别引擎</Text>
              {ocrPlugins.map((plugin) => (
                <TouchableOpacity
                  key={plugin.id}
                  style={[
                    styles.pluginRow,
                    activeOcrId === plugin.id && styles.pluginRowActive,
                  ]}
                  onPress={() => handleSelectOcr(plugin.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeOcrId === plugin.id }}
                >
                  <View style={styles.pluginInfo}>
                    <Text
                      style={[
                        styles.pluginName,
                        activeOcrId === plugin.id && styles.pluginNameActive,
                      ]}
                    >
                      {activeOcrId === plugin.id ? '● ' : '○ '}
                      {plugin.name}
                    </Text>
                    <Text style={styles.pluginDesc}>{plugin.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* 单一引擎时仅展示当前引擎信息 */}
          {ocrPlugins.length === 1 && (
            <View style={styles.singleEngineBox}>
              <Text style={styles.sectionTitle}>当前识别引擎</Text>
              <Text style={styles.singleEngineName}>{ocrPlugins[0].name}</Text>
              <Text style={styles.singleEngineDesc}>{ocrPlugins[0].description}</Text>
            </View>
          )}

          {/* API Key 配置 */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
            OpenRouter API Key
          </Text>
          <Text style={styles.apiKeyHint}>
            {hasApiKey
              ? '已配置 OpenRouter Key，填入新 Key 可更新。'
              : '免费注册 openrouter.ai 获取 Key 即可开启云端服务。'}
          </Text>
          <View style={styles.apiKeyRow}>
            <TextInput
              style={styles.apiKeyInput}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              placeholder="sk-or-v1-xxxx..."
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={false}
            />
          </View>
          <View style={styles.apiKeyActions}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveApiKey} accessibilityRole="button">
              <Text style={styles.saveBtnText}>保存 Key</Text>
            </TouchableOpacity>
            {hasApiKey && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearApiKey} accessibilityRole="button">
                <Text style={styles.clearBtnText}>清除 Key</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 状态指示 */}
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>
              当前模式：{activeOcrId === 'cloud-vlm' ? '云端识别' : '本地识别'}
            </Text>
            <Text style={styles.statusText}>
              API Key 状态：{hasApiKey ? '已配置' : '未配置'}
            </Text>
          </View>

          {/* 合规文档入口 */}
          <TouchableOpacity
            style={styles.complianceEntry}
            onPress={() => setIsComplianceOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.complianceEntryText}>隐私政策 · 用户协议 · 数据清单</Text>
            <Text style={styles.complianceEntryArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ComplianceModal visible={isComplianceOpen} onClose={() => setIsComplianceOpen(false)} />
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
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: FONT.bold,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: '#999',
    fontSize: 18,
  },
  sectionTitle: {
    fontFamily: FONT.semibold,
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  singleEngineBox: {
    backgroundColor: '#252540',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  singleEngineName: {
    fontFamily: FONT.bold,
    color: '#4fc3f7',
    fontSize: 15,
    fontWeight: '700',
  },
  singleEngineDesc: {
    color: '#777',
    fontSize: 12,
    marginTop: 4,
  },
  pluginRow: {
    backgroundColor: '#252540',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pluginRowActive: {
    borderColor: '#4fc3f7',
    backgroundColor: '#1e2d4a',
  },
  pluginInfo: {},
  pluginName: {
    fontFamily: FONT.semibold,
    color: '#ccc',
    fontSize: 15,
    fontWeight: '600',
  },
  pluginNameActive: {
    color: '#4fc3f7',
  },
  pluginDesc: {
    color: '#777',
    fontSize: 12,
    marginTop: 4,
  },
  apiKeyHint: {
    color: '#666',
    fontSize: 12,
    marginBottom: 8,
  },
  apiKeyRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  apiKeyInput: {
    flex: 1,
    backgroundColor: '#252540',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  apiKeyActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: '#4fc3f7',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  saveBtnText: {
    fontFamily: FONT.bold,
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  clearBtn: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  clearBtnText: {
    fontFamily: FONT.semibold,
    color: '#f44',
    fontWeight: '600',
    fontSize: 14,
  },
  statusRow: {
    backgroundColor: '#252540',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  statusText: {
    color: '#999',
    fontSize: 13,
  },
  complianceEntry: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  complianceEntryText: {
    fontFamily: FONT.semibold,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  complianceEntryArrow: {
    fontFamily: FONT.bold,
    color: COLORS.textTertiary,
    fontSize: 16,
  },
});
