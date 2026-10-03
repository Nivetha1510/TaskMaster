import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

// A titled card that holds SettingsRow children.
export default function SettingsGroup({ title, children }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const rows = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.wrapper}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.card}>
        {rows.map((row, index) => React.cloneElement(row, { showDivider: index > 0 }))}
      </View>
    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  card: {
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: SIZES.cardBorder,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.background,
  },
});
