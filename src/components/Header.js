import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { SIZES, SPACING } from '../theme/spacing';

export default function Header({ title, onBack, onAdd, right }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {onBack && (
          <TouchableOpacity onPress={onBack} hitSlop={10} accessibilityLabel="Go back">
            <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={[styles.side, styles.sideRight]}>
        {right ??
          (onAdd && (
            <TouchableOpacity onPress={onAdd} hitSlop={10} accessibilityLabel="Add">
              <Feather name="plus" size={26} color={COLORS.textPrimary} />
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    height: SIZES.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
  },
  side: {
    width: SIZES.headerSide,
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  title: {
    ...TYPOGRAPHY.screenTitle,
    flex: 1,
    textAlign: 'center',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.sm,
  },
});