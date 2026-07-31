import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import { CameraBackground } from './src/components/CameraBackground';
import { FlashCardView, CardData } from './src/components/FlashCardView';
import { ControlBar } from './src/components/ControlBar';
import { QuickNotesModal, NoteItem } from './src/components/QuickNotesModal';
import { SnapshotDialogModal } from './src/components/SnapshotDialogModal';

// 卡片预设测试数据（全部采用中文展示与测试）
const SCENARIO_GENERATORS: Record<string, (location: string) => CardData> = {
  AIRPORT_TAXI: (loc) => ({
    id: 'sc-1',
    categoryTag: '打车 / 计价器',
    locationName: loc,
    title: '出租车按表计费声明',
    targetText: '请按表计费，谢谢（请打表）',
    phonetic: 'Qing An Biao Ji Fei, Xie Xie',
    english: '请使用计价器按标准费率打表',
    localTip: '曼谷机场打车请前往 1 楼叫号机，按表付费另加 50 铢附加费。',
    languageCode: 'zh-CN',
  }),
  DINING_ORDER: (loc) => ({
    id: 'sc-2',
    categoryTag: '餐饮 / 忌口过敏',
    locationName: loc,
    title: '餐食过敏与忌口说明',
    targetText: '我对花生严重过敏，请勿添加',
    phonetic: 'Wo Dui Hua Sheng Yan Zhong Guo Min',
    english: '请确保菜品无花生及花生制品',
    localTip: '居酒屋默认自动提供开胃小菜（お通し，人头消费 300-500 日元）。',
    languageCode: 'zh-CN',
  }),
  TAX_REFUND: (loc) => ({
    id: 'sc-3',
    categoryTag: '购物 / 退税',
    locationName: loc,
    title: '购物退税单开具申请',
    targetText: '请帮我开具退税申请单，谢谢',
    phonetic: 'Qing Bang Wo Kai Ju Tui Shui Dan',
    english: '请开具官方退税凭证与表格',
    localTip: '单日消费满 2,000 铢可开具退税单，离境在机场海关盖章。',
    languageCode: 'zh-CN',
  }),
  EMERGENCY_SOS: (loc) => ({
    id: 'sc-4',
    categoryTag: '紧急 / 救援',
    locationName: loc,
    title: '紧急大字求助与 GPS 坐标',
    targetText: '求助！请协助联系警察并定位此坐标',
    phonetic: 'Qiu Zhu! Qing Xie Zhu Lian Xi Jing Cha',
    english: '紧急联系电话：旅游警察专线 1155',
    localTip: '遭遇紧急危险请出示此卡给路人，当地旅游警察专线：1155。',
    languageCode: 'zh-CN',
  }),
};

const SCENARIO_KEYS = Object.keys(SCENARIO_GENERATORS);
const MOCK_LOCATIONS = [
  '曼谷素万那普机场 (BKK)',
  '东京新宿居酒屋',
  '曼谷 CENTRAL WORLD 商场',
  '未知异国位置',
];

export default function App() {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false); // 麦克风默认 OFF
  const [isCardVisible, setIsCardVisible] = useState<boolean>(true);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);

  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState<boolean>(false);
  const [pendingSnapshotUri, setPendingSnapshotUri] = useState<string | null>(null);

  const [scenarioIndex, setScenarioIndex] = useState<number>(0);
  const cameraRef = useRef<any>(null);

  const sendSnapshotAndPromptToAI = async (imageUri: string, userPrompt: string) => {
    console.log('[AI TODO] Sending to AI Vision VLM:', { imageUri, userPrompt });
  };

  const handleCaptureFrame = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        if (photo?.uri) {
          setIsCameraActive(false);
          setPendingSnapshotUri(photo.uri);
          setIsSnapshotModalOpen(true);
        }
      } catch (err) {
        console.warn('Camera snapshot error:', err);
        setIsCameraActive(false);
      }
    } else {
      setIsCameraActive(false);
    }
  };

  const handleSnapshotSubmit = async (userPrompt: string, imageUri: string) => {
    setIsSnapshotModalOpen(false);
    await sendSnapshotAndPromptToAI(imageUri, userPrompt);
  };

  const activeScenarioKey = SCENARIO_KEYS[scenarioIndex];
  const activeLocation = MOCK_LOCATIONS[scenarioIndex];
  const currentCard = SCENARIO_GENERATORS[activeScenarioKey](activeLocation);

  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: 'n1',
      content: '曼谷酒店 Wi-Fi 密码: BKK2026',
      category: 'TRIP',
      timestamp: '14:20',
    },
    {
      id: 'n2',
      content: '退税单号记录: TX-984210',
      category: 'TAX',
      timestamp: '16:05',
    },
  ]);

  const handleNextScenario = () => {
    setScenarioIndex((prev) => (prev + 1) % SCENARIO_KEYS.length);
  };

  const handleAddNote = (content: string, category: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newEntry: NoteItem = {
      id: Date.now().toString(),
      content,
      category,
      timestamp: timeStr,
    };
    setNotes([newEntry, ...notes]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" />

      <CameraBackground isCameraActive={isCameraActive} cameraRef={cameraRef}>
        <View style={styles.mainLayout}>
          {/* Top Header */}
          <View style={styles.topHeader}>
            <Text style={styles.brandTitle}>SCENEGO</Text>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, isMicActive ? styles.dotGreen : styles.dotGray]} />
              <Text style={styles.statusText}>{isMicActive ? 'LIVE' : 'IDLE'}</Text>
            </View>
          </View>

          {/* Center Card */}
          <View style={styles.centerCardArea}>
            {isCardVisible ? (
              <FlashCardView card={currentCard} />
            ) : (
              <View style={styles.hiddenCardContainer}>
                <Text style={styles.hiddenCardText}>CARD HIDDEN</Text>
              </View>
            )}
          </View>

          {/* Bottom Floating Control Bar */}
          <ControlBar
            isCameraActive={isCameraActive}
            isMicActive={isMicActive}
            isCardVisible={isCardVisible}
            onToggleCamera={() => setIsCameraActive(!isCameraActive)}
            onCaptureFrame={handleCaptureFrame}
            onToggleMic={() => setIsMicActive(!isMicActive)}
            onToggleCard={() => setIsCardVisible(!isCardVisible)}
            onOpenNotes={() => setIsNotesOpen(true)}
            onNextScenario={handleNextScenario}
          />
        </View>

        <QuickNotesModal
          visible={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
          notes={notes}
          onAddNote={handleAddNote}
        />

        <SnapshotDialogModal
          visible={isSnapshotModalOpen}
          imageUri={pendingSnapshotUri}
          onClose={() => setIsSnapshotModalOpen(false)}
          onSubmit={handleSnapshotSubmit}
        />
      </CameraBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  mainLayout: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotGreen: {
    backgroundColor: '#10b981',
  },
  dotGray: {
    backgroundColor: '#52525b',
  },
  statusText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  centerCardArea: {
    flex: 1,
    justifyContent: 'center',
  },
  hiddenCardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenCardText: {
    color: '#52525b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
