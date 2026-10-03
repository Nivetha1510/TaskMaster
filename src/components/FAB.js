import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

export default function FAB({ onPress }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Add task"
    >
      <Feather name="plus" size={28} color={COLORS.textOnPrimary} />
    </TouchableOpacity>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  fab: {
    position: 'absolute',
    right: SIZES.screenPadding,
    bottom: SPACING.xl,
    width: SIZES.fab,
    height: SIZES.fab,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});