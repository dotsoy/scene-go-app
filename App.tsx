import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { modelManager } from './src/utils/ModelManager';
import { initPack } from './src/packs/packManager';
import CardResultScreen from './src/screens/CardResultScreen';
import { colors } from './src/theme/tokens';

/**
 * SceneGo — 启动壳。
 * 初始化功能内核（场景包 + 本地模型），渲染 02 表达卡·成卡结果 屏（Phase 1）。
 */
export default function App() {
  useEffect(() => {
    initPack().catch((err) => console.warn('[ScenePack] 初始化失败:', err));
    modelManager.initializeExistingModels().then((loaded) => {
      if (loaded) {
        console.log('[Models] 本地模型已加载');
      }
    });
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <CardResultScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
});
