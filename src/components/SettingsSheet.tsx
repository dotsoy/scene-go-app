import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, FONT } from '../theme/tokens';
import { AppSettings, TARGET_LANGS, MODEL_OPTIONS } from '../utils/appSettings';
import { COUNTRY_SAFETY } from '../data/countrySafety';
import { getOpenRouterApiKey, setOpenRouterApiKey } from '../utils/SecureConfig';
import { chatCompletions } from '../utils/aiGateway';

interface SettingsSheetProps {
  visible: boolean;
  settings: AppSettings;
  onClose: () => void;
  /** 保存回调：key 为空串表示清除；持久化由 MainPage 负责 */
  onSave: (key: string, settings: AppSettings) => void;
}

type StatusKind = '' | 'ok' | 'err';

/** 设置底部抽屉（对齐 Open Design 原型 settings-sheet）：API Key / 目标语言 / 模型 / 连接测试 / 保存 */
export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  visible,
  settings,
  onClose,
  onSave,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [countryCode, setCountryCode] = useState(settings.countryCode);
  const [targetLang, setTargetLang] = useState(settings.targetLang);
  const [model, setModel] = useState(settings.model);
  const [status, setStatus] = useState<{ text: string; kind: StatusKind }>({ text: '', kind: '' });
  const [testing, setTesting] = useState(false);

  // 每次打开回填表单 + 状态行
  useEffect(() => {
    if (!visible) return;
    setKeyInput('');
    setCountryCode(settings.countryCode);
    setTargetLang(settings.targetLang);
    setModel(settings.model);
    (async () => {
      const key = await getOpenRouterApiKey().catch(() => '');
      setStatus(
        key
          ? { text: '已保存设置 · 已启用真实 AI', kind: 'ok' }
          : { text: '填入 API Key 即可连接真实 AI；留空则使用内置演示数据', kind: '' },
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const testConnection = async () => {
    const key = keyInput.trim();
    if (!key) {
      setStatus({ text: '请先粘贴 OpenRouter API Key', kind: 'err' });
      return;
    }
    setStatus({ text: '连接中…', kind: '' });
    setTesting(true);
    const prev = await getOpenRouterApiKey().catch(() => '');
    await setOpenRouterApiKey(key);
    try {
      const r = await chatCompletions({
        messages: [{ role: 'user', content: 'ping' }],
        model,
      });
      if (r.ok && r.status === 200) {
        setStatus({ text: '连接成功 · 模型可用', kind: 'ok' });
      } else {
        setStatus(
          { text: r.status === 0 ? '连接失败：网络异常' : `连接失败：HTTP ${r.status}`, kind: 'err' },
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus({ text: `连接失败：${msg}`, kind: 'err' });
    } finally {
      await setOpenRouterApiKey(prev);
      setTesting(false);
    }
  };

  const handleSave = () => {
    const country = COUNTRY_SAFETY.find((c) => c.code === countryCode);
    onSave(keyInput.trim(), {
      countryCode,
      countryZh: country?.nameZh ?? '泰国',
      targetLang,
      targetLangCode: TARGET_LANGS.find((l) => l.name === targetLang)?.code ?? 'th-TH',
      model,
    });
    setStatus(
      keyInput.trim()
        ? { text: '已保存 · 已启用真实 AI', kind: 'ok' }
        : { text: '已保存 · 当前为离线演示模式', kind: '' },
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.title}>设置</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="关闭设置">
              <Text style={styles.closeText}>关闭</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            <View style={styles.field}>
              <Text style={styles.label}>OpenRouter API Key</Text>
              <TextInput
                style={styles.input}
                value={keyInput}
                onChangeText={setKeyInput}
                placeholder="sk-or-v1-…"
                placeholderTextColor={COLORS.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.hint}>
                粘贴 API Key 后即可调用真实 AI 翻译 / 识图；留空则使用内置演示数据。Key 仅保存在本机。
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>目的地国家 / 地区</Text>
              <View style={styles.countryGrid}>
                {COUNTRY_SAFETY.map((c) => (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.countryChip, countryCode === c.code && styles.countryChipActive]}
                    onPress={() => setCountryCode(c.code)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: countryCode === c.code }}
                  >
                    <Text style={[styles.countryChipText, countryCode === c.code && styles.countryChipTextActive]}>
                      {c.nameZh}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>目标语言</Text>
              <View style={styles.chipRow}>
                {TARGET_LANGS.map((l) => (
                  <TouchableOpacity
                    key={l.code}
                    style={[styles.chip, targetLang === l.name && styles.chipActive]}
                    onPress={() => setTargetLang(l.name)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: targetLang === l.name }}
                  >
                    <Text style={[styles.chipText, targetLang === l.name && styles.chipTextActive]}>
                      {l.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>模型</Text>
              <View style={styles.modelList}>
                {MODEL_OPTIONS.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.modelItem, model === m.id && styles.modelItemActive]}
                    onPress={() => setModel(m.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: model === m.id }}
                  >
                    <Text style={[styles.modelText, model === m.id && styles.modelTextActive]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.testBtn}
                onPress={testConnection}
                disabled={testing}
                accessibilityRole="button"
              >
                <Text style={styles.testBtnText}>{testing ? '测试中…' : '连接测试'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} accessibilityRole="button">
                <Text style={styles.saveBtnText}>保存</Text>
              </TouchableOpacity>
            </View>

            {status.text ? (
              <Text style={[styles.status, status.kind === 'ok' && styles.statusOk, status.kind === 'err' && styles.statusErr]}>
                {status.text}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: '#161618',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingTop: 18,
    paddingBottom: 34,
    paddingHorizontal: 20,
    gap: 14,
    maxHeight: '85%',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: FONT.bold,
    fontSize: 15,
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  closeText: {
    fontFamily: FONT.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    padding: 6,
  },
  scrollBody: {
    gap: 14,
    paddingBottom: 8,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: FONT.monoBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONT.regular,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textTertiary,
    lineHeight: 17,
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  countryChip: {
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  countryChipActive: {
    backgroundColor: 'rgba(79,195,247,0.18)',
    borderColor: 'rgba(79,195,247,0.5)',
  },
  countryChipText: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  countryChipTextActive: {
    color: COLORS.accentBlue,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: 'rgba(79,195,247,0.18)',
    borderColor: 'rgba(79,195,247,0.5)',
  },
  chipText: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.accentBlue,
  },
  modelList: {
    gap: 6,
  },
  modelItem: {
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modelItemActive: {
    borderColor: 'rgba(79,195,247,0.5)',
    backgroundColor: 'rgba(79,195,247,0.12)',
  },
  modelText: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  modelTextActive: {
    color: COLORS.accentBlue,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  testBtn: {
    flex: 1,
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  testBtnText: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: FONT.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  status: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
  },
  statusOk: {
    color: COLORS.accentGreen,
  },
  statusErr: {
    color: '#f4706c',
  },
});
