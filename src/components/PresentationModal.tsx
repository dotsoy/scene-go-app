import React from 'react';
import { Modal, View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { FONT, COLORS } from '../theme/tokens';
import { ActionCardData } from './ActionCard';

interface PresentationModalProps {
  visible: boolean;
  card: ActionCardData | null;
  onClose: () => void;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  visible,
  card,
  onClose,
}) => {
  if (!card) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.contentBox}>
            {/* Top: Ultra Large Foreign Text for Local Person */}
            <Text style={styles.foreignText}>{card.foreignText}</Text>

            {/* Bottom: Native Explanation for User Verification */}
            <Text style={styles.nativeText}>{card.nativeText}</Text>
          </View>

          {/* Bottom Hint */}
          <Text style={styles.dismissHint}>点击任意区域退出展示</Text>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  contentBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  foreignText: {
    fontFamily: FONT.bold,
    fontSize: 34,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 46,
  },
  nativeText: {
    fontFamily: FONT.semibold,
    fontSize: 18,
    color: COLORS.accentYellow,
    textAlign: 'center',
    lineHeight: 26,
  },
  dismissHint: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 20,
  },
});
