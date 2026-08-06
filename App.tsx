import React, { useEffect } from 'react';
import { View } from 'react-native';
import { modelManager } from './src/utils/ModelManager';
import { initPack } from './src/packs/packManager';

/**
 * SceneGo — 启动壳。
 * 当前 UI 形态已整体删除（2026-08-06 用户拍板），仅保留功能内核初始化：
 * 场景包加载（离线可用，后台尝试远程下发）与本地模型探测（无文件则静默跳过）。
 * 渲染为空占位视图，UI 待重新设计。
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

  return <View style={{ flex: 1, backgroundColor: '#09090b' }} />;
}
