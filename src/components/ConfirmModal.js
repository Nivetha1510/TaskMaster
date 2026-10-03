import React, { useMemo } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import PrimaryButton from './PrimaryButton';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Delete',
  onConfirm,
  onCancel,
}) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        {/* The inner Pressable stops taps on the card from closing it */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttons}>
            <PrimaryButton title="Cancel" onPress={onCancel} style={styles.button} />
            <PrimaryButton
              title={confirmText}
              variant="danger"
              onPress={onConfirm}
              style={styles.button}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    backgroundColor: COLORS.overlay,
  },
  card: {
    width: '100%',
    maxWidth: SIZES.modalMaxWidth,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
  },
  title: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.textPrimary,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  buttons: {
    flexDirection: 'row',
    marginTop: SPACING.xl,
  },
  button: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
});
