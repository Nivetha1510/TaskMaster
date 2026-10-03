import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING } from '../theme/spacing';

// One row inside a SettingsGroup. Pass `onPress` to make it tappable (shows a chevron),
// or `right` to show your own control (such as a Switch) instead.
export default function SettingsRow({
  icon,
  label,
  value,
  onPress,
  right,
  destructive = false,
  showDivider = false,
}) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const color = destructive ? COLORS.error : COLORS.textPrimary;
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.row, showDivider && styles.divider]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Feather name={icon} size={20} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {right ??
        (onPress && !destructive ? (
          <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
        ) : null)}
    </Container>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  label: {
    ...TYPOGRAPHY.body,
    flex: 1,
    marginLeft: SPACING.md,
  },
  value: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
});
