import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { modelManager } from './src/utils/ModelManager';
import { initPack } from './src/packs/packManager';
import { MainPage } from './src/components/MainPage';

/**
 * SceneGo V3.1 — 单一随身工具（V2 四 Tab 页面体系已删除）。
 * App 仅为启动壳：字体加载 + 引擎初始化，唯一界面是 MainPage。
 */
export default function App() {
  // 字体加载：未就绪前保持启动画面（hooks 数量稳定，提前返回安全）
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
    'Inter-ExtraBold': require('./assets/fonts/Inter-ExtraBold.ttf'),
    'JetBrainsMono-Regular': require('./assets/fonts/JetBrainsMono-Regular.ttf'),
    'JetBrainsMono-Bold': require('./assets/fonts/JetBrainsMono-Bold.ttf'),
  });

  // 启动初始化：场景包（离线可用，后台尝试远程下发）与本地模型探测（无文件则静默跳过）
  useEffect(() => {
    initPack().catch((err) => console.warn('[ScenePack] 初始化失败:', err));
    modelManager.initializeExistingModels().then((loaded) => {
      if (loaded) {
        console.log('[Models] 本地模型已加载');
      }
    });
  }, []);

  if (!fontsLoaded) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b' }}
      >
        <ActivityIndicator size="large" color="#4fc3f7" />
      </View>
    );
  }

  return <MainPage />;
}
