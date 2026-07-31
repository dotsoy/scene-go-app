import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import { CameraBackground } from './src/components/CameraBackground';
import { FlashCardView, CardData } from './src/components/FlashCardView';
import { ControlBar } from './src/components/ControlBar';
import { QuickNotesModal, NoteItem } from './src/components/QuickNotesModal';

const PRESET_CARDS: CardData[] = [
  {
    id: '1',
    categoryTag: 'TAXI / METER',
    locationName: 'BANGKOK AIRPORT (BKK)',
    title: '出租车按表计费声明',
    targetText: 'กรุณาเปิดมิเตอร์ด้วยครับ / ค่ะ',
    phonetic: 'Gru-na open meter krub/ka',
    english: 'Please use the meter.',
    localTip: '曼谷机场打车请前往 1 楼叫号机，按表付费另加 50 铢附加费。',
    languageCode: 'th-TH',
  },
  {
    id: '2',
    categoryTag: 'DINING / ALLERGY',
    locationName: 'SHINJUKU TOKYO',
    title: '餐食过敏与忌口说明',
    targetText: 'ピーナッツアレルギーがあります。',
    phonetic: 'Piinattsu arerugii ga arimasu',
    english: 'I have a peanut allergy.',
    localTip: '居酒屋默认自动提供“お通し”（开胃小菜，人头消费 300-500 日元）。',
    languageCode: 'ja-JP',
  },
  {
    id: '3',
    categoryTag: 'SHOPPING / TAX',
    locationName: 'CENTRAL WORLD BANGKOK',
    title: '购物退税单开具申请',
    targetText: 'ขอแบบฟอร์มคืนภาษี (Tax Refund) ด้วยครับ',
    phonetic: 'Kho baeb form kheen pha-si krub',
    english: 'Could I have a tax refund form, please?',
    localTip: '单日消费满 2,000 铢可开具退税单，离境在机场海关盖章。',
    languageCode: 'th-TH',
  },
  {
    id: '4',
    categoryTag: 'EMERGENCY / SOS',
    locationName: 'UNKNOWN LOCATION',
    title: '紧急大字求助与 GPS 坐标',
    targetText: 'Help! GPS: 13.7563° N, 100.5018° E',
    phonetic: 'Emergency call 1155 (Tourist Police)',
    english: 'I need urgent assistance.',
    localTip: '遭遇紧急危险请出示此卡，当地旅游警察专线：1155。',
    languageCode: 'en-US',
  },
];

export default function App() {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [cardIndex, setCardIndex] = useState<number>(0);

  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: 'n1',
      content: 'Bangkok Hotel Wi-Fi: BKK2026',
      category: 'TRIP',
      timestamp: '14:20',
    },
    {
      id: 'n2',
      content: 'Tax refund code: TX-984210',
      category: 'TAX',
      timestamp: '16:05',
    },
  ]);

  const currentCard = PRESET_CARDS[cardIndex];

  const handleNextScenario = () => {
    setCardIndex((prev) => (prev + 1) % PRESET_CARDS.length);
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

      <CameraBackground isCameraActive={isCameraActive}>
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
            <FlashCardView card={currentCard} />
          </View>

          {/* Bottom Floating Control Bar */}
          <ControlBar
            isCameraActive={isCameraActive}
            isMicActive={isMicActive}
            onToggleCamera={() => setIsCameraActive(!isCameraActive)}
            onToggleMic={() => setIsMicActive(!isMicActive)}
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
});
