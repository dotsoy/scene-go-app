import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import { CameraBackground } from './src/components/CameraBackground';
import { FlashCardView, CardData } from './src/components/FlashCardView';
import { ControlBar } from './src/components/ControlBar';
import { QuickNotesModal, NoteItem } from './src/components/QuickNotesModal';

// 场景预设卡片模版库 (用于实测场景感知切卡)
const PRESET_CARDS: CardData[] = [
  {
    id: '1',
    scenarioTag: '机场打车 / 接机',
    locationName: '曼谷素万那普机场 (BKK)',
    title: '🚕 出租车按表计费卡',
    targetText: 'กรุณาเปิดมิเตอร์ด้วยครับ / ค่ะ',
    phonetic: 'Gru-na open meter krub/ka',
    english: 'Please use the meter.',
    localTip: '曼谷机场打车请前往 1 楼出租车叫号机，切勿搭乘 2 楼拉客黑车。按表付费另需付 50 铢机场附加费。',
    languageCode: 'th-TH',
    badgeColor: '#059669',
  },
  {
    id: '2',
    scenarioTag: '餐厅用餐 / 忌口',
    locationName: '东京新宿居酒屋',
    title: '🍲 用餐过敏/忌口沟通卡',
    targetText: 'ピーナッツアレルギーがあります。',
    phonetic: 'Piinattsu arerugii ga arimasu',
    english: 'I have a peanut allergy.',
    localTip: '日本居酒屋通常会自动提供“お通し”（开胃小菜），属于强制人头消费（约 300-500 日元），非账单算错。',
    languageCode: 'ja-JP',
    badgeColor: '#d97706',
  },
  {
    id: '3',
    scenarioTag: '商场购物 / 退税',
    locationName: '曼谷 Central World',
    title: '🧾 购物退税申请卡',
    targetText: 'ขอแบบฟอร์มคืนภาษี (Tax Refund) ด้วยครับ',
    phonetic: 'Kho baeb form kheen pha-si krub',
    english: 'Could I have a tax refund form, please?',
    localTip: '泰国同一商场消费满 2,000 铢可开具 P.P.10 退税单，离境时在机场海关盖章后办理退税。',
    languageCode: 'th-TH',
    badgeColor: '#2563eb',
  },
  {
    id: '4',
    scenarioTag: 'SOS 紧急救援',
    locationName: '异国未知偏僻区域',
    title: '🆘 紧急大字救援与 GPS 地址卡',
    targetText: 'Help! GPS: 13.7563° N, 100.5018° E',
    phonetic: 'Please send help to this coordinates',
    english: 'I need urgent assistance.',
    localTip: '遭遇紧急危险请第一时间出示此卡给路人，泰国旅游警察救援热线：1155（支持中文）。',
    languageCode: 'en-US',
    badgeColor: '#dc2626',
  },
];

export default function App() {
  // 核心 UI 状态控制
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [cardIndex, setCardIndex] = useState<number>(0);

  // Notes 随手记列表状态
  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: 'n1',
      content: '曼谷酒店大堂 Wi-Fi 密码：Bangkok2026',
      category: '出行备忘',
      timestamp: '14:20',
    },
    {
      id: 'n2',
      content: 'Central World 退税单号：TX-984210',
      category: '退税单号',
      timestamp: '16:05',
    },
  ]);

  const currentCard = PRESET_CARDS[cardIndex];

  // 快捷切场景
  const handleNextScenario = () => {
    setCardIndex((prev) => (prev + 1) % PRESET_CARDS.length);
  };

  // 新建随手记
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

      {/* 背景层：摄像头实景画面 vs 默认深色渐变 */}
      <CameraBackground isCameraActive={isCameraActive}>
        <View style={styles.mainLayout}>
          {/* 顶部 Header */}
          <View style={styles.topHeader}>
            <Text style={styles.brandTitle}>SceneGo <Text style={styles.brandSubtitle}>境随心动</Text></Text>
            <View style={styles.statusGroup}>
              <View style={[styles.statusDot, isMicActive ? styles.dotGreen : styles.dotGray]} />
              <Text style={styles.statusText}>{isMicActive ? 'AI 感知中' : '静态模式'}</Text>
            </View>
          </View>

          {/* 中央主体：零搜索高对比度大字闪示卡 */}
          <View style={styles.centerCardArea}>
            <FlashCardView card={currentCard} />
          </View>

          {/* 底部浮动快捷控制栏 */}
          <ControlBar
            isCameraActive={isCameraActive}
            isMicActive={isMicActive}
            onToggleCamera={() => setIsCameraActive(!isCameraActive)}
            onToggleMic={() => setIsMicActive(!isMicActive)}
            onOpenNotes={() => setIsNotesOpen(true)}
            onNextScenario={handleNextScenario}
          />
        </View>

        {/* Notes 快捷记录与检索 Modal */}
        <QuickNotesModal
          visible={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
          notes={notes}
          onAddNote={handleAddNote}
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
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: '#facc15',
    fontSize: 14,
    fontWeight: '600',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotGreen: {
    backgroundColor: '#10b981',
  },
  dotGray: {
    backgroundColor: '#71717a',
  },
  statusText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontWeight: '600',
  },
  centerCardArea: {
    flex: 1,
    justifyContent: 'center',
  },
});
